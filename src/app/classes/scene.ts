/// <reference path ="../../../node_modules/@types/jquery/index.d.ts"/>

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

export class Scene {
  container_id: string;
  canvas: svgjs.Container;

  theme: Theme;
  elements: Element[];

  constructor(container_id: string, theme: Theme, callback?: (_: Scene) => any) {
    this.elements = [];

    this.container_id = container_id;
    this.theme = theme;
    this.canvas = SVG(this.container_id);

    // this.canvas.on('wheel', function(el) {
    //   console.log(el);
    // });

    if (callback) {
      this.prepare(callback);
    }
  }

  set_theme(theme: Theme) {
    this.theme = theme;
  }

  resize(grid_size: number[]) {
    this.canvas.size(
      (
        settings.grid.width
      ) *
      grid_size[0],
      (
        settings.grid.height
      ) *
      grid_size[1],
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

  draw() {
    this.drawElements();

    // Background of a Canvas
    const canvas_bbox = this.canvas.rbox();
    const canvas_bg = this.canvas.group();
    const rect = canvas_bg.rect(1, 1);
    canvas_bg.back();
    rect.fill({
      color: this.theme.settings.background_color
    }).size(
      canvas_bbox.w,
      canvas_bbox.h,
    );
  }

  drawElements() {
    for (const element of this.elements) {
      element.draw(this.canvas);
    }
  }
}
