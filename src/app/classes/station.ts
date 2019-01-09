import { ElementType, ElementParams, Point2D } from './element';
import { Line } from './line';
import { isNull } from 'util';
import { not } from '@angular/compiler/src/output/output_ast';

export class StationProxy {
    line: Line;
    stations: Station[];

    constructor(line: Line, stations: Station[]) {
        this.line = line;
        this.stations = stations;
    }
}

export enum StationLinkDirection {
    NorthWest = "NorthWest",
    North = "North",
    NorthEast = "NorthEast",
    West = "West",
    East = "East",
    SouthWest = "SouthWest",
    South = "South",
    SouthEast = "SouthEast",
}

export interface StationLink {
    direction: StationLinkDirection;
    station?: string;
}

export class Station {
    name: string;
    position?: Point2D;
    links: StationLink[];

    line: Line;
    _parents?: string[] = [];
    parents: Station[] = [];
    _children?: string[] = [];
    children: Station[] = [];

    has_proxy: boolean = false;
    raw_proxy?: any;
    proxy?: StationProxy[];

    under_construction: boolean = false;

    constructor(line: Line, json: any) {
        this.line = line;

        this.name = json.name;
        this.links = json.links;
        this.position = new Point2D(json.x, json.y);

        if ('under_construction' in json) {
            this.under_construction = json.under_construction
        }

        if ('proxy' in json) {
            this.has_proxy = true;
            this.raw_proxy = json.proxy;
            this.proxy = [];
        }

        this._parents = json.parents;
    }

    parse_parents() {
        if (this._parents) {
            for (let parent of this._parents) {
                for (let _station of this.line.stations) {
                    if (parent === _station.name) {
                        this.add_parent(_station)
                        _station.add_children(this)
                    }
                }
            }
        }
    }

    has_link_to(station: Station) {
        var link: StationLink;

        for (let _link of this.links) {
            if (_link.station === station.name) {
                link = _link;
                break;
            }
        }

        return link;
    }

    get_position_by_parents() {
        let prev = this.parents[0];
        let position = new Point2D(
            prev.position.x,
            prev.position.y,
        );

        var link = prev.has_link_to(this);
        if (link === undefined && prev.links.length === 1) {
            link = prev.links[0];
        }
        if (link) {
            switch (link.direction) {
                case StationLinkDirection.NorthWest:
                    position.x -= this.station_margin / 2;
                    position.y -= this.station_margin / 2;
                    break
                case StationLinkDirection.North:
                    position.y -= this.station_margin;
                    break
                case StationLinkDirection.NorthEast:
                    position.x += this.station_margin / 2;
                    position.y -= this.station_margin / 2;
                    break
                case StationLinkDirection.West:
                    position.x -= this.station_margin;
                    break
                case StationLinkDirection.East:
                    position.x += this.station_margin;
                    break
                case StationLinkDirection.SouthWest:
                    position.x -= this.station_margin / 2;
                    position.y += this.station_margin / 2;
                    break
                case StationLinkDirection.South:
                    position.y += this.station_margin;
                    break
                case StationLinkDirection.SouthEast:
                    position.x += this.station_margin / 2;
                    position.y += this.station_margin / 2;
                    break
            }
        }

        return position;
    }

    set_proxy() {
        for (let _proxy of this.raw_proxy) {
            for (let line of this.line.city.lines) {
                if (line.name == _proxy.line) {
                    var stations: Station[] = [];
                    for (let _station of _proxy.stations) {
                        for (let station of line.stations) {
                            if (station.name === _station) {
                                stations.push(station);
                            }
                        }
                    }
                    this.proxy.push(
                        new StationProxy(line, stations)
                    )
                    break;
                }
            }
        }
    }

    add_children(station?: Station) {
        this.children.push(station);
    }

    add_parent(station?: Station) {
        if (station) {
            this.parents.push(station);
            let first_parent = this.parents[0];
            if (first_parent.links) {
                this.position = this.get_position_by_parents();
            }
        }
    }

    // private can_connect_one_line(next: Station) {
    //     var can_connect: boolean = false;

    //     // Check if can be connected with ONE Line
    //     let this_position = new Point2D(this.x, this.y);
    //     let next_position = new Point2D(next.x, next.y);
    //     let next_station_degrees: number = this_position.degrees(next_position);

    //     if (next_station_degrees % this.one_line_connectable_degrees === 0) {
    //         can_connect = true;
    //     } else {
    //         console.log(
    //             this.name,
    //             next_station_degrees
    //         )
    //         can_connect = false;
    //     }

    //     return can_connect;
    // }

    private station_margin = 35;
    private text_size = 10;
    generate_element_params(): ElementParams[] {
        var elements: ElementParams[] = [];

        let line_margin = this.text_size / 2;
        var station_label_margin = {
            'x': this.text_size,
            'y': -this.text_size / 2
        }
        var station_label_position = {
            'x': this.position.x,
            'y': this.position.y,
        }

        // Label
        var label_element_params: ElementParams = {
            'type': ElementType.Text,
            'properties': {
                'text': this.name,
                'size': this.text_size,
                'position': {
                    'x': station_label_position['x'] + station_label_margin['x'],
                    'y': station_label_position['y'] + station_label_margin['y'],
                }
            },
            'attr': {
                'fill': '#000'
            }
        };
        elements.push(label_element_params);

        // Station Marker
        var station_element_params: ElementParams[] = [
            {
                'type': ElementType.Circle,
                'properties': {
                    'radius': this.text_size,
                    'position': {
                        'x': this.position.x,
                        'y': this.position.y,
                    }
                },
                'attr': {
                    'fill': this.line.color
                }
            }
        ];

        // Proxy Layer
        if (this.has_proxy) {
            var proxy_stations: Station[] = [];
            for (let _proxy of this.proxy) {
                for (let _station of _proxy.stations) {
                    if (_station.name === this.name) {
                        proxy_stations.push(_station);
                    }
                }
            }

            for (let proxy_station of proxy_stations) {
                // station_element_params.push(
                //     {
                //         'type': ElementType.Line,
                //         'properties': {
                //             'position': {
                //                 'x1': this.x,
                //                 'y1': this.y,
                //                 'x2': proxy_station.x,
                //                 'y2': proxy_station.y,
                //             }
                //         },
                //         'attr': {
                //             'color': this.line.color,
                //         }
                //     }
                // )
            }
        }

        for (let station_element_param of station_element_params) {
            elements.push(station_element_param);
        }


        // Next Station Connector
        if (this.children.length > 0) {
            for (let child of this.children) {
                var connector_color: string;
                if (this.under_construction) {
                    connector_color = '#ccc';
                } else {
                    connector_color = this.line.color;
                }

                var child_connector: ElementParams = {
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
                        'width': line_margin / 2,
                    }
                }
                elements.push(child_connector);
            }
        }

        return elements;
    }
}