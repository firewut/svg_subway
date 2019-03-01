import { Line } from './line';
import { Station } from './station';
import { ElementParams, ElementType } from './element';
import { settings } from '../../themes/default';
import { Theme } from '../../themes/theme';
import { makeid } from './helper';

export enum StationTransferType {
  Underground = 'Underground',
  Groud = 'Ground',
}

export class StationTransfer {
  id: string;
  line: Line;
  type: StationTransferType = StationTransferType.Underground;
  source: Station;
  destinations: Station[];

  elements: Element[] = [];
  svg_elements_dict = {};

  constructor(
    line: Line,
    source: Station,
    destinations: Station[],
    type?: StationTransferType
  ) {
    this.id = makeid();
    this.line = line;
    this.source = source;
    this.destinations = destinations;
    this.type = type || StationTransferType.Underground;
  }

  generate_element_params(theme: Theme): ElementParams[] {
    const elements: ElementParams[] = [];

    const destinations_points: number[][] = [];
    for (const destination of this.destinations) {
      destinations_points.push(
        [
          destination.position.x,
          destination.position.y
        ]
      );
    }

    for (const destination of this.destinations) {
      if (destination.name === this.source.name) {
        if (
          (destination.position.x === this.source.position.x) &&
          (destination.position.y === this.source.position.y)
        ) {
          destination.hide_name();
        }
      }
    }

    elements.push(
      {
        'type': ElementType.PolyLineElement,
        'properties': {
          'points': [
            [
              this.source.position.x,
              this.source.position.y
            ],
            ...destinations_points
          ]
        },
        'attr': {
          'color': theme.settings.transfer.outer_color,
          'width': settings.station.marker.outer_radius * 1.25,
          'html_class': 'Transfer',
          'linecap': 'round',
          'linejoin': 'round',
          'opacity': 0.75,
        },
        'draw_callback': (el: svgjs.Container) => {
          el.back();
          this.svg_elements_dict['outer_line'] = el;
        },
        'classes': [
          this.id
        ]
      },
      {
        'type': ElementType.PolyLineElement,
        'properties': {
          'points': [
            [
              this.source.position.x,
              this.source.position.y
            ],
            ...destinations_points
          ]
        },
        'attr': {
          'color': theme.settings.transfer.inner_color,
          'width': settings.station.marker.inner_radius,
          'html_class': 'Transfer',
          'linecap': 'round',
          'linejoin': 'round',
          'opacity': 0.25,
        },
        'draw_callback': (el: svgjs.Container) => {
          el.back();
          this.svg_elements_dict['inner_line'] = el;
        },
        'classes': [
          this.id
        ]
      }
    );

    return elements;
  }
}
