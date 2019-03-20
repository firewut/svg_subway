import { Station } from './station';
import { Direction, VectorDirection } from './direction';
import { City } from './city';
import { StationTransfer } from './transfer';
import { ElementParams, ElementType, Point2D, LineElement } from './element';
import { Theme } from '../../themes/theme';
import { settings } from '../../themes/default';

export class Line {
  city: City;
  name: string;
  color: string;
  stations = {};
  stations_list: Station[] = [];
  transfers: StationTransfer[];

  terminations: Station[] = [];

  // start, middle, end
  text_anchor = 'middle';

  svg_elements_dict = {};

  constructor(city: City, json: any) {
    this.city = city;
    this.name = json.name;
    this.color = json.color;
    this.transfers = [];

    for (const station_json of json.stations) {
      const station = new Station(this, station_json);
      this.stations[station.id] = station;

      this.stations_list.push(station);
    }

    // Set Parents
    let prev_station: Station;
    for (const station of this.stations_list) {
      station.parse_parents();

      if (station.parents.length === 0) {
        station.add_parent(prev_station);
      }
      prev_station = station;
    }

    // Set Children
    let next_station: Station;
    let i = 1;
    for (const station of this.stations_list) {
      next_station = this.stations_list[i];
      if (next_station) {
        for (const parent of next_station.parents) {
          if (parent.name === station.name) {
            station.add_children(next_station);
          }
        }
      }
      i += 1;
    }

    for (const station of this.stations_list) {
      station.set_params();
    }

    // Set Start and End Stations
    for (const station of this.stations_list) {
      if (
        station.parents.length === 0 ||
        station.children.length === 0
      ) {
        this.terminations.push(station);
      }
    }
  }

  set_transfers() {
    for (const station of this.stations_list) {
      if (station.has_transfers) {
        for (const _transfer of station.raw_transfers) {
          for (const line of this.city.lines) {
            if (line.name === _transfer.line) {
              const transfer_stations: Station[] = [];

              for (const _station of _transfer.stations) {
                const line_station = line.get_station_by_name(_station);
                if (line_station) {
                  transfer_stations.push(line_station);
                }
              }

              if (transfer_stations.length > 0) {
                this.transfers.push(
                  new StationTransfer(line, station, transfer_stations)
                );
              }

              break;
            }
          }
        }
      }
    }
  }

  get_station_by_name(name: string) {
    let station: Station;
    for (const _station of this.stations_list) {
      if (_station.name === name) {
        station = _station;
      }
    }
    return station;
  }

  get_station_by_id(id: string) {
    if (this.stations.hasOwnProperty(id)) {
      return this.stations[id];
    }
    return;
  }

  click(el: svgjs.Container) { }

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

  highlight(path: string[]) {
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];
        element.addTo(this.city.highlight_group);
      }
    }
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const elements: ElementParams[] = [];

    for (const station of this.stations_list) {
      if (station.children.length > 0) {
        for (const child of station.children) {
          let connector_color: string;
          let connector_opacity = 1;
          if (station.under_construction || child.under_construction) {
            connector_color = theme.settings.link_under_construction.color;
            connector_opacity = theme.settings.link_under_construction.opacity;
          } else {
            connector_color = this.color;
          }

          const child_connector: ElementParams = {
            'type': ElementType.Line,
            'properties': {
              'position': {
                'x1': station.position.x,
                'y1': station.position.y,
                'x2': child.position.x,
                'y2': child.position.y,
              }
            },
            'attr': {
              'color': connector_color,
              'width': settings.line.width,
              'html_class': 'Line',
              'opacity': connector_opacity,
            },
            'group': this.city.lines_group,
            'draw_callback': (el: svgjs.Container) => {
              this.svg_elements_dict['connector'] = el;
            },
            'classes': [
              'Line',
              'Connector',
              station.id
            ]
          };
          elements.push(child_connector);
        }
      }

      if (this.terminations.includes(station)) {
        const line_text_position = this.get_line_text_position(station);
        const line_text_bbox_coordinates = this.get_line_text_bbox_coordiantes(
          line_text_position
        );

        elements.push(
          ...[
            {
              'type': ElementType.Rect,
              'properties': {
                'position': line_text_bbox_coordinates,
                'radius': settings.line.name.font_size / 5,
              },
              'attr': {
                'fill': this.color,
              },
              'group': this.city.lines_group,
              'draw_callback': (el: svgjs.Container) => {
                if (this.svg_elements_dict.hasOwnProperty('rect')) {
                  this.svg_elements_dict['rect'].push(el);
                } else {
                  this.svg_elements_dict['rect'] = [el];
                }

                const self = this;
                el.on('click', function() {
                  self.click(el);
                });
              },
              'classes': [
                'Line', 'BBox', this.name
              ]
            },
            {
              'type': ElementType.Text,
              'properties': {
                'text': this.name,
                'size': settings.line.name.font_size,
                'position': {
                  'x': line_text_position.x,
                  'y': line_text_position.y,
                },
                'anchor': this.text_anchor,
                'weight': settings.line.name.font_weight,
              },
              'attr': {
                'fill': theme.settings.line.name.font_color,
              },
              'group': this.city.lines_group,
              'draw_callback': (el: svgjs.Container) => {
                if (this.svg_elements_dict.hasOwnProperty('name')) {
                  this.svg_elements_dict['name'].push(el);
                } else {
                  this.svg_elements_dict['name'] = [el];
                }
              },
              'classes': [
                'Line', 'Name', this.name
              ]
            },
          ]
        );
      }
    }

    return elements;
  }

  get_line_text_bbox_coordiantes(line_text_position: Point2D) {
    const x1 = line_text_position.x;
    const y1 = line_text_position.y;
    const x2 = line_text_position.x;
    const y2 = line_text_position.y;

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

    const magic_lines_multiplier = 1.3;
    const font_size = settings.line.name.font_size;

    const height = font_size * lines_count * magic_lines_multiplier;
    const width = font_size / 2 * max_length + font_size;
    return {
      'x1': x1 - width / 2,
      'y1': y1 - font_size / 6,
      'x2': x2 + width / 2,
      'y2': y2 + height,
    };
  }

  get_line_text_position(station: Station) {
    let opposite_direction: Direction;

    if (station.parents.length === 0) {
      if (station.children.length > 0) {
        const link = station.get_next_link();
        if (link) {
          const vector = new VectorDirection(link.direction);
          opposite_direction = vector.get_opposite_direction();
        }
      }
    } else if (station.children.length === 0) {
      if (station.parents.length > 0) {
        const link = station.get_parent_link();
        opposite_direction = link.direction;
      }
    }

    return this.get_position_by_direction(
      station,
      opposite_direction,
      settings.line.name.grid_distance,
    );
  }

  get_position_by_direction(
    station: Station,
    direction: Direction,
    distance?: number
  ) {
    const position = new Point2D(
      station.position.x,
      station.position.y
    );

    switch (direction) {
      case Direction.NorthWest:
        position.y -= distance;
        position.x -= distance / 2;
        break;
      case Direction.North:
        position.y -= distance;
        break;
      case Direction.NorthEast:
        position.x += distance / 2;
        position.y -= distance;
        break;
      case Direction.West:
        position.x -= distance;
        position.y -= distance / 2;
        break;
      case Direction.East:
        position.x += distance;
        position.y -= distance / 2;
        break;
      case Direction.SouthWest:
        position.x -= distance / 2;
        position.y += distance / 2;
        break;
      case Direction.South:
        break;
      case Direction.SouthEast:
        position.x += distance / 2;
        position.y += distance / 2;
        break;
    }
    return position;
  }
}
