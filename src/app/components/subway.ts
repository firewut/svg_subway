declare var $: any;

import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import { MatBottomSheet } from '@angular/material';

import { City } from '../classes/city';
import { Scene } from '../classes/scene';
import { Theme } from '../../themes/theme';
import { environment } from '../../environments/environment';

// Replace by API Call
import data from '../../assets/data.json';
import { settings } from '../../themes/default';
import { Subscription } from 'rxjs';
import { RouteOverviewSheetComponent } from './route-overview';

@Component({
  selector: 'app-subway',
  templateUrl: './subway.html',
  styleUrls: ['./subway.css'],
})
export class SubwayComponent implements
  OnInit,
  AfterViewInit,
  OnDestroy {

  private resizeSubscription: Subscription;
  scene: Scene;

  themes: Theme[];
  selectedTheme: Theme;
  selectedCity: City;
  cities: City[] = [];

  feedback_email = '';

  constructor(
    private elementRef: ElementRef,
    private bottomSheet: MatBottomSheet,
  ) {
    if (environment.feedback_email.length > 0) {
      this.feedback_email = `mailto:${environment.feedback_email}`;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: Event) {
    // Resize UI
    const min_edge = Math.min(
      Math.abs(window.innerWidth),
      Math.abs(window.innerHeight),
    );

    const button_scale = 10;
    const button_size = min_edge / button_scale;

    $('.scale_size_preserve')
      .css('width', button_size)
      .css('height', button_size)
      .css('line-height', 0);
    $('.scale_size_preserve .mat-button-wrapper')
      .css('width', button_size / 2)
      .css('height', button_size / 2)
      .css('padding', button_size / 4)
      .css('line-height', 0);
    $('.scale_size_preserve .mat-button-wrapper .mat-icon')
      .css('width', button_size / 2)
      .css('height', button_size / 2)
      .css('font-size', button_size / 2);

    // Resize rest UI
    if (this.selectedCity) {
      this.selectedCity.resize_ui();
    }
  }

  openBottomSlider() {
    if (this.selectedCity) {
      if (this.selectedCity.active_route_group_for_overview.length > 0) {
        this.bottomSheet.open(
          RouteOverviewSheetComponent, {
            data: this.selectedCity
          }
        );
      }
    }
  }

  initScene(theme: Theme) {
    if (this.scene === undefined) {
      this.scene = new Scene('canvas', theme);
    }
    localStorage.setItem('theme_name', theme.name);
    this.scene.set_theme(theme);

    this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = theme.settings.background_color;
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
  }

  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.onResize();
    this.initScene(this.selectedTheme);

    // City
    for (const city of data as any[]) {
      this.cities.push(new City(city));
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

    this.selectCity(this.selectedCity);
  }

  selectCity(city: City) {
    localStorage.setItem('city_name', city.name);
    this.selectedCity = city;
    this.draw(city);
  }

  selectTheme(theme: Theme) {
    if (this.selectedTheme === theme) {
      return;
    }
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
        city.set_scene(scene);

        scene.addElements(
          city.generate_element_params(scene.theme)
        );

        scene.draw((_scene: Scene) => {
          _scene.centerViewport();
          city.resize_ui();
        });
      }
    );
  }
}
