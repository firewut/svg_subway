/// <reference path ="../../../node_modules/@types/jquery/index.d.ts"/>

import * as SVG from 'svg.js';

import {
    Element,
    ElementType,
    TextElement,
    CircleElement,
    LineElement,
    RectElement,
    ElementParams,
} from './element';

export class Scene {
    container_id: string;
    width: number;
    height: number;

    canvas: svgjs.Container;

    center = [0, 0];
    min_side: number;
    elements: Element[];

    constructor(container_id: string, width: number, height: number, callback?: (_: Scene) => any) {
        this.min_side = Math.min(width, height);
        this.elements = [];

        this.center = [
            this.min_side / 2,
            this.min_side / 2,
        ];

        this.container_id = container_id;
        this.width = this.min_side - 50;
        this.height = this.min_side - 50;

        if (callback) {
            this.prepare(callback);
        }
    }

    prepare(callback: (_: Scene) => any) {
        if (this.canvas) {
            callback(this);
        } else {
            $(() => {
                const canvas = SVG(this.container_id).size(this.width, this.height);
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
