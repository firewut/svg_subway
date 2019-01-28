import { Component, OnInit, AfterViewInit } from '@angular/core';

import { City } from '../classes/city';
import { Scene } from '../classes/scene';
import { Theme } from '../../themes/theme';

// Replace by API Call
import data from '../../assets/data.json';
import { settings } from '../../themes/default';

@Component({
  selector: 'app-subway',
  templateUrl: './subway.html',
  styleUrls: ['./subway.css']
})
export class SubwayComponent implements OnInit, AfterViewInit {
  scene: Scene;

  theme: Theme;
  selectedCity: string;
  cities: City[] = [];

  background_color: string;

  ngOnInit() {
    this.theme = settings.themes[0];
    this.scene = new Scene('canvas', this.theme);
    this.background_color = this.theme.settings.background_color;

    for (const city of data as any[]) {
      this.cities.push(
        new City(city, this.scene.canvas)
      );
    }
    this.selectedCity = this.cities[0].name;
  }

  ngAfterViewInit() {
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
        this.scene.resize(city.size);
        scene.addElements(
          city.generate_element_params(scene.theme)
        );

        scene.draw();
      }
    );
  }
}
