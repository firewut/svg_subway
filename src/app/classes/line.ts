import { Station } from './station';
import { City } from './city';
import { StationTransfer } from './transfer';

export class Line {
    city: City;
    name: string;
    color: string;
    stations: Station[];
    transfers: StationTransfer[];

    constructor(city: City, json: any) {
        this.city = city;
        this.name = json.name;
        this.color = json.color;
        this.stations = [];
        this.transfers = [];

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

    set_transfers() {
        for (const station of this.stations) {
            if (station.has_transfers) {
                for (const _transfer of station.raw_transfers) {
                    for (const line of this.city.lines) {
                        if (line.name === _transfer.line) {
                            const transfer_stations: Station[] = [];

                            for (const _station of _transfer.stations) {
                                const line_station = line.get_station_by_name(_station);
                                if (line_station) {
                                    transfer_stations.push(line_station);
                                }
                            }

                            if (transfer_stations.length > 0) {
                                this.transfers.push(
                                    new StationTransfer(line, station, transfer_stations)
                                );
                            }

                            // break;
                        }
                    }
                }
            }
        }
    }

    get_station_by_name(name: string) {
        let station: Station;
        for (const _station of this.stations) {
            if (_station.name === name) {
                station = _station;
            }
        }
        return station;
    }
}
