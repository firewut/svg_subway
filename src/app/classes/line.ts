import { Station } from './station';
import { Direction, VectorDirection } from './direction';
import { City } from './city';
import { StationTransfer } from './transfer';
import { ElementParams, ElementType, Point2D } from './element';
import { Theme } from './theme';
import { environment } from '../../environments/environment';

export class Line {
  city: City;
  name: string;
  color: string;
  stations: Station[];
  transfers: StationTransfer[];

  terminations: Station[] = [];

  // start, middle, end
  text_anchor = 'middle';

  constructor(city: City, json: any) {
    this.city = city;
    this.name = json.name;
    this.color = json.color;
    this.stations = [];
    this.transfers = [];

    for (const station_json of json.stations) {
      this.stations.push(
        new Station(this, station_json)
      );
    }

    // Set Parents
    let prev_station: Station;
    for (const station of this.stations) {
      station.parse_parents();

      if (station.parents.length === 0) {
        station.add_parent(prev_station);
      }

      prev_station = station;
    }

    // Set Children
    let next_station: Station;
    let i = 1;
    for (const station of this.stations) {
      next_station = this.stations[i];
      if (next_station) {
        for (const parent of next_station.parents) {
          if (parent.name === station.name) {
            station.add_children(next_station);
          }
        }
        i += 1;
      }
    }

    for (const station of this.stations) {
      station.set_params();
    }

    // Set Start and End Stations
    for (const station of this.stations) {
      if (
        station.parents.length === 0 ||
        station.children.length === 0
      ) {
        this.terminations.push(station);
      }
    }
  }

  set_transfers() {
    for (const station of this.stations) {
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
    for (const _station of this.stations) {
      if (_station.name === name) {
        station = _station;
      }
    }
    return station;
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const elements: ElementParams[] = [];

    for (const station of this.stations) {
      if (station.children.length > 0) {
        for (const child of station.children) {
          let connector_color: string;
          let connector_opacity = 1;
          if (station.under_construction || child.under_construction) {
            connector_color = theme.settings.link_under_construction_color;
            connector_opacity = theme.settings.link_under_construction_opacity;
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
              'width': environment.station_line_height,
              'html_class': 'Line',
              'opacity': connector_opacity,
            },
            'draw_callback': (el: svgjs.Container) => {
              el.back();
            },
            'classes': [
              'Station',
              'Connector',
              station.id
            ]
          };
          elements.push(child_connector);
        }
      }

      if (this.terminations.includes(station)) {
        const line_text_position = this.get_line_text_position(station);

        elements.push({
          'type': ElementType.Text,
          'properties': {
            'text': this.name,
            'size': environment.line_name_font_size,
            'position': {
              'x': line_text_position.x,
              'y': line_text_position.y,
            },
            'anchor': this.text_anchor,
            'weight': environment.line_name_font_weight
          },
          'attr': {
            'fill': theme.settings.line_name_font_color,
          },
          'draw_callback': (el: svgjs.Container) => {
            el.front();
          },
          'classes': [
            'Line', 'Name', this.name
          ]
        });
      }
    }

    return elements;
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

    switch (opposite_direction) {
      case Direction.NorthWest:
        this.text_anchor = 'start';
        break;
      case Direction.North:
        break;
      case Direction.NorthEast:
        this.text_anchor = 'end';
        break;
      case Direction.West:
        this.text_anchor = 'start';
        break;
      case Direction.East:
        this.text_anchor = 'end';
        break;
      case Direction.SouthWest:
        this.text_anchor = 'start';
        break;
      case Direction.South:
        break;
      case Direction.SouthEast:
        this.text_anchor = 'start';
        break;
    }

    return this.get_position_by_station_direction(
      station,
      opposite_direction,
      environment.line_name_grid_distance,
    );
  }

  get_position_by_station_direction(
    station: Station,
    direction: Direction,
    distance?: Number
  ) {
    return station.position;
  }
}
