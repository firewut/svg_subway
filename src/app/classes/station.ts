import { ElementType, ElementParams, Point2D, TextElement, LocationMarker } from './element';
import { Line } from './line';
import { StationTransfer } from './transfer';
import { Theme } from '../../themes/theme';
import { settings } from '../../themes/default';
import { shadeHexColor, makeid } from './helper';
import { Direction, VectorDirection } from './direction';

export class StationLink {
  direction: Direction;
  length: number;
  station?: string;

  get_opposite_link(link: StationLink) {
    const vector = new VectorDirection(link.direction);

    const opposite_link = {
      direction: vector.get_opposite_direction(),
      length: link.length,
    };

    return opposite_link;
  }
}

export class Station {
  id: string;
  name: string;
  name_location: Direction = Direction.West;
  position?: Point2D;
  links: StationLink[];

  line: Line;
  _parents?: string[] = [];
  parents: Station[] = [];
  _children?: string[] = [];
  children: Station[] = [];

  has_transfers = false;
  raw_transfers?: any;
  transfers?: StationTransfer[];

  // start, middle, end
  text_anchor = 'middle';

  text_position: Point2D;
  under_construction = false;
  is_name_hidden = false;

  element_params: ElementParams[] = [];
  svg_elements: svgjs.Container[] = [];
  svg_marker_elements: svgjs.Container[] = [];

  private click_toggle = false;
  private location_marker: svgjs.Shape;
  private theme: Theme;

  constructor(line: Line, json: any) {
    this.id = makeid();
    this.line = line;
    this.links = json.links || [];

    // Position is a Relative GRID coordinate
    this.position = new Point2D(
      json.x * settings.grid.width,
      json.y * settings.grid.height,
    );
    this.text_position = new Point2D(
      this.position.x,
      this.position.y
    );
    if ('under_construction' in json) {
      this.under_construction = json.under_construction;
    }
    if ('transfers' in json) {
      this.has_transfers = true;
      this.raw_transfers = json.transfers;
      this.transfers = [];
    }

    this._parents = json.parents;

    if ('name' in json) {
      this.name = json.name.value;
      if ('location' in json.name) {
        this.name_location = json.name.location;
      }
    }
  }

  hide_name() {
    this.is_name_hidden = true;
  }

  parse_parents() {
    if (this._parents) {
      for (const parent of this._parents) {
        for (const _station of this.line.stations) {
          if (parent === _station.name) {
            this.add_parent(_station);
            _station.add_children(this);
          }
        }
      }
    }
  }

  has_link_to(station: Station) {
    let link: StationLink;

    for (const _link of this.links) {
      if (_link.station === station.name) {
        link = _link;
        break;
      }
    }

    return link;
  }

  get_next_link() {
    let link: StationLink;
    const next = this.children[0];

    if (next) {
      link = next.has_link_to(this);
      if (link === undefined && next.links.length === 1) {
        link = next.links[0];
      }
    }

    return link;
  }

  get_parent_link() {
    let link: StationLink;
    const prev = this.parents[0];

    if (prev) {
      link = prev.has_link_to(this);
      if (link === undefined && prev.links.length === 1) {
        link = prev.links[0];
      }
    }

    return link;
  }

  get_text_position(font_size: number) {
    const position = new Point2D(this.position.x, this.position.y);

    let lines_count = 0;
    let max_length = 0;
    for (const line of this.name.split('\n')) {
      lines_count += 1;
      if (line.length > max_length) {
        max_length = line.length;
      }
    }

    if (max_length === 0) {
      max_length = this.name.length;
    }
    const text_margin = font_size / 2;
    const magic_lines_multiplier = 1.3;

    let dx = 1;
    let dy = 1;

    switch (this.name_location) {
      case Direction.West:
        this.text_anchor = 'end';
        dx -= font_size * 0.8;
        dy -= text_margin * magic_lines_multiplier;
        break;
      case Direction.East:
        this.text_anchor = 'start';
        dx += text_margin * magic_lines_multiplier;
        dy -= text_margin * magic_lines_multiplier;
        break;
      case Direction.North:
        this.text_anchor = 'middle';
        dy -= text_margin + (font_size * lines_count) * magic_lines_multiplier;
        break;
      case Direction.South:
        this.text_anchor = 'middle';
        dy += text_margin;
        break;
      case Direction.NorthWest:
        break;
      case Direction.SouthEast:
        break;
      case Direction.NorthEast:
        this.text_anchor = 'start';
        dx += text_margin * magic_lines_multiplier;
        dy -= text_margin + (font_size * lines_count) * magic_lines_multiplier;
        break;
      case Direction.SouthWest:
        break;
    }

    position.x += dx;
    position.y += dy;

    return position;
  }

  get_position_by_direction(
    prev_position: Point2D,
    direction: Direction,
    distance?: number,
    distance_multiplier?: number,
  ) {
    const position = new Point2D(prev_position.x, prev_position.y);

    if (distance_multiplier !== undefined) {
      distance *= distance_multiplier;
    }

    switch (direction) {
      case Direction.NorthWest:
        position.x -= distance / 2;
        position.y -= distance / 2;
        break;
      case Direction.North:
        position.y -= distance;
        break;
      case Direction.NorthEast:
        position.x += distance / 2;
        position.y -= distance / 2;
        break;
      case Direction.West:
        position.x -= distance;
        break;
      case Direction.East:
        position.x += distance;
        break;
      case Direction.SouthWest:
        position.x -= distance / 2;
        position.y += distance / 2;
        break;
      case Direction.South:
        position.y += distance;
        break;
      case Direction.SouthEast:
        position.x += distance / 2;
        position.y += distance / 2;
        break;
    }

    return position;
  }

  get_position_by_parents() {
    const prev = this.parents[0];
    if (prev === undefined) {
      return new Point2D(this.position.x, this.position.y);
    }

    let position = new Point2D(prev.position.x, prev.position.y);
    const link = this.get_parent_link();
    if (link) {
      position = this.get_position_by_direction(
        prev.position,
        link.direction,
        settings.station.grid_distance,
        link.length,
      );
    }

    return position;
  }

  add_transfer(transfer: StationTransfer) {
    this.transfers.push(transfer);
  }

  add_children(station?: Station) {
    this.children.push(station);
  }

  add_parent(station?: Station) {
    if (station) {
      this.parents.push(station);
      const first_parent = this.parents[0];
      if (first_parent.links) {
        // Order MATTERS
        if (this.links.length === 0) {
          const link = new StationLink();
          link.direction = first_parent.links[0].direction;
          link.length = 1;
          this.links = [link];
        }
        this.position = this.get_position_by_parents();
      }
    }
  }

  set_params() {
    this.position = this.get_position_by_parents();
    this.text_position = this.get_text_position(settings.station.font_size);
  }

  toggle(el: svgjs.Container) {
    this.click_toggle = !this.click_toggle;
    if (this.click_toggle === true) {
      this.check(el);
    } else {
      this.uncheck();
    }
  }

  highlight() {
    for (const svg_element of this.svg_elements) {
      svg_element.front();
    }
  }

  get_location_marker(el: svgjs.Container, caption: string): ElementParams {
    return {
      'type': ElementType.LocationMarker,
      'properties': {
        'text': caption,
        'position': {
          'x': this.position.x,
          'y': this.position.y,
        }
      },
      'attr': {
        'marker-fill': this.theme.settings.location_marker.color,
        'text-fill': this.theme.settings.location_marker.text_color,
      },
      'draw_callback': (marker_el: svgjs.Container) => {
        marker_el.front();
        this.svg_marker_elements.push(el);
      },
      'classes': [
        'Station',
        'Name',
        this.id,
      ]
    };
  }

  check(el: svgjs.Container) {
    const caption = this.line.city.router.select_station(this);

    for (const element of this.svg_elements) {
      const element_obj = element.remember('element');
      if (element_obj instanceof TextElement) {
        element_obj.toggle();

        const marker = new LocationMarker(
          this.get_location_marker(el, caption)
        );
        this.location_marker = marker.draw(
          this.line.city.canvas
        );
      }
    }
  }

  uncheck() {
    this.line.city.router.unselect_station(this);

    for (const element of this.svg_elements) {
      const element_obj = element.remember('element');
      if (element_obj instanceof TextElement) {
        element_obj.toggle();

        element_obj.uncheck();
      }
    }

    if (this.location_marker) {
      this.location_marker.remove();
    }
  }

  generate_element_params(theme: Theme): ElementParams[] {
    this.theme = theme;
    const elements: ElementParams[] = [];

    if (!this.is_name_hidden) {
      const label_element_params: ElementParams = {
        'type': ElementType.Text,
        'properties': {
          'text': this.name,
          'size': settings.station.font_size,
          'position': {
            'x': this.text_position.x,
            'y': this.text_position.y,
          },
          'anchor': this.text_anchor,
          'weight': settings.station.font_weight,
        },
        'attr': {
          'fill': theme.settings.station.font_color,
        },
        'draw_callback': (el: svgjs.Container) => {
          el.front();
          this.svg_elements.push(el);

          const self = this;
          el.on('click', function() {
            self.toggle(el);
          });
        },
        'classes': [
          'Station',
          'Name',
          this.id,
        ]
      };
      elements.push(label_element_params);
    }

    // Station Marker
    const station_element_params: ElementParams[] = [
      {
        'type': ElementType.Circle,
        'properties': {
          'radius': settings.station.marker.outer_radius,
          'position': {
            'x': this.position.x,
            'y': this.position.y,
          }
        },
        'attr': {
          'fill': shadeHexColor(
            this.line.color, 0.5
          )
        },
        'draw_callback': (el: svgjs.Container) => {
          el.front();
          this.svg_elements.push(el);

          const self = this;
          el.on('click', function() {
            self.toggle(el);
          });
        },
        'classes': [
          'Station',
          'Marker',
          this.id
        ]
      },
      {
        'type': ElementType.Circle,
        'properties': {
          'radius': settings.station.marker.inner_radius,
          'position': {
            'x': this.position.x,
            'y': this.position.y,
          }
        },
        'attr': {
          'fill': theme.settings.station.marker.inner_color
        },
        'draw_callback': (el: svgjs.Container) => {
          el.front();
          this.svg_elements.push(el);

          const self = this;
          el.on('click', function() {
            self.toggle(el);
          });
        },
        'classes': [
          'Station',
          'Marker',
          this.id
        ]
      }
    ];

    for (const station_element_param of station_element_params) {
      elements.push(station_element_param);
    }

    return elements;
  }
}
