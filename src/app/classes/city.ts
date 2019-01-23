import { Line } from './line';
import { ElementParams, ElementType } from './element';
import { environment } from '../../environments/environment';
import { Theme } from './theme';
import { Station } from './station';

export class SubwayRouter {
  lines: Line[];
  from: Station;
  to: Station;

  constructor(lines: Line[]) {
    // this.lines = lines;
  }

  select_station(station: Station) {
    if (this.from === undefined) {
      this.from = station;
    } else {
      this.to = station;
    }

    if (this.from !== undefined && this.to !== undefined) {
      this.calculate_route(this.from, this.to);
    }
  }

  calculate_route(start: Station, finish: Station) {
    console.log(start.line.name, start.name, '|', finish.line.name, finish.name);
  }
}

export class City {
  name: string;
  logo: string;
  size: number[];
  lines: Line[];
  router: SubwayRouter;

  constructor(json: any) {
    this.name = json.name;
    this.lines = [];
    this.size = json.size;

    for (const line_json of json.lines) {
      const line = new Line(this, line_json);
      this.lines.push(line);
    }

    for (const line of this.lines) {
      line.set_transfers();
    }

    this.router = new SubwayRouter(this.lines);
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const element_params: ElementParams[] = [];

    element_params.push(
      ...this.prepare_debug_elements(theme)
    );

    for (const line of this.lines) {
      // City Subway Lines
      for (const line_element_param of line.generate_element_params(
        theme
      )) {
        element_params.push(line_element_param);
      }

      // City Subway Stations
      for (const station of line.stations) {
        for (const station_element_param of station.generate_element_params(
          theme
        )) {
          element_params.push(station_element_param);
        }
      }

      // City Subway transfers
      for (const transfer of line.transfers) {
        for (const transfer_element of transfer.generate_element_params(
          theme
        )) {
          element_params.push(transfer_element);
        }
      }
    }

    return element_params;
  }

  prepare_debug_elements(theme: Theme) {
    const element_params: ElementParams[] = [];

    if (environment.hasOwnProperty('debug')) {
      if (environment.debug === true) {
        for (let i = 0; i < this.size[0]; i++) {
          for (let j = 0; j < this.size[1]; j++) {
            const x0 = i * environment.grid_width;
            const y0 = j * environment.grid_height;
            const x1 = x0 + environment.grid_width;
            const y1 = y0 + environment.grid_height;

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
