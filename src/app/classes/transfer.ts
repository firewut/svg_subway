import * as SVG from '@svgdotjs/svg.js';

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

export enum StationTransferDirection {
  Bidirectional = 'Bidirectional',
  Unidirectional = 'Unidirectional',
}

export class StationTransfer {
  id: string;
  line: Line;
  type: StationTransferType = StationTransferType.Underground;
  source: Station;
  destinations: Station[];
  direction: StationTransferDirection = StationTransferDirection.Bidirectional;
  under_construction = false;

  elements: Element[] = [];
  svg_elements_dict = {};

  constructor(
    line: Line,
    source: Station,
    destinations: Station[],
    type?: StationTransferType,
    under_construction?: boolean,
    direction?: StationTransferDirection,
  ) {
    this.id = makeid();
    this.line = line;
    this.source = source;
    this.destinations = destinations;
    this.under_construction = under_construction || false;

    if (type) {
      this.type = type;
    }
    if (direction) {
      this.direction = direction;
    }
  }

  hide_destinations_if_duplicate() {
    if (!this.source.hidden()) {
      for (const destination of this.destinations) {
        if (destination.name === this.source.name) {
          if (
            (destination.position.x === this.source.position.x) &&
            (destination.position.y === this.source.position.y)
          ) {
            destination.hide_duplicate();
          }
        }
      }
    }
  }

  get_reversed(): StationTransfer[] {
    const reversed_transfers: StationTransfer[] = [];

    if (this.direction === StationTransferDirection.Unidirectional) {
      return reversed_transfers;
    }

    for (const destination of this.destinations) {
      const reverse_transfer = this.get_reversed_for(
        destination
      );
      reversed_transfers.push(reverse_transfer);
    }

    return reversed_transfers;
  }

  get_reversed_for(destination: Station): StationTransfer {
    let reversed_transfer: StationTransfer;

    if (this.direction === StationTransferDirection.Unidirectional) {
      return reversed_transfer;
    }

    const _destinations = Object.assign([], this.destinations);
    const index = _destinations.indexOf(destination, 0);
    if (index > -1) {
      _destinations.splice(index, 1);
    }
    const reverse_transfer_stations = [
      ..._destinations,
      this.source,
    ];
    reversed_transfer = new StationTransfer(
      this.source.line,
      destination,
      reverse_transfer_stations,
    );

    return reversed_transfer;
  }

  set_direction(direction: StationTransferDirection) {
    this.direction = direction;
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

    elements.push(
      {
        'type': ElementType.PolylineElement,
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
        'draw_callback': (el: SVG.Container) => {
          this.svg_elements_dict['outer_line'] = el;
        },
        'classes': [
          this.id
        ]
      },
      {
        'type': ElementType.PolylineElement,
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
          'opacity': 0.5,
        },
        'group': this.line.city.transfers_group,
        'draw_callback': (el: SVG.Container) => {
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
