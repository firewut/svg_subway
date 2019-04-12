import * as SVGJS from '@svgdotjs/svg.js';

import { Station, StationLink, StationConnector } from './station';
import { Direction, VectorDirection } from './direction';
import { City } from './city';
import { StationTransfer } from './transfer';
import { ElementParams, ElementType, Point2D } from './element';
import { Theme } from '../../themes/theme';
import { settings } from '../../themes/default';


export class Line {
  city: City;
  name: string;
  color: string;
  is_light = false;
  links: StationLink[] = [];
  stations = {};
  stations_list: Station[] = [];
  transfers: StationTransfer[] = [];

  terminations: Station[] = [];

  // start, middle, end
  text_anchor = 'middle';

  svg_elements_dict = {};
  connectors_dict = {};

  constructor(city: City, json: any) {
    this.city = city;
    this.name = json.name;
    this.color = json.color;
    this.transfers = [];

    if ('is_light' in json) {
      this.is_light = json['is_light'];
    }

    // Init Stations
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
        if (prev_station) {
          station.add_parent(prev_station);
        }
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

    // Parse Links
    for (const station of this.stations_list) {
      station.parse_and_set_links();
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


    for (const station of this.stations_list) {
      station.set_params();
    }

    this.links = this.get_links();
  }

  get_links() {
    const links: StationLink[] = [];
    for (const station of this.stations_list) {
      if (station.links.length > 0) {
        links.push(...station.links);
      }
    }

    return links;
  }

  set_transfers() {
    for (const station of this.stations_list) {
      if (station.has_transfers && station.raw_transfers) {
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
              if (transfer_stations.length === 0) {
                console.log(
                  'Warning. Station has Invalid Transfers. Check Unicode Symbols',
                  station.line.name, station.name, _transfer.stations
                );
              }

              const transfer = new StationTransfer(
                line,
                station,
                transfer_stations,
              );
              if (_transfer.hasOwnProperty('direction')) {
                transfer.set_direction(_transfer.direction);
              }

              // PUSH TO LINE TRANSFERS
              this.add_transfer(transfer);

              // PUSH TO STATION TRANSFERS
              station.add_transfer(transfer);

              // Add Reverse Transfers
              for (const destination of transfer.destinations) {
                const reverse_transfer = transfer.get_reversed_for(
                  destination
                );

                this.add_transfer(reverse_transfer);
                destination.add_transfer(reverse_transfer);
              }
            }
          }
        }
      }
    }
  }

  add_transfer(transfer: StationTransfer) {
    if (!this.transfers.includes(transfer)) {
      this.transfers.push(transfer);
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

  click(el: SVGJS.Container) { }

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

  get_connector(from: Station, to: Station): StationConnector {
    let connector: StationConnector;

    const property = `${from.id}-${to.id}`;
    const reverse_property = `${to.id}-${from.id}`;

    if (this.connectors_dict.hasOwnProperty(property)) {
      connector = this.connectors_dict[property];
    }
    if (this.connectors_dict.hasOwnProperty(reverse_property)) {
      connector = this.connectors_dict[reverse_property];
    }

    return connector;
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const elements: ElementParams[] = [];

    for (const station of this.stations_list) {
      if (station.children.length > 0) {
        for (const child of station.children) {

          const connector_opacity = 1;
          let connector_color = this.color;
          let dashed_connector_color = this.color;
          let dasharray = '0';

          const position = {
            'x1': station.position.x,
            'y1': station.position.y,
            'x2': child.position.x,
            'y2': child.position.y,
          };

          const link = station.has_link_to(child);
          if (!link) {
            continue;
          }

          const child_connector: ElementParams[] = [];

          const line_width = settings.line.width;
          let line_element_type = ElementType.Line;
          if (link.under_construction) {
            line_element_type = ElementType.LineDashedTwoColors;
            connector_color = theme.settings.link.under_construction.connector_color;
            dashed_connector_color = theme.settings.link.under_construction.dashed_connector_color;
            dasharray = settings.line.under_construction.dash_width.toString();
          }

          if (link.gravity) {
            const line_shift = line_width / 2;
            switch (link.gravity) {
              case Direction.NorthWest:
                position.x1 -= line_shift;
                position.x2 -= line_shift;
                break;
              case Direction.North:
                position.y1 -= line_shift;
                position.y2 -= line_shift;
                break;
              case Direction.NorthEast:
                position.x1 += line_shift;
                position.x2 += line_shift;
                break;
              case Direction.West:
                position.x1 -= line_shift;
                position.x2 -= line_shift;
                break;
              case Direction.East:
                position.x1 += line_shift;
                position.x2 += line_shift;
                break;
              case Direction.SouthWest:
                position.x1 -= line_shift;
                position.x2 -= line_shift;
                break;
              case Direction.South:
                position.y1 += line_shift;
                position.y2 += line_shift;
                break;
              case Direction.SouthEast:
                position.x1 += line_shift;
                position.x2 += line_shift;
                break;
            }
          }

          // Line itself
          if (this.is_light) {
            // connector_opacity = .25;
          }

          child_connector.push({
            'type': line_element_type,
            'properties': {
              'position': position,
            },
            'attr': {
              'color': connector_color,
              'width': line_width,
              'html_class': 'Line',
              'opacity': connector_opacity,
              'dashed_line_color': dashed_connector_color,
              'dashed_line_dasharray': dasharray,
            },
            'group': this.city.lines_group,
            'draw_callback': (el: SVGJS.Container) => {
              this.svg_elements_dict['connector'] = el;

              const connector = new StationConnector(
                this, station, child, { 'connector': el }
              );

              this.connectors_dict[`${station.id}-${child.id}`] = connector;
            },
            'classes': [
              'Line',
              'Connector',
              station.id
            ]
          });

          if (link.line_name_plate) {
            const link_center = new Point2D(
              (station.position.x + child.position.x) / 2,
              (station.position.y + child.position.y) / 2,
            );
            const line_text_position = link_center;
            const bbox_coords = this.get_line_text_bbox_coordiantes(
              link_center
            );
            child_connector.push(
              ...[
                {
                  'type': ElementType.Rect,
                  'properties': {
                    'position': bbox_coords,
                    'radius': settings.line.name.font_size / 5,
                    'center': link_center,
                  },
                  'attr': {
                    'fill': this.color,
                  },
                  'group': this.city.stations_group,
                  'draw_callback': (el: SVGJS.Container) => {
                    if (this.svg_elements_dict.hasOwnProperty('rect')) {
                      this.svg_elements_dict['rect'].push(el);
                    } else {
                      this.svg_elements_dict['rect'] = [el];
                    }
                    this.connectors_dict[`${station.id}-${child.id}`].svg_elements_dict['line_name_plate_rect'] = el;
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
                    'center': link_center,
                    'anchor': this.text_anchor,
                    'weight': settings.line.name.font_weight,
                  },
                  'attr': {
                    'fill': theme.settings.line.name.font_color,
                  },
                  'group': this.city.stations_group,
                  'draw_callback': (el: SVGJS.Container) => {
                    if (this.svg_elements_dict.hasOwnProperty('name')) {
                      this.svg_elements_dict['name'].push(el);
                    } else {
                      this.svg_elements_dict['name'] = [el];
                    }
                    this.connectors_dict[`${station.id}-${child.id}`].svg_elements_dict['line_name_plate_text'] = el;
                  },
                  'classes': [
                    'Line',
                    'Name',
                    this.name,
                  ]
                },
              ]
            );
          }

          elements.push(...child_connector);
        }
      }

      if (this.terminations.includes(station) && station.line_name_plate === true) {
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
              'draw_callback': (el: SVGJS.Container) => {
                if (this.svg_elements_dict.hasOwnProperty('rect')) {
                  this.svg_elements_dict['rect'].push(el);
                } else {
                  this.svg_elements_dict['rect'] = [el];
                }

                const self = this;
                el.on('click', function () {
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
              'draw_callback': (el: SVGJS.Container) => {
                if (this.svg_elements_dict.hasOwnProperty('name')) {
                  this.svg_elements_dict['name'].push(el);
                } else {
                  this.svg_elements_dict['name'] = [el];
                }
              },
              'classes': [
                'Line',
                'Name',
                this.name,
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

    const magic_lines_multiplier = Math.SQRT2;
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
        if (link) {
          opposite_direction = link.direction;
        }
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
