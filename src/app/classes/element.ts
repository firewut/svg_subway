import * as SVG from 'svg.js';

import { makeid } from './helper';
import { environment } from '../../environments/environment';

export enum ElementType {
    Text,
    Circle,
    Line,
    Rect,
}

export interface Element {
    id: string;
    position: Point2D;
    svg_element: SVG.Shape;
    attr: any;

    draw: (_: svgjs.Container) => any;
    draw_callback: (_: svgjs.Shape) => any;
}

export interface ElementParams {
    type: ElementType;
    properties: any;
    attr: any;

    draw_callback?: (_: svgjs.Shape) => any;
}

export class TextElement {
    id: string;
    position: Point2D;
    svg_element: SVG.Shape;
    attr: any;

    text: string;
    family = 'Inconsolata';
    size = 15;
    anchor = 'left';

    constructor(params: ElementParams) {
        this.id = makeid();
        this.text = params.properties['text'];
        this.attr = params.attr;

        this.position = new Point2D(
            params.properties['position']['x'],
            params.properties['position']['y'],
        );
        this.size = params.properties['size'];

        if (params.draw_callback) {
            this.draw_callback = params.draw_callback;
        }

        if ('anchor' in params.properties) {
            this.anchor = params.properties['anchor'];
        }
    }

    draw_callback(element: svgjs.Shape) {

    }

    draw(canvas: svgjs.Container) {
        const svg_element: SVG.Text = canvas.text(this.text);

        svg_element.font({ family: this.family, size: this.size, anchor: this.anchor });
        svg_element.attr(this.attr);
        svg_element.move(this.position.x, this.position.y);

        this.draw_callback(svg_element);

        this.svg_element = svg_element;

        if (environment.hasOwnProperty('debug')) {
            if (environment.debug === true) {
                const b = svg_element.bbox();
                canvas.rect(b.width, b.height).opacity(0.25).move(b.x, b.y);

                const min_text_size = Math.min(5, this.size / 2);
                const size_margin = min_text_size + min_text_size / 2;
                // Mark with Size
                canvas.text(
                    `${b.width.toPrecision(2)}`
                ).font(
                    {size: min_text_size}
                ).attr(
                    {fill: '#fff'}
                ).move(b.x - size_margin, b.y);

                canvas.text(
                    `${b.height.toPrecision(2)}`
                ).font(
                    {size: min_text_size}
                ).attr(
                    {fill: '#fff'}
                ).move(b.x - size_margin, b.y + min_text_size);
            }
        }


        return this.svg_element;
    }
}

export class CircleElement {
    id: string;
    position: Point2D;
    svg_element: SVG.Shape;
    attr: any;

    center: Point2D;
    radius: number;

    constructor(params: ElementParams) {
        this.id = makeid();
        this.attr = params.attr;
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

    draw_callback(element: svgjs.Shape) {

    }

    draw(canvas: svgjs.Container) {
        const svg_element: SVG.Circle = canvas.circle(this.radius);

        svg_element.center(this.position.x, this.position.y);
        svg_element.attr(this.attr);

        this.draw_callback(svg_element);

        this.svg_element = svg_element;
        return svg_element;
    }
}

export class LineElement {
    id: string;
    position: Point2D;
    svg_element: SVG.Shape;
    attr: any;

    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(params: ElementParams) {
        this.id = makeid();
        this.attr = params.attr;
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

    draw_callback(element: svgjs.Shape) {

    }

    draw(canvas: svgjs.Container) {
        const svg_element: SVG.Line = canvas.line(this.x1, this.y1, this.x2, this.y2);

        svg_element.stroke(this.attr);

        this.draw_callback(svg_element);

        this.svg_element = svg_element;
        return svg_element;
    }
}

export class RectElement {
    id: string;
    position: Point2D;
    svg_element: SVG.Shape;
    attr: any;

    x1: number;
    y1: number;
    x2: number;
    y2: number;

    constructor(params: ElementParams) {
        this.id = makeid();
        this.attr = params.attr;
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

    draw_callback(element: svgjs.Shape) {

    }

    draw(canvas: svgjs.Container) {
        const svg_element: SVG.Rect = canvas.rect(
            Math.abs(this.x1 - this.x2),
            Math.abs(this.y1 - this.y2),
        );

        svg_element.move(this.position.x, this.position.y);
        svg_element.attr(this.attr);

        this.draw_callback(svg_element);

        this.svg_element = svg_element;
        return svg_element;
    }
}

export class Point2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x || 0;
        this.y = y || 0;
    }

    length = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    };

    normalize = function () {
        this.divideScalar(this.length());
    };

    degrees = function (another_point: Point2D) {
        return Math.atan2(
            (another_point.y - this.y),
            (another_point.x - this.x)
        ) * (180 / Math.PI);
    };
}
