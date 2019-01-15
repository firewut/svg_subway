import { Component, OnInit, AfterViewInit } from '@angular/core';

import { City } from '../classes/city';
import { Scene } from '../classes/scene';

// Replace by API Call
import data from '../../assets/data.json';

@Component({
    selector: 'app-subway',
    templateUrl: './subway.html',
    styleUrls: ['./subway.css']
})
export class SubwayComponent implements OnInit, AfterViewInit {
    scene: Scene;

    selectedCity: string;
    cities: City[] = [];

    ngOnInit() {
        for (const city of data as any[]) {
            this.cities.push(
                new City(city)
            );
        }
        this.selectedCity = this.cities[0].name;
    }

    ngAfterViewInit() {
        this.scene = new Scene(
            'canvas',
            window.innerWidth,
            window.innerHeight,
        );

        this.selectCity(this.selectedCity);
    }

    selectCity(event: any) {
        for (const city of this.cities) {
            if (event === city.name) {
                this.draw(city);
                break;
            }
        }
    }

    draw(city: City) {
        this.scene.cleanup();
        this.scene.prepare(
            (scene: Scene) => {
                // City Name
                let cityElementParams = city.generate_element_params();
                scene.addElement(cityElementParams);

                // City Subway Lines
                for (const line of city.lines) {
                    for (const station of line.stations) {
                        let stationElementParams = station.generate_element_params();
                        scene.addElements(stationElementParams);
                    }
                }

                scene.draw();
            }
        );
    }
}
