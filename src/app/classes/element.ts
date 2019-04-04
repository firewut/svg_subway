import * as SVG from 'svg.js';

import { makeid, shadeHexColor } from './helper';
import { environment } from '../../environments/environment';
import { settings } from '../../themes/default';

export enum ElementType {
  Text,
  Circle,
  Line,
  Rect,
  PolyLineElement,
  LocationMarker,
  LineDashedElement,
  LineDashedTwoColorsElement,
}

export interface ElementParams {
  attr: any;
  classes: string[];
  properties: any;
  type: ElementType;
  group: svgjs.G;

  draw_callback?: (_: svgjs.Shape) => any;
}

export interface Element {
  id: string;
  attr: any;
  classes: string[];
  position: Point2D;
  param: ElementParams;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle: boolean;

  toggle: () => any;
  check: () => any;
  uncheck: () => any;

  highlight: () => any;
  unhighlight: () => any;

  draw: (_: svgjs.Container) => any;
  draw_callback: (_: svgjs.Shape) => any;
}

export class LocationMarker {
  id: string;
  attr: any;
  classes: string[] = [];
  position: Point2D;

  param: ElementParams;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;

  text: string;

  constructor(params: ElementParams) {
    this.id = makeid();
    this.attr = params.attr;
    this.classes = params.classes;
    this.param = params;

    this.position = new Point2D(
      params.properties['position']['x'],
      params.properties['position']['y'],
    );

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }

    if ('text' in params.properties) {
      this.text = params.properties['text'];
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Container = canvas.group();


    const circle: SVG.Circle = svg_element.circle(
      settings.location_marker.radius
    );
    const text: SVG.Text = svg_element.text(
      this.text
    );
    const radius_part = settings.location_marker.radius / 3;
    const v: SVG.PolyLine = svg_element.polyline(
      `${radius_part},${radius_part * 2} ${radius_part * 1.5},${radius_part * 3} 
      ${radius_part * 2},${radius_part * 2}`
    );

    circle.attr({
      fill: this.attr['marker-fill'],
    });
    text.font({
      family: 'Inconsolata',
      size: settings.location_marker.text_size,
    }).attr({
      fill: this.attr['text-fill'],
    });
    v.attr({
      fill: this.attr['marker-fill'],
    });

    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    circle.center(this.position.x, this.position.y);
    text.center(this.position.x, this.position.y);
    v.center(this.position.x, this.position.y + radius_part * 1.7);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;

    return this.svg_element;
  }

  highlight() { }

  unhighlight() { }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.click_toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }

  check() { }

  uncheck() { }
}

export class TextElement {
  id: string;
  attr: any;
  classes: string[] = [];
  param: ElementParams;
  position: Point2D;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;

  text: string;
  family = 'Inconsolata';
  size = 15;
  anchor = 'left';
  weight = '1em';

  constructor(params: ElementParams) {
    this.id = makeid();
    this.text = params.properties['text'];
    this.attr = params.attr;
    this.classes = params.classes;
    this.param = params;

    this.position = new Point2D(
      params.properties['position']['x'],
      params.properties['position']['y'],
    );
    this.size = params.properties['size'];

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }

    if ('weight' in params.properties) {
      this.weight = params.properties['weight'];
    }

    if ('anchor' in params.properties) {
      this.anchor = params.properties['anchor'];
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Text = canvas.text(this.text);
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.font(
      {
        family: this.family,
        size: this.size,
        anchor: this.anchor,
        weight: this.weight
      }
    );
    svg_element.attr(this.attr);
    svg_element.move(this.position.x, this.position.y);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;

    if (environment.hasOwnProperty('debug')) {
      if (environment.debug === true) {
        const b = svg_element.bbox();
        canvas.rect(b.width, b.height).opacity(0.25).move(b.x, b.y).back();

        const min_text_size = Math.min(5, this.size / 2);
        const size_margin = min_text_size + min_text_size / 2;
        // Mark with Size
        canvas.text(
          `${b.width.toFixed(0)}`
        ).font(
          { size: min_text_size }
        ).attr(
          { fill: '#fff' }
        ).move(
          b.x - size_margin,
          b.y
        ).back();

        canvas.text(
          `${b.height.toFixed(2)}`
        ).font(
          { size: min_text_size }
        ).attr(
          { fill: '#fff' }
        ).move(
          b.x - size_margin,
          b.y + min_text_size
        ).back();
      }
    }

    return this.svg_element;
  }

  highlight() { }

  unhighlight() { }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.click_toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }

  check() {
    this.svg_element.attr('font-weight', 'bold');
  }

  uncheck() {
    this.svg_element.attr('font-weight', this.weight);
  }
}

export class CircleElement {
  id: string;
  position: Point2D;
  attr: any;
  classes: string[] = [];
  param: ElementParams;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;

  center: Point2D;
  radius: number;

  constructor(params: ElementParams) {
    this.id = makeid();
    this.attr = params.attr;
    this.classes = params.classes;
    this.param = params;

    // this.draw_callback = params.draw_callback;
    this.position = new Point2D(
      params.properties['position']['x'],
      params.properties['position']['y'],
    );
    this.center = this.position;
    this.radius = params.properties['radius'];

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Circle = canvas.circle(this.radius);
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.center(this.position.x, this.position.y);
    svg_element.attr(this.attr);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return svg_element;
  }

  highlight() { }

  unhighlight() { }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }
  check() {

  }

  uncheck() {

  }
}

export class PolyLineElement {
  id: string;
  attr: any;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;
  param: ElementParams;
  classes: string[] = [];
  position: Point2D;

  points: number[][] = [];

  constructor(params: ElementParams) {
    this.id = makeid();
    this.attr = params.attr;
    this.classes = params.classes;
    this.param = params;

    for (const _point of params.properties['points']) {
      this.points.push(_point);
    }

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const points_array: number[][] = [];

    for (const point of this.points) {
      points_array.push(
        point
      );
    }

    const svg_element: SVG.PolyLine = canvas.polyline(points_array);
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.stroke(this.attr);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return svg_element;
  }

  highlight() { }

  unhighlight() { }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }
  check() {

  }

  uncheck() {

  }
}

export class LineElement {
  id: string;
  position: Point2D;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;
  attr: any;
  param: ElementParams;
  classes: string[] = [];

  x1: number;
  y1: number;
  x2: number;
  y2: number;

  constructor(params: ElementParams) {
    this.id = makeid();
    this.attr = params.attr;
    this.param = params;
    this.classes = params.classes;
    // this.draw_callback = params.draw_callback;
    this.position = new Point2D(
      params.properties['position']['x1'],
      params.properties['position']['y1'],
    );

    this.x1 = params.properties['position']['x1'];
    this.y1 = params.properties['position']['y1'];
    this.x2 = params.properties['position']['x2'];
    this.y2 = params.properties['position']['y2'];

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Shape = canvas.line(this.x1, this.y1, this.x2, this.y2);
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.stroke(this.attr);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return svg_element;
  }

  highlight() { }

  unhighlight() { }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }
  check() {

  }

  uncheck() {

  }
}

export class LineDashedElement extends LineElement {
  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Line = canvas.line(this.x1, this.y1, this.x2, this.y2);
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.stroke(this.attr);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return svg_element;
  }
}

export class LineDashedTwoColorsElement extends LineElement {
  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Container = canvas.group();

    const line = svg_element.line(this.x1, this.y1, this.x2, this.y2);
    const dashed_line = svg_element.line(this.x1, this.y1, this.x2, this.y2);

    dashed_line.before(line);

    line.stroke({
      'color': this.attr.color,
      'width': this.attr.width,
    });
    dashed_line.stroke({
      'color': this.attr.dashed_line_color,
      'width': this.attr.width,
      'dasharray': this.attr.dashed_line_dasharray,
    });

    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return svg_element;
  }
}

export class RectElement {
  id: string;
  position: Point2D;
  svg_element: SVG.Shape;
  group: SVG.G;
  click_toggle = false;
  attr: any;
  param: ElementParams;
  classes: string[] = [];

  x1: number;
  y1: number;
  x2: number;
  y2: number;

  radius = 0;

  constructor(params: ElementParams) {
    this.id = makeid();
    this.attr = params.attr;
    this.classes = params.classes;
    this.param = params;
    // this.draw_callback = params.draw_callback;
    this.position = new Point2D(
      params.properties['position']['x1'],
      params.properties['position']['y1'],
    );

    this.x1 = params.properties['position']['x1'];
    this.y1 = params.properties['position']['y1'];
    this.x2 = params.properties['position']['x2'];
    this.y2 = params.properties['position']['y2'];

    if ('radius' in params.properties) {
      this.radius = params['properties']['radius'];
    }

    if (params.draw_callback) {
      this.draw_callback = params.draw_callback;
    }
  }

  draw_callback(element: svgjs.Shape) { }

  draw(canvas: svgjs.Container) {
    const svg_element: SVG.Rect = canvas.rect(
      Math.abs(this.x1 - this.x2),
      Math.abs(this.y1 - this.y2),
    );
    svg_element.remember('element', this);
    svg_element.remember('param', this.param);

    svg_element.radius(this.radius);
    svg_element.move(this.position.x, this.position.y);
    svg_element.attr(this.attr);

    for (const _class of this.classes) {
      svg_element.addClass(_class);
    }

    if (this.param.group) {
      svg_element.addTo(this.param.group);
      this.group = this.param.group;
    }

    this.draw_callback(svg_element);

    this.svg_element = svg_element;
    return this.svg_element;
  }

  highlight() {

  }

  unhighlight() {

  }

  toggle() {
    this.click_toggle = !this.click_toggle;
    if (this.toggle) {
      this.check();
    } else {
      this.uncheck();
    }
  }
  check() {

  }

  uncheck() {

  }
}

export class Point2D {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x || 0;
    this.y = y || 0;
  }

  length = function() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  };

  normalize = function() {
    this.divideScalar(this.length());
  };

  degrees = function(another_point: Point2D) {
    return Math.atan2(
      (another_point.y - this.y),
      (another_point.x - this.x)
    ) * (180 / Math.PI);
  };
}
