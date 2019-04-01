import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { City } from '../classes/city';
import { Scene } from '../classes/scene';
import { Theme } from '../../themes/theme';

// Replace by API Call
import data from '../../assets/data.json';
import { settings } from '../../themes/default';
import { Subscription } from 'rxjs';
import { ResizeService } from '../services/resize_service';


@Component({
  selector: 'app-subway',
  templateUrl: './subway.html',
  styleUrls: ['./subway.css'],
})
export class SubwayComponent implements OnInit, AfterViewInit, OnDestroy {
  private resizeSubscription: Subscription;
  scene: Scene;

  themes: Theme[];
  selectedTheme: Theme;
  selectedCity: City;
  cities: City[] = [];

  background_color: string;

  constructor(
    private resizeService: ResizeService,
  ) {

  }

  initScene(theme: Theme) {
    if (this.scene === undefined) {
      this.scene = new Scene('canvas', theme);
    }
    this.scene.set_theme(theme);
    this.background_color = theme.settings.background_color;
  }

  ngOnInit() {
    this.themes = settings.themes;
    this.selectedTheme = this.themes[0];
    this.initScene(this.selectedTheme)

    for (const city of data as any[]) {
      this.cities.push(
        new City(city, this.scene.canvas)
      );
    }
    this.cities.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }

      if (b.name > a.name) {
        return -1;
      }

      return 0;
    });
    this.selectedCity = this.cities[0];

    this.resizeSubscription = this.resizeService.onResize$
      .subscribe(event => {
        console.log(event);
      });
  }

  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.selectCity(this.selectedCity);
  }

  selectCity(city: City) {
    this.selectedCity = city;
    this.draw(city);
  }

  selectTheme(theme: Theme) {
    this.selectedTheme = theme;
    this.initScene(theme);
    this.draw(this.selectedCity);
  }

  draw(city: City) {
    this.scene.cleanup();
    city.reset();
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
