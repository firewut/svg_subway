import { Line } from './line';
import { ElementType, ElementParams } from './element';

export class City {
    name: string;
    logo: string;
    lines: Line[];

    constructor(json: any) {
        this.name = json.name;
        this.lines = [];
        for (let line of json.lines) {
            this.lines.push(
                new Line(this, line)
            );
        }

        for (let line of this.lines) {
            line.set_proxies();
        }
    }

    generate_element_params(): ElementParams {
        return {
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
    }
}