import { ElementType, ElementParams, Point2D, TextElement, LocationMarker } from './element';
import { Line } from './line';
import { StationTransfer } from './transfer';
import { Theme } from '../../themes/theme';
import { settings } from '../../themes/default';
import { shadeHexColor, makeid } from './helper';
import { Direction, VectorDirection } from './direction';

export interface StationLinkInterface {
  station?: string;
  direction: Direction;
  length: number;
  under_construction: boolean;
}

export class StationLink {
  source_id: string;
  destination_id: string;
  direction: Direction;
  length: number;
  under_construction = false;

  constructor(source: Station, destination: Station) {
    this.source_id = source.id;
    if (destination) {
      this.destination_id = destination.id;
    }
    this.length = 1;
    this.direction = Direction.North;
  }

  // get_opposite_link(): StationLink {
  //   const vector = new VectorDirection(this.direction);

  //   const opposite_link: StationLink = Object.assign(
  //     {},
  //     this
  //   );

  //   opposite_link.destination_id = this.source_id;
  //   opposite_link.source_id = this.destination_id;
  //   opposite_link.direction = vector.get_opposite_direction();
  //   opposite_link.length = this.length;

  //   return opposite_link;
  // }
}

export class Station {
  id: string;
  name: string;
  name_location: Direction = Direction.West;
  position?: Point2D;
  description: string;

  links: StationLink[] = [];
  _links?: StationLinkInterface[] = [];

  line: Line;
  _parents?: string[] = [];
  parents: Station[] = [];
  _children?: string[] = [];
  children: Station[] = [];

  has_transfers = false;
  raw_transfers?: any;
  transfers?: StationTransfer[];

  // If the Station is a Termination
  // sometimes it's necessary to Omit Line Name
  line_name_plate = true;

  // start, middle, end
  text_anchor = 'middle';

  text_position: Point2D;
  under_construction = false;

  // Skippable affects UI ONLY
  // by Hiding from Highlight
  skippable = false;

  is_name_hidden = false;

  element_params: ElementParams[] = [];
  svg_elements_dict = {};

  private click_toggle = false;
  private location_marker: svgjs.Shape;
  private theme: Theme;

  constructor(line: Line, json: any) {
    this.id = makeid();
    this.line = line;

    if ('description' in json) {
      this.description = json.description;
    }

    this._links = json.links || [];

    if ('line_name_plate' in json) {
      this.line_name_plate = json.line_name_plate;
    }

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
    if ('skippable' in json) {
      this.skippable = json.skippable;
    }


    if ('transfers' in json) {
      this.has_transfers = true;
      this.raw_transfers = json.transfers;
      this.transfers = [];
    }

    this._parents = json.parents;

    if ('name' in json) {
      this.name = json.name.value.trim();
      if ('location' in json.name) {
        this.name_location = json.name.location;
      }
    }
  }

  hide_name() {
    this.is_name_hidden = true;
  }


  add_links(links: StationLink[]) {
    for (const link of links) {
      this.add_link(link);
    }
  }

  add_link(link?: StationLink) {
    if (link) {
      if (!this.links.includes(link)) {
        this.links.push(link);
      }
    }
  }

  parse_parents() {
    if (this._parents) {
      for (const parent of this._parents) {
        for (const station of this.line.stations_list) {
          if (parent === station.name) {
            this.add_parent(station);
            station.add_children(this);
          }
        }
      }
    }
  }

  has_link_to(station: Station) {
    for (const _link of this.links) {
      if (_link.destination_id === station.id) {
        return _link;
      }
    }

    for (const _link of station.links) {
      if (_link.destination_id === this.id) {
        return _link;
      }
    }
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
        this.text_anchor = 'end';
        dx -= text_margin * magic_lines_multiplier;
        dy -= text_margin + (font_size * lines_count) * magic_lines_multiplier;
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
        position.x -= distance;
        position.y -= distance;
        break;
      case Direction.North:
        position.y -= distance;
        break;
      case Direction.NorthEast:
        position.x += distance;
        position.y -= distance;
        break;
      case Direction.West:
        position.x -= distance;
        break;
      case Direction.East:
        position.x += distance;
        break;
      case Direction.SouthWest:
        position.x -= distance;
        position.y += distance;
        break;
      case Direction.South:
        position.y += distance;
        break;
      case Direction.SouthEast:
        position.x += distance;
        position.y += distance;
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

  get_transfers_to(station: Station) {
    const transfers: StationTransfer[] = [];

    if (this.has_transfers) {
      for (const transfer of this.transfers) {
        if (
          transfer.destinations.includes(station) ||
          transfer.source === station
        ) {
          transfers.push(transfer);
        }
      }
    }

    return transfers;
  }

  add_transfer(transfer: StationTransfer) {
    if (!this.transfers) {
      this.transfers = [];
    }
    if (!this.transfers.includes(transfer)) {
      this.transfers.push(transfer);
    }
  }

  add_children(station?: Station) {
    this.children.push(station);
  }

  add_parent(station?: Station) {
    if (station) {
      this.parents.push(station);
    }
  }

  parse_and_set_links() {
    const links: StationLink[] = [];

    // If link was passed
    if (this._links.length > 0) {
      for (const _link of this._links) {
        let destination: Station;

        if (_link.station) {
          destination = this.line.get_station_by_name(
            _link.station
          );
        } else {
          if (this.children.length > 0) {
            destination = this.children[0];
          }
        }

        const link = new StationLink(this, destination);
        link.direction = _link.direction;
        link.length = _link.length || 1;
        link.under_construction = _link.under_construction || false;

        links.push(link);
      }
    } else {
      // Inherit Parent's Link
      if (
        this.parents.length > 0 &&
        this.children.length > 0
      ) {
        const parent = this.parents[0];
        const parent_link = parent.has_link_to(this);
        if (parent_link) {
          const link = new StationLink(this, this.children[0]);
          link.direction = parent_link.direction;
          link.length = parent_link.length;
          link.under_construction = parent_link.under_construction || false;

          links.push(link);
        }
      }
    }

    this.add_links(links);
  }


  set_params() {
    this.position = this.get_position_by_parents();
    this.text_position = this.get_text_position(settings.station.font_size);
  }

  toggle(caption?: string) {
    const el = this.svg_elements_dict['outer_marker'];
    this.toggle_with_element(el, caption);
  }

  toggle_with_element(el: svgjs.Container, caption?: string) {
    if (this.under_construction === true) {
      return;
    }

    this.click_toggle = !this.click_toggle;
    if (this.click_toggle === true) {
      this.check(el, caption);
    } else {
      this.uncheck();
    }
  }

  check(el: svgjs.Container, caption?: string) {
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];
        const element_obj = element.remember('element');
        if (element_obj instanceof TextElement) {
          element_obj.toggle();
          element_obj.check();

          const marker = new LocationMarker(
            this.get_location_marker(el, caption)
          );
          this.location_marker = marker.draw(
            this.line.city.canvas
          );
        }
      }
    }
  }

  uncheck() {
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];
        const element_obj = element.remember('element');
        if (element_obj instanceof TextElement) {
          element_obj.toggle();
          element_obj.uncheck();
        }
      }
    }

    if (this.location_marker) {
      this.location_marker.hide();
      this.location_marker.remove();
      this.location_marker = undefined;
    }

    this.click_toggle = false;
  }

  unhighlight() {
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];

        element.addTo(
          element.remember('element').group
        );
      }
    }
  }

  highlight() {
    if (this.skippable) {
      return;
    }
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];

        element.addTo(this.line.city.highlight_group);

        if (this.location_marker) {
          this.location_marker.addTo(this.line.city.highlight_group);
        }
      }
    }
  }

  get_location_marker(el: svgjs.Container, caption: string): ElementParams {
    const marker_color = this.line.color;

    const marker_position = new Point2D(
      this.position.x,
      this.position.y - settings.location_marker.radius
    );

    return {
      'type': ElementType.LocationMarker,
      'properties': {
        'text': caption,
        'position': marker_position
      },
      'attr': {
        'marker-fill': marker_color,
        'text-fill': this.theme.settings.location_marker.text_color,
      },
      'group': this.line.city.markers_group,
      'draw_callback': (marker_el: svgjs.Container) => {
        this.svg_elements_dict['location_marker'] = marker_el;

        const self = this;
        marker_el.on('click', function() {
          self.line.city.router.select_station(self);
        });
      },
      'classes': [
        'Station',
        'Name',
        'Location Marker',
        this.id,
      ]
    };
  }



  generate_element_params(theme: Theme): ElementParams[] {
    this.theme = theme;
    const elements: ElementParams[] = [];

    let inner_color = shadeHexColor(this.line.color, 0.5);
    let outer_color = theme.settings.station.marker.outer_color;
    let font_color = theme.settings.station.font_color;

    if (this.under_construction) {
      outer_color = theme.settings.station.marker.under_construction.outer_color;
      inner_color = theme.settings.station.marker.under_construction.inner_color;
      font_color = theme.settings.station.under_construction.font_color;
    }

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
          'fill': font_color,
        },
        'group': this.line.city.stations_group,
        'draw_callback': (el: svgjs.Container) => {
          this.svg_elements_dict['name'] = el;

          const self = this;
          el.on('click', function() {
            self.line.city.router.select_station(self);
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

    let station_element_params: ElementParams[] = [];
    // Station Marker
    if (this.name) {
      station_element_params = [
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
            'fill': inner_color,
          },
          'group': this.line.city.stations_group,
          'draw_callback': (el: svgjs.Container) => {

            this.svg_elements_dict['outer_marker'] = el;

            const self = this;
            el.on('click', function() {
              self.line.city.router.select_station(self);
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
            'fill': outer_color,
          },
          'group': this.line.city.stations_group,
          'draw_callback': (el: svgjs.Container) => {

            this.svg_elements_dict['inner_marker'] = el;

            const self = this;
            el.on('click', function() {
              self.line.city.router.select_station(self);
            });
          },
          'classes': [
            'Station',
            'Marker',
            this.id
          ]
        }
      ];
    }

    for (const station_element_param of station_element_params) {
      elements.push(station_element_param);
    }

    return elements;
  }
}
