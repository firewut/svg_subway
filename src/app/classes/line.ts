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

        for (const station_json of json.stations) {
            this.stations.push(
                new Station(this, station_json)
            );
        }

        // Set Parents
        let prev_station: Station;
        for (const station of this.stations) {
            station.parse_parents();

            if (station.parents.length === 0) {
                station.add_parent(prev_station);
            }

            prev_station = station;
        }

        // Set Children
        let next_station: Station;
        let i = 1;
        for (const station of this.stations) {
            next_station = this.stations[i];
            if (next_station) {
                for (const parent of next_station.parents) {
                    if (parent.name === station.name) {
                        station.add_children(next_station);
                    }
                }
                i += 1;
            }
        }

        for (const station of this.stations) {
            station.set_params();
        }
    }

    set_proxies() {
        for (const station of this.stations) {
            if (station.has_proxy) {
                station.set_proxy();
            }
        }
    }
}
