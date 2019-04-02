import { Line, StationConnector } from './line';
import { ElementParams, ElementType } from './element';
import { environment } from '../../environments/environment';
import { Theme } from '../../themes/theme';
import { Station } from './station';
import { settings } from '../../themes/default';
import { Dijkstra } from './dijkstra';
import { StationTransferDirection, StationTransfer } from './transfer';


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

    // Each Station of a Line
    for (const line of city.lines) {
      for (const station of line.stations_list) {
        if (station.under_construction) {
          if (!station.skippable) {
            continue;
          }
        }
        const station_graph = this.build_graph(station);
        this.graph.addVertex(station.id, station_graph);
      }
    }

    // Each Transfer of a Line
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
        }
      }
    }
  }

  build_graph(station: Station) {
    const children = {};
    const parents = {};

    if (station.children.length > 0) {
      for (const child of station.children) {
        const link = station.has_link_to(child);
        if (link) {
          if (!link.under_construction) {
            children[child.id] = 1;
          } else {
            continue;
          }
        } else {
          continue;
        }
        // if (!child.under_construction) {
        children[child.id] = 1;
        // }
      }
    }

    if (station.parents.length > 0) {
      for (const parent of station.parents) {
        const link = station.has_link_to(parent);
        if (link) {
          if (!link.under_construction) {
            parents[parent.id] = 1;
          } else {
            continue;
          }
        } else {
          continue;
        }
        // if (!parent.under_construction) {
        parents[parent.id] = 1;
        // }
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
    this.select_to = false;
    if (!station) {
      return;
    }
    if (this.from === station) {
      this.from = undefined;
    } else if (this.to === station) {
      this.to = undefined;
      if (this.from) {
        this.select_to = true;
      }
    }

    station.uncheck();

    this.city.hide_overlay();
  }

  select_station_from(station: Station) {
    const marker_text = settings.location_marker.from_marker;
    if (this.to === station) {
      this.unselect_station(station);
      return;
    }
    if (this.from !== undefined) {
      this.from.toggle(marker_text);
    }
    station.toggle(marker_text);
    this.from = station;
    this.select_to = true;
  }

  select_station_to(station: Station) {
    const marker_text = settings.location_marker.to_marker;
    if (this.from === station) {
      this.unselect_station(station);
      return;
    }
    if (this.to !== undefined) {
      this.to.toggle(marker_text);
    }
    station.toggle(marker_text);
    this.to = station;
    this.select_to = false;
  }

  select_station(station: Station) {
    // If Both are selected - SHOW DIALOG
    if (this.from && this.to) {
      if ([this.from, this.to].includes(station)) {
        this.unselect_station(station);
        return;
      } else {
        this.city.show_station_selection_dialog(station);
        return;
      }
    }

    if (this.select_to === true) {
      this.select_station_to(station);
    } else {
      this.select_station_from(station);
    }

    if (this.from && this.to) {
      this.calculate_route();
    }
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
    this.city.hide_stations_selection_dialog();
  }

  reset() {
    this.unselect_station(this.from);
    this.unselect_station(this.to);
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

  debug_group: svgjs.G;
  lines_group: svgjs.G;
  stations_group: svgjs.G;
  transfers_group: svgjs.G;
  markers_group: svgjs.G;
  overlay_group: svgjs.G;
  highlight_group: svgjs.G;
  dialog_group: svgjs.G;

  constructor(json: any, canvas: svgjs.Container) {
    this.name = json.name;
    this.lines = [];
    this.size = json.size;

    this.canvas = canvas;
    this.debug_group = canvas.group();
    this.lines_group = canvas.group();
    this.transfers_group = canvas.group();
    this.stations_group = canvas.group();
    this.markers_group = canvas.group();
    this.overlay_group = canvas.group();
    this.highlight_group = canvas.group();
    this.dialog_group = canvas.group();

    this.dialog_group.hide();

    this.canvas.add(this.debug_group);
    this.canvas.add(this.lines_group);
    this.canvas.add(this.transfers_group);
    this.canvas.add(this.stations_group);
    this.canvas.add(this.markers_group);
    this.canvas.add(this.overlay_group);
    this.canvas.add(this.highlight_group);
    this.canvas.add(this.dialog_group);

    // Arrange
    this.debug_group.back();
    this.lines_group.before(this.debug_group);
    this.stations_group.before(this.lines_group);
    this.transfers_group.before(this.lines_group);
    this.overlay_group.before(this.markers_group);
    this.highlight_group.before(this.overlay_group);
    this.dialog_group.before(this.highlight_group);

    for (const line_json of json.lines) {
      const line = new Line(this, line_json);
      this.lines.push(line);
    }

    for (const line of this.lines) {
      line.set_transfers();
    }

    this.router = new SubwayRouter(this);
  }

  reset() {
    this.router.reset();
    this.hide_stations_selection_dialog();
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

  hide_stations_selection_dialog() {
    this.dialog_group.hide();
  }

  show_station_selection_dialog(station: Station) {
    const y_padding = this.dialog_group.bbox().height;

    this.dialog_group.remember('station', station);
    this.dialog_group.center(
      station.position.x,
      station.position.y + y_padding,
    );
    this.dialog_group.show();
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const element_params: ElementParams[] = [];

    element_params.push(
      ...this.prepare_debug_elements(theme)
    );

    // Station Selection Dialog
    element_params.push(
      ...this.prepare_station_selection_dialog(theme)
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
          'fill': theme.settings.overlay_color,
          'html_class': 'Rect',
          'opacity': settings.grid.overlay.opacity,
          'style': 'pointer-events: none;', // <---- Makes Overlay Clickable & etc
        },
        'group': this.overlay_group,
        'draw_callback': (el: svgjs.Container) => {
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
    const connectors: StationConnector[] = [];
    const stations: Station[] = [];
    const transfers: StationTransfer[] = [];

    // Add Stations
    for (const station_id of _path) {
      for (const line of this.lines) {
        const station = line.get_station_by_id(station_id);
        if (station !== undefined) {
          // this.active_route_group.push(station);
          stations.push(station);
          break;
        }
      }
    }

    // Add Links, Parents, Transfers
    for (let i = 0; i < stations.length - 1; i++) {
      const current_item = stations[i];
      const next_item = stations[i + 1];

      // Line Connectors
      if (
        current_item.children.includes(next_item) ||
        current_item.parents.includes(next_item)
      ) {
        const connector = current_item.line.get_connector(current_item, next_item);
        if (connector) {
          connectors.push(connector);
        }
      }

      // Transfers
      const _transfers = current_item.get_transfers_to(next_item);
      if (_transfers) {
        transfers.push(..._transfers);
      }
    }

    this.active_route_group.push(...connectors);
    this.active_route_group.push(...transfers);
    this.active_route_group.push(...stations);

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

  show_overlay() {
    if (!this.overlay.visible()) {
      this.overlay.show();
      this.dialog_group.hide();
    }
  }

  hide_overlay() {
    if (this.overlay.visible()) {
      this.overlay.hide();
    }
  }

  prepare_station_selection_dialog(theme: Theme) {
    const element_params: ElementParams[] = [];

    const dialog_settings = settings.dialog.station_selection;

    element_params.push(
      ...[
        {
          'type': ElementType.Rect,
          'properties': {
            'position': {
              'x1': 0,
              'y1': 0,
              'x2': dialog_settings.width,
              'y2': dialog_settings.height,
            },
            'radius': dialog_settings.corner_radius,
          },
          'attr': {
            'fill': theme.settings.dialog.station_selection.background_color,
            'html_class': 'Rect',
            'opacity': .8
          },
          'group': this.dialog_group,
          'draw_callback': (el: svgjs.Container) => {

          },
          'classes': []
        },
        {
          'type': ElementType.Rect,
          'properties': {
            'position': {
              'x1': dialog_settings.inner.rects_padding,
              'y1': dialog_settings.inner.rects_padding,
              'x2': dialog_settings.width / 2 - dialog_settings.inner.rects_padding,
              'y2': dialog_settings.height - dialog_settings.inner.rects_padding,
            },
            'radius': dialog_settings.corner_radius,
          },
          'attr': {
            'fill': theme.settings.dialog.station_selection.button_background_color,
            'html_class': 'Rect',
            'opacity': .9
          },
          'group': this.dialog_group,
          'draw_callback': (el: svgjs.Container) => {

          },
          'classes': []
        },
        {
          'type': ElementType.Rect,
          'properties': {
            'position': {
              'x1': dialog_settings.width / 2 + dialog_settings.inner.rects_padding,
              'y1': 5,
              'x2': dialog_settings.width - dialog_settings.inner.rects_padding,
              'y2': dialog_settings.height - dialog_settings.inner.rects_padding,
            },
            'radius': dialog_settings.corner_radius,
          },
          'attr': {
            'fill': theme.settings.dialog.station_selection.button_background_color,
            'html_class': 'Rect',
            'opacity': .9
          },
          'group': this.dialog_group,
          'draw_callback': (el: svgjs.Container) => {

          },
          'classes': []
        },
        {
          'type': ElementType.Text,
          'properties': {
            'text': dialog_settings.text_from.value,
            'size': dialog_settings.font_size,
            'position': {
              'x': dialog_settings.inner.rects_padding * 2,
              'y': dialog_settings.inner.rects_padding * 2,
            },
            'anchor': 'start',
            'weight': settings.line.name.font_weight,
          },
          'attr': {
            'fill': theme.settings.dialog.station_selection.font_color,
          },
          'group': this.dialog_group,
          'draw_callback': (el: svgjs.Container) => {
            const self = this;
            el.on('click', function() {
              const station = self.dialog_group.remember('station');

              self.router.select_station_from(station);
              self.router.calculate_route();
            });
          },
          'classes': [
          ]
        },
        {
          'type': ElementType.Text,
          'properties': {
            'text': dialog_settings.text_to.value,
            'size': dialog_settings.font_size,
            'position': {
              'x': dialog_settings.width / 2 + dialog_settings.inner.rects_padding * 2,
              'y': dialog_settings.inner.rects_padding * 2,
            },
            'anchor': 'start',
            'weight': settings.line.name.font_weight,
          },
          'attr': {
            'fill': theme.settings.dialog.station_selection.font_color,
          },
          'group': this.dialog_group,
          'draw_callback': (el: svgjs.Container) => {
            const self = this;
            el.on('click', function() {
              const station = self.dialog_group.remember('station');

              self.router.select_station_to(station);
              self.router.calculate_route();
            });
          },
          'classes': [
          ]
        },
      ]
    );


    return element_params;
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
                'group': this.debug_group,
                'draw_callback': (el: svgjs.Container) => {
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
