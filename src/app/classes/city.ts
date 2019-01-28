import { Line } from './line';
import { ElementParams, ElementType } from './element';
import { environment } from '../../environments/environment';
import { Theme } from '../../themes/theme';
import { Station } from './station';
import { settings } from '../../themes/default';

export class SubwayRouter {
  city: City;
  from: Station;
  to: Station;

  // Sugar
  private select_to = false;

  constructor(city: City) {
    this.city = city;
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

    if (this.from !== undefined && this.to !== undefined) {
      this.calculate_route(this.from, this.to);
    }

    return caption;
  }

  calculate_route(start: Station, finish: Station) {
    console.log(start.line.name, start.name, '|', finish.line.name, finish.name);
    this.city.show_overlay();
  }

  highlight_route(start: Station, finish: Station) {
    // Place an Overlay
    this.city.show_overlay();

    // Draw Markers, Transfers and etc from `start` to `finish`
  }
}

export class City {
  name: string;
  logo: string;
  size: number[];
  lines: Line[];
  router: SubwayRouter;

  elements: Element[] = [];
  svg_elements: svgjs.Container[] = [];

  canvas: svgjs.Container;
  overlay: svgjs.Container;

  constructor(json: any, canvas: svgjs.Container) {
    this.name = json.name;
    this.lines = [];
    this.size = json.size;

    this.canvas = canvas;

    for (const line_json of json.lines) {
      const line = new Line(this, line_json);
      this.lines.push(line);
    }

    for (const line of this.lines) {
      line.set_transfers();
    }

    this.router = new SubwayRouter(this);
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
      for (const station of line.stations) {
        for (const station_element_param of station.generate_element_params(
          theme
        )) {
          element_params.push(station_element_param);
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
          'opacity': settings.grid.overlay.opacity
        },
        'draw_callback': (el: svgjs.Container) => {
          this.svg_elements.push(el);
          this.overlay = el;
          el.back();
          el.hide();
        },
        'classes': [
          this.name
        ]
      }
    );

    return element_params;
  }

  show_overlay() {
    this.overlay.show();
  }
  hide_overlay() {
    this.overlay.hide();
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
                'draw_callback': (el: svgjs.Container) => {
                  el.back();
                  this.svg_elements.push(el);
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
