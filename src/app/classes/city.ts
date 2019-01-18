import { Line } from './line';
import { ElementType, ElementParams } from './element';
import { Station } from './station';
import { StationTransfer } from './transfer';

export class City {
    name: string;
    logo: string;
    lines: Line[];

    constructor(json: any) {
        this.name = json.name;
        this.lines = [];
        for (const line of json.lines) {
            this.lines.push(
                new Line(this, line)
            );
        }

        for (const line of this.lines) {
            line.set_transfers();
        }
    }

    generate_element_params(): ElementParams[] {
        const element_params: ElementParams[] = [];

        // City Name
        element_params.push(
            {
                'type': ElementType.Text,
                'properties': {
                    'text': this.name,
                    'size': 50,
                    'position': {
                        'x': 0,
                        'y': 0
                    }
                },
                'attr': {
                    'fill': '#000'
                }
            }
        );

        for (const line of this.lines) {
            // City Subway Lines
            for (const station of line.stations) {
                for (const station_element_param of station.generate_element_params()) {
                    element_params.push(station_element_param);
                }
            }

            // City Subway transfers
            for (const transfer of line.transfers) {
                for (const transfer_element of transfer.generate_element_params()) {
                    element_params.push(transfer_element);
                }
            }
        }


        return element_params;
    }
}
