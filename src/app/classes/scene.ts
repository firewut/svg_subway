declare var $: any;
import * as SVG from 'svg.js';

import { PolyLineElement } from './element';
import { Theme } from '../../themes/theme';
import { settings } from '../../themes/default';

import {
  Element,
  ElementType,
  CircleElement,
  LineElement,
  LocationMarker,
  RectElement,
  TextElement,
  ElementParams,
  LineDashedElement,
  LineDashedTwoColorsElement,
} from './element';
import { ElementRef } from '@angular/core';

export class Scene {
  container_id: string;
  canvas: svgjs.Container;

  elementRef: ElementRef;
  theme: Theme;
  elements: Element[];

  constructor(
    container_id: string,
    theme: Theme,
    elementRef: ElementRef,
    callback?: (_: Scene) => any,
  ) {
    this.elements = [];
    this.elementRef = elementRef;

    this.container_id = container_id;
    this.theme = theme;
    this.canvas = SVG(this.container_id);

    if (callback) {
      this.prepare(callback);
    }
  }

  moveViewport(top: number, left: number) {
    console.log(top, left);
    window.scrollTo({
      top: top - window.outerHeight / 2,
      left: left - window.outerWidth / 2,
      behavior: 'smooth'
    });
  }

  zoomViewport(delta: number) {
    this.canvas.scale(delta, delta);
  }

  centerViewport() {
    const canvas_viewbox = this.canvas.viewbox();

    this.moveViewport(
      canvas_viewbox.height / 2,
      canvas_viewbox.width / 2,
    );
  }

  set_theme(theme: Theme) {
    this.theme = theme;
  }

  resize(grid_size: number[]) {
    this.canvas.size(
      settings.grid.width * grid_size[0],
      settings.grid.height * grid_size[1],
    );

    const canvas_viewbox = this.canvas.viewbox();
    $('body').width(
      canvas_viewbox.width
    ).height(
      canvas_viewbox.height
    );
  }

  prepare(callback: (_: Scene) => any) {
    if (this.canvas) {
      callback(this);
    } else {
      $(() => {
        const canvas = SVG(this.container_id);
        this.canvas = canvas;
        callback(this);
      });
    }
  }

  addElements(params: ElementParams[]) {
    for (const param of params) {
      this.addElement(param);
    }
  }

  addElement(params: ElementParams) {
    let element: Element;

    switch (params.type) {
      case ElementType.Text:
        element = new TextElement(params);
        break;
      case ElementType.Circle:
        element = new CircleElement(params);
        break;
      case ElementType.Line:
        element = new LineElement(params);
        break;
      case ElementType.LineDashedElement:
        element = new LineDashedElement(params);
        break;
      case ElementType.LineDashedTwoColorsElement:
        element = new LineDashedTwoColorsElement(params);
        break;
      case ElementType.Rect:
        element = new RectElement(params);
        break;
      case ElementType.PolyLineElement:
        element = new PolyLineElement(params);
        break;
      case ElementType.LocationMarker:
        element = new LocationMarker(params);
        break;
      default:
        console.log(params);
    }

    this.elements.push(element);

    return element;
  }

  cleanup() {
    this.canvas.children().forEach((el: SVG.Container) => {
      el.clear();
    });
    this.elements = [];
  }

  draw(callback: (_: Scene) => any) {
    this.drawElements(callback);
  }

  drawElements(callback: (_: Scene) => any) {
    for (const element of this.elements) {
      element.draw(this.canvas);
    }
    callback(this);
  }
}
