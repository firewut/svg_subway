declare var $: any;

import * as SVGJS from '@svgdotjs/svg.js';
import '@svgdotjs/svg.filter.js';

import { PolylineElement } from './element';
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
import { ElementRef } from '@angular/core';

export class Scene {
  container_id: string;
  canvas: SVGJS.Container;

  theme: Theme;
  elements: Element[];

  viewportPointsHistory: number[][] = [];

  constructor(container_id: string, theme: Theme) {
    this.elements = [];

    this.container_id = container_id;
    this.theme = theme;
  }

  get_min_edge() {
    return Math.min(
      Math.abs(window.innerWidth),
      Math.abs(window.innerHeight),
    );
  }

  scaleViewport(x1: number, y1: number, x2: number, y2: number) {
    // This should Fit Route to Viewport
    let scaled = false;

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
      // Scaling should engage
      const zoom_level_height = line_height / window.innerHeight;
      const zoom_level_width = line_width / window.innerWidth;

      const zoom_level = Math.max(zoom_level_width, zoom_level_height);
    }
  }

  addToMoveHistory(top: number, left: number) {
    this.viewportPointsHistory.push(
      [top, left]
    );
  }

  backViewport() {
    const last_coords = this.viewportPointsHistory[
      this.viewportPointsHistory.length - 1
    ];
    if (last_coords) {
      this.moveViewport(last_coords[0], last_coords[1], true);
    }
  }

  moveViewport(top: number, left: number, skip_history?: boolean) {
    const x = left - window.innerWidth / 2;
    const y = top - window.innerHeight / 2;

    if (!skip_history) {
      this.addToMoveHistory(top, left);
    }

    $('html, body').animate(
      {
        scrollTop: y,
        scrollLeft: x,
      },
      settings.viewport.animation_speed,
    );
  }

  centerViewport() {
    const canvas_bbox = this.canvas.bbox();

    this.moveViewport(
      canvas_bbox.height / 2,
      canvas_bbox.width / 2,
      true,
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
      this.canvas = SVGJS.SVG().addTo('#' + this.container_id);
      callback(this);
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
      case ElementType.PolylineElement:
        element = new PolylineElement(params);
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
    if (this.canvas) {
      this.canvas.children().forEach((el: SVGJS.Container) => {
        el.remove();
      });
      this.elements = [];
    }
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
