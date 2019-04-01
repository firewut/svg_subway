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
    localStorage.setItem('theme_name', theme.name);
    this.scene.set_theme(theme);
    this.background_color = theme.settings.background_color;
  }

  ngOnInit() {
    // Theme 
    this.themes = settings.themes;
    this.selectedTheme = this.themes[0];
    const saved_theme_name = localStorage.getItem('theme_name');
    const local_theme = this.themes.filter(t => t.name === saved_theme_name);
    if (local_theme.length > 0) {
      this.selectedTheme = local_theme[0];
    }
    this.initScene(this.selectedTheme)

    // City
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
    const last_city_name = localStorage.getItem('city_name');
    const last_city = this.cities.filter(t => t.name === last_city_name);
    if (last_city.length > 0) {
      this.selectedCity = last_city[0];
    }

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
    localStorage.setItem('city_name', city.name);
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
