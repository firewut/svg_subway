import { Station } from './station';
import { City } from './city';

export class Line {
    city: City;
    name: string;
    color: string;
    stations: Station[];

    constructor(city: City, json: any) {
        this.city = city;
        this.name = json.name;
        this.color = json.color;
        this.stations = [];

        for (let station_json of json.stations) {
            let station = new Station(this, station_json);
            this.stations.push(station);
        }

        var prev_station: Station;
        for (let station of this.stations) {
            station.parse_parents();

            if (station.parents.length === 0) {
                station.add_parent(prev_station);
            }

            prev_station = station;
        }

        // Set Children
        var next_station: Station;
        var i = 1;
        for (let station of this.stations) {
            next_station = this.stations[i]
            if (next_station) {
                for (let parent of next_station.parents) {
                    if (parent.name === station.name) {
                        station.add_children(next_station);
                    }
                }
                i += 1;
            }
        }
    }

    set_proxies() {
        for (let station of this.stations) {
            if (station.has_proxy) {
                station.set_proxy();
            }
        }
    }
}