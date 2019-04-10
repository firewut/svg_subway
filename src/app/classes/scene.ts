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
  RectElement,
  TextElement,
  ElementParams,
  LineDashedElement,
  // -----
  LocationMarker,
  LineDashedTwoColors,
} from './element';

export class Scene {
  container_id: string;
  canvas: svgjs.Container;

  theme: Theme;
  elements: Element[];

  constructor(
    container_id: string,
    theme: Theme,
    callback?: (_: Scene) => any,
  ) {
    this.elements = [];

    this.container_id = container_id;
    this.theme = theme;
    this.canvas = SVG(this.container_id);

    if (callback) {
      this.prepare(callback);
    }
  }

  scaleViewport(x1: number, y1: number, x2: number, y2: number) {
    // Check if line's edges includes to viewport
    const line_width = Math.abs(x1 - x2);
    const line_height = Math.abs(y1 - y2);

    if (
      (
        (
          window.innerHeight - (
            window.innerHeight * settings.viewport.scale_modifier
          )
        ) < line_height
      ) ||
      (
        (
          window.innerWidth - (
            window.innerWidth * settings.viewport.scale_modifier
          )
        ) < line_width
      )
    ) {
      console.log(window.innerWidth, line_width, line_height, window.innerHeight);

    }
    // $('#canvas').animate(
    //   { width: line_width, height: line_height },
    //   settings.viewport.animation_speed
    // );
  }

  moveViewport(top: number, left: number) {
    const x = left - window.innerWidth / 2;
    const y = top - window.innerHeight / 2;

    console.log(x, y);
    $('html, body').animate(
      {
        scrollTop: y,
        scrollLeft: x,
      },
      settings.viewport.animation_speed,
    );
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
      case ElementType.LineDashedTwoColors:
        element = new LineDashedTwoColors(params);
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
