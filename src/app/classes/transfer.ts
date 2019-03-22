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
  under_construction = false;

  elements: Element[] = [];
  svg_elements_dict = {};

  constructor(
    line: Line,
    source: Station,
    destinations: Station[],
    type?: StationTransferType,
    under_construction?: boolean,
  ) {
    this.id = makeid();
    this.line = line;
    this.source = source;
    this.destinations = destinations;
    this.type = type || StationTransferType.Underground;
    this.under_construction = under_construction || false;
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
    for (const key in this.svg_elements_dict) {
      if (this.svg_elements_dict.hasOwnProperty(key)) {
        const element = this.svg_elements_dict[key];

        element.addTo(this.line.city.highlight_group);
      }
    }
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
        'group': this.line.city.transfers_group,
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
        'group': this.line.city.transfers_group,
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
