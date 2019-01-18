import { Line } from './line';
import { Station } from './station';
import { ElementParams, ElementType } from './element';
import { environment } from '../../environments/environment';

export enum StationTransferType {
    Underground = 'Underground',
    Groud = 'Ground',
}

export class StationTransfer {
    line: Line;
    type: StationTransferType = StationTransferType.Underground;
    source: Station;
    destinations: Station[];

    constructor(
        line: Line,
        source: Station,
        destinations: Station[],
        type?: StationTransferType
    ) {
        this.line = line;
        this.source = source;
        this.destinations = destinations;
        this.type = type || StationTransferType.Underground;
    }

    generate_element_params(): ElementParams[] {
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
                    'color': '#fff',
                    'width': environment.station_marker_outer_radius * 1.25,
                    'html_class': 'Transfer',
                    'linecap': 'round',
                    'linejoin': 'round',
                    'opacity': 0.75,
                },
                'draw_callback': (el: svgjs.Container) => {
                    el.forward();
                },
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
                    'color': '#000',
                    'width': environment.station_marker_inner_radius,
                    'html_class': 'Transfer',
                    'linecap': 'round',
                    'linejoin': 'round',
                    'opacity': 0.25,
                },
                'draw_callback': (el: svgjs.Container) => {
                    el.forward();
                },
            }
        );

        return elements;
    }
}
