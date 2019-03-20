import { Line } from './line';
import { ElementParams, ElementType } from './element';
import { environment } from '../../environments/environment';
import { Theme } from '../../themes/theme';
import { Station } from './station';
import { settings } from '../../themes/default';
import { Dijkstra } from './dijkstra';


export class SubwayRouter {
  city: City;
  from: Station;
  to: Station;

  // Sugar
  private select_to = false;
  private graph: Dijkstra;

  constructor(city: City) {
    this.graph = new Dijkstra();
    this.city = city;

    for (const line of city.lines) {
      for (const station of line.stations_list) {
        if (!station.under_construction) {
          const station_graph = this.build_graph(station);
          this.graph.addVertex(station.id, station_graph);
        }
      }
    }

    for (const line of city.lines) {
      for (const transfer of line.transfers) {
        for (const destination of transfer.destinations) {
          if (destination.under_construction) {
            continue;
          }
          this.graph.addToVertex(
            transfer.source.id, {
              [destination.id]: 1
            }
          );
          this.graph.addToVertex(
            destination.id, {
              [transfer.source.id]: 1
            }
          );
        }
      }
    }
  }

  build_graph(station: Station) {
    const children = {};
    const parents = {};

    if (station.children.length > 0) {
      for (const child of station.children) {
        if (!child.under_construction) {
          children[child.id] = 1;
        }
      }
    }

    if (station.parents.length > 0) {
      for (const parent of station.parents) {
        if (!parent.under_construction) {
          parents[parent.id] = 1;
        }
      }
    }

    const deps = Object.assign(
      {},
      parents,
      children,
    );
    return deps;
  }

  unselect_station(station: Station) {
    if (this.from === station) {
      this.from = undefined;
      this.select_to = false;
    } else if (this.to === station) {
      this.to = undefined;
      this.select_to = true;
    }

    this.city.hide_overlay();
  }

  select_station_from(station: Station) {
    if (this.from !== undefined) {
      this.from.uncheck();
    }
    this.from = station;
    this.select_to = true;
  }

  select_station_to(station: Station) {
    if (this.to !== undefined) {
      this.to.uncheck();
    }
    this.to = station;
  }

  select_station(station: Station, to?: boolean) {
    let caption = settings.location_marker.from_marker;

    if (to === true || this.select_to) {
      this.select_station_to(station);
      caption = settings.location_marker.to_marker;
    } else {
      this.select_station_from(station);
    }

    return caption;
  }

  calculate_route(start?: Station, finish?: Station) {
    if (start === undefined || finish === undefined) {
      if (this.from !== undefined && this.to !== undefined) {
        start = this.from;
        finish = this.to;
      }
      if (this.from === undefined || this.to === undefined) {
        return;
      }
    }

    this.city.show_overlay();

    const path: string[] = this.graph.shortestPath(start.id, finish.id);
    if (path.length >= 2) {
      this.highlight_route(path);
    }
  }

  highlight_route(path: string[]) {
    // Draw Markers, Transfers and etc from `start` to `finish`
    this.city.highlight_route(path);
  }
}

export class City {
  name: string;
  logo: string;
  size: number[];
  lines: Line[];
  router: SubwayRouter;

  elements: Element[] = [];
  svg_elements_dict = {};
  active_route_group = [];

  canvas: svgjs.Container;
  overlay: svgjs.Container;

  lines_group: svgjs.G;
  stations_group: svgjs.G;
  transfers_group: svgjs.G;
  markers_group: svgjs.G;
  overlay_group: svgjs.G;
  highlight_group: svgjs.G;

  constructor(json: any, canvas: svgjs.Container) {
    this.name = json.name;
    this.lines = [];
    this.size = json.size;

    this.canvas = canvas;
    this.lines_group = canvas.group();
    this.transfers_group = canvas.group();
    this.stations_group = canvas.group();
    this.markers_group = canvas.group();
    this.overlay_group = canvas.group();
    this.highlight_group = canvas.group();

    this.canvas.add(this.lines_group);
    this.canvas.add(this.transfers_group);
    this.canvas.add(this.stations_group);
    this.canvas.add(this.markers_group);
    this.canvas.add(this.overlay_group);
    this.canvas.add(this.highlight_group);

    // Arrange
    this.lines_group.back();
    this.stations_group.before(this.lines_group);
    this.transfers_group.before(this.lines_group);
    this.overlay_group.before(this.markers_group);
    this.highlight_group.before(this.overlay_group);

    for (const line_json of json.lines) {
      const line = new Line(this, line_json);
      this.lines.push(line);
    }

    for (const line of this.lines) {
      line.set_transfers();
    }

    this.router = new SubwayRouter(this);
  }

  get_station_by_id(station_id: string): Station {
    for (const line of this.lines) {
      const station = line.get_station_by_id(station_id);
      if (station) {
        return station;
      }
    }

    return;
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const element_params: ElementParams[] = [];

    element_params.push(
      ...this.prepare_debug_elements(theme)
    );

    for (const line of this.lines) {
      // Subway Lines
      for (const line_element_param of line.generate_element_params(
        theme
      )) {
        element_params.push(line_element_param);
      }

      // Subway Stations
      for (const station_id in line.stations) {
        if (line.stations.hasOwnProperty(station_id)) {
          const station = line.stations[station_id];
          for (const station_element_param of station.generate_element_params(
            theme
          )) {
            element_params.push(station_element_param);
          }
        }
      }

      // Subway Transfers
      for (const transfer of line.transfers) {
        for (const transfer_element of transfer.generate_element_params(
          theme
        )) {
          element_params.push(transfer_element);
        }
      }
    }

    // Overlay
    element_params.push(
      {
        'type': ElementType.Rect,
        'properties': {
          'position': {
            'x1': 0,
            'y1': 0,
            'x2': this.size[0] * settings.grid.width,
            'y2': this.size[1] * settings.grid.height,
          }
        },
        'attr': {
          'fill': settings.grid.overlay.color,
          'html_class': 'Rect',
          'opacity': settings.grid.overlay.opacity,
          'style': 'pointer-events: none;', // <---- Makes Overlay Clickable & etc
        },
        'group': this.overlay_group,
        'draw_callback': (el: svgjs.Container) => {
          // el.on('show', () => {
          //   this.event_show_overlay();
          // });

          // el.on('hide', () => {
          //   this.event_hide_overlay();
          // });

          this.overlay = el;
          this.svg_elements_dict['overlay'] = el;

          el.hide();
        },
        'classes': [
          this.name,
          'overlay'
        ]
      }
    );

    return element_params;
  }

  highlight_route(path: string[]) {
    this.unhighlight_route();

    const _path = Object.assign([], path);

    // Add Stations
    for (const station_id of _path) {
      for (const line of this.lines) {
        const station = line.get_station_by_id(station_id);
        if (station !== undefined) {
          this.active_route_group.push(station);
          break;
        }
      }
    }

    for (const item of this.active_route_group) {
      item.highlight();
    }
  }

  unhighlight_route() {
    for (const item of this.active_route_group) {
      item.unhighlight();
    }

    this.active_route_group = [];
  }


  // event_show_overlay() {
  //   console.log('show');
  // }

  // event_hide_overlay() {
  //   console.log('hide');
  // }

  show_overlay() {
    if (!this.overlay.visible()) {
      this.overlay.show();
      // this.overlay.fire('show');
    }
  }

  hide_overlay() {
    if (this.overlay.visible()) {
      this.overlay.hide();
      // this.overlay.fire('hide');
    }
  }

  prepare_debug_elements(theme: Theme) {
    const element_params: ElementParams[] = [];

    if (environment.hasOwnProperty('debug')) {
      if (environment.debug === true) {
        for (let i = 0; i < this.size[0]; i++) {
          for (let j = 0; j < this.size[1]; j++) {
            const x0 = i * settings.grid.width;
            const y0 = j * settings.grid.height;
            const x1 = x0 + settings.grid.width;
            const y1 = y0 + settings.grid.height;

            element_params.push(
              {
                'type': ElementType.Rect,
                'properties': {
                  'position': {
                    'x1': x0,
                    'y1': y0,
                    'x2': x1 - 1,
                    'y2': y1 - 1,
                  }
                },
                'attr': {
                  'fill': theme.settings.debug_grid_color,
                  'html_class': 'Rect',
                  'opacity': 0.05
                },
                'group': this.overlay_group,
                'draw_callback': (el: svgjs.Container) => {
                  el.back();
                  this.svg_elements_dict['debug_rect'] = el;
                },
                'classes': [
                  this.name
                ]
              }
            );
          }
        }
      }
    }

    return element_params;
  }
}
