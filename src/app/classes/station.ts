import { ElementType, ElementParams, Point2D } from './element';
import { Line } from './line';
import { StationTransfer } from './transfer';
import { environment } from '../../environments/environment';
import { Theme } from './theme';
import { shadeHexColor } from './helper';

export enum Direction {
    NorthWest = 'NorthWest',
    North = 'North',
    NorthEast = 'NorthEast',
    West = 'West',
    East = 'East',
    SouthWest = 'SouthWest',
    South = 'South',
    SouthEast = 'SouthEast',
}

export interface StationLink {
    direction: Direction;
    length: number;
    station?: string;
}

export class Station {
    name: string;
    name_location: Direction = Direction.West;
    position?: Point2D;
    links: StationLink[];

    line: Line;
    _parents?: string[] = [];
    parents: Station[] = [];
    _children?: string[] = [];
    children: Station[] = [];

    has_transfers = false;
    raw_transfers?: any;
    transfers?: StationTransfer[];

    // start, middle, end
    text_anchor = 'middle';

    text_position: Point2D;
    under_construction = false;

    constructor(line: Line, json: any) {
        this.line = line;
        this.links = json.links || [];

        // Position is a Relative GRID coordinate
        this.position = new Point2D(
            json.x * environment.grid_width,
            json.y * environment.grid_height,
        );
        this.text_position = new Point2D(
            this.position.x,
            this.position.y
        );
        if ('under_construction' in json) {
            this.under_construction = json.under_construction;
        }
        if ('transfers' in json) {
            this.has_transfers = true;
            this.raw_transfers = json.transfers;
            this.transfers = [];
        }

        this._parents = json.parents;

        if ('name' in json) {
            this.name = json.name.value;
            if ('location' in json.name) {
                this.name_location = json.name.location;
            }
        }

    }

    parse_parents() {
        if (this._parents) {
            for (const parent of this._parents) {
                for (const _station of this.line.stations) {
                    if (parent === _station.name) {
                        this.add_parent(_station);
                        _station.add_children(this);
                    }
                }
            }
        }
    }

    has_link_to(station: Station) {
        let link: StationLink;

        for (const _link of this.links) {
            if (_link.station === station.name) {
                link = _link;
                break;
            }
        }

        return link;
    }

    get_next_link() {
        let link: StationLink;
        const next = this.children[0];

        if (next) {
            link = next.has_link_to(this);
            if (link === undefined && next.links.length === 1) {
                link = next.links[0];
            }
        }

        return link;
    }

    get_parent_link() {
        let link: StationLink;
        const prev = this.parents[0];

        if (prev) {
            link = prev.has_link_to(this);
            if (link === undefined && prev.links.length === 1) {
                link = prev.links[0];
            }
        }

        return link;
    }

    get_text_position() {
        const position = new Point2D(this.position.x, this.position.y);

        let lines_count = 0;
        let max_length = 0;
        for (const line of this.name.split('\n')) {
            lines_count += 1;
            if (line.length > max_length) {
                max_length = line.length;
            }
        }

        if (max_length === 0) {
            max_length = this.name.length;
        }
        const text_margin = environment.station_font_size / 2;
        const magic_lines_multiplier = 1.3;

        let dx = 1;
        let dy = 1;

        switch (this.name_location) {
            case Direction.West:
                this.text_anchor = 'end';
                dx -= environment.station_font_size * 0.8;
                dy -= text_margin * magic_lines_multiplier;
                break;
            case Direction.East:
                this.text_anchor = 'start';
                dx += text_margin * magic_lines_multiplier;
                dy -= text_margin * magic_lines_multiplier;
                break;
            case Direction.North:
                this.text_anchor = 'middle';
                dy -= text_margin + (environment.station_font_size * lines_count) * magic_lines_multiplier;
                break;
            case Direction.South:
                this.text_anchor = 'middle';
                dy += text_margin;
                break;
            case Direction.NorthWest:
            case Direction.SouthEast:
            case Direction.NorthEast:
            case Direction.SouthWest:
                break;
        }

        position.x += dx;
        position.y += dy;

        return position;
    }

    get_position_by_parents() {
        const prev = this.parents[0];
        if (prev === undefined) {
            return new Point2D(this.position.x, this.position.y);
        }

        const position = new Point2D(prev.position.x, prev.position.y);
        const link = this.get_parent_link();
        if (link) {
            let distance = environment.station_grid_distance;
            if (link.length) {
                distance *= link.length;
            }
            switch (link.direction) {
                case Direction.NorthWest:
                    position.x -= distance / 2;
                    position.y -= distance / 2;
                    break;
                case Direction.North:
                    position.y -= distance;
                    break;
                case Direction.NorthEast:
                    position.x += distance / 2;
                    position.y -= distance / 2;
                    break;
                case Direction.West:
                    position.x -= distance;
                    break;
                case Direction.East:
                    position.x += distance;
                    break;
                case Direction.SouthWest:
                    position.x -= distance / 2;
                    position.y += distance / 2;
                    break;
                case Direction.South:
                    position.y += distance;
                    break;
                case Direction.SouthEast:
                    position.x += distance / 2;
                    position.y += distance / 2;
                    break;
            }
        }

        return position;
    }

    add_transfer(transfer: StationTransfer) {
        this.transfers.push(transfer);
    }

    add_children(station?: Station) {
        this.children.push(station);
    }

    add_parent(station?: Station) {
        if (station) {
            this.parents.push(station);
            const first_parent = this.parents[0];
            if (first_parent.links) {
                // Order MATTERS
                if (this.links.length === 0) {
                    this.links = [
                        {
                            direction: first_parent.links[0].direction,
                            length: first_parent.links[0].length,
                        }
                    ];
                }
                this.position = this.get_position_by_parents();
            }
        }
    }

    set_params() {
        this.position = this.get_position_by_parents();
        this.text_position = this.get_text_position();
    }

    generate_element_params(theme: Theme): ElementParams[] {
        const elements: ElementParams[] = [];

        const label_element_params: ElementParams = {
            'type': ElementType.Text,
            'properties': {
                'text': this.name,
                'size': environment.station_font_size,
                'position': {
                    'x': this.text_position.x,
                    'y': this.text_position.y,
                },
                'anchor': this.text_anchor,
                'weight': environment.station_font_weight,
            },
            'attr': {
                'fill': theme.settings.station_font_color,
            },
            'draw_callback': (el: svgjs.Container) => {
                el.front();
            },
        };


        elements.push(label_element_params);

        // Station Marker
        const station_element_params: ElementParams[] = [
            {
                'type': ElementType.Circle,
                'properties': {
                    'radius': environment.station_marker_outer_radius,
                    'position': {
                        'x': this.position.x,
                        'y': this.position.y,
                    }
                },
                'attr': {
                    'fill': shadeHexColor(
                        this.line.color, 0.5
                    )
                }
            },
            {
                'type': ElementType.Circle,
                'properties': {
                    'radius': environment.station_marker_inner_radius,
                    'position': {
                        'x': this.position.x,
                        'y': this.position.y,
                    }
                },
                'attr': {
                    'fill': theme.settings.station_marker_inner_color
                }
            }
        ];

        for (const station_element_param of station_element_params) {
            elements.push(station_element_param);
        }

        // Next Station Connector
        if (this.children.length > 0) {
            for (const child of this.children) {
                let connector_color: string;
                if (this.under_construction) {
                    connector_color = theme.settings.station_under_construction_color;
                } else {
                    connector_color = this.line.color;
                }

                const child_connector: ElementParams = {
                    'type': ElementType.Line,
                    'properties': {
                        'position': {
                            'x1': this.position.x,
                            'y1': this.position.y,
                            'x2': child.position.x,
                            'y2': child.position.y,
                        }
                    },
                    'attr': {
                        'color': connector_color,
                        'width': environment.station_line_width,
                        'html_class': 'Line',
                    },
                    'draw_callback': (el: svgjs.Container) => {
                        el.back();
                    },
                };
                elements.push(child_connector);
            }
        }

        return elements;
    }
}
