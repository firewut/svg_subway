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

    if (callback) {
      this.prepare(callback);
    }
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
    for (const element of this.elements) {
      element.svg_element.remove();
    }
    this.elements = [];
  }

  draw() {
    this.drawElements();
  }

  drawElements() {
    for (const element of this.elements) {
      element.draw(this.canvas);
    }
  }
}
