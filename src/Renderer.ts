import { Shader } from './Shader';
import Line from './Line';
import { mat4, glMatrix } from 'gl-matrix';

/*
вынесте логику формирования линий в GridRenderer, тут оставить только логику рендеринга сцены
*/

type Scene = {
    lines: DrawLine[];
}

type DrawLine = {
    line: Line;
    color: number[];
    model: mat4;
}

const backgroundGrayscale = 0.2;

class Renderer {
    private width: number;
    private height: number;
    private center = [0, 0];
    private shader: Shader | null = null;
    private isMouseDown = false;
    private startPos = [0, 0];
    private gl: WebGLRenderingContext;
    private line: Line;
    private scale = 1.0;

    private zoom: number = 0;

    constructor(
        gl: WebGLRenderingContext, canvas: HTMLCanvasElement,
        width: number, height: number,
        vertShader: string, fragShader: string) {

        this.gl = gl;
        this.width = width;
        this.height = height;

        canvas.addEventListener("mousedown", e => this.onMouseDown(e));
        canvas.addEventListener("mouseup", _ => this.onMouseUp());
        canvas.addEventListener("mousemove", e => this.onMouseMove(e));
        canvas.addEventListener("wheel", e => this.onWheel(e));

        this.shader = new Shader(this.gl, vertShader, fragShader);
        this.line = new Line(this.gl, this.shader);
    }

    private onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
        this.startPos = [
            this.center[0] + event.clientX / this.scale,
            this.center[1] - event.clientY / this.scale,
        ];
    }

    private onMouseUp() {
        this.isMouseDown = false;
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isMouseDown) return;
        this.center = [
            this.startPos[0] - event.clientX / this.scale,
            this.startPos[1] + event.clientY / this.scale
        ];
        console.log(this.center);
        this.render();
    }

    private onWheel(event: WheelEvent) {
        this.zoom -= Math.sign(event.deltaY) * 0.15;
        this.scale = Math.exp(this.zoom);
        this.render();
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    render() {
        if (!this.shader) return;

        const levelscount = 7;
        const gridSteps: number[] = [250 * 1000];
        for (let i = 0; i < levelscount; i++) {
            gridSteps.push(gridSteps[gridSteps.length - 1] / 10);
        }
        const gridLines: DrawLine[] = gridSteps.sort().map(x => this.getGridLines(x)).flat();

        const xAxisModel = mat4.create();
        const yAxisModel = mat4.create();
        mat4.translate(xAxisModel, xAxisModel, [0, getNdc(-this.center[1], this.height / this.scale) + 1, 0]);
        mat4.translate(yAxisModel, yAxisModel, [getNdc(-this.center[0], this.width / this.scale) + 1, 0, 0]);
        mat4.rotateZ(yAxisModel, yAxisModel, glMatrix.toRadian(90));

        const xLine = { line: this.line, color: [1, 0.3, 0.3], model: xAxisModel };
        const yLine = { line: this.line, color: [0.3, 1, 0.3], model: yAxisModel };

        const scene: Scene = {
            lines: [
                gridLines,
                [xLine],
                [yLine],
            ].flat()
        }

        this.drawScene(scene);
    }

    private drawScene(scene: Scene) {
        this.gl.clearColor(backgroundGrayscale, backgroundGrayscale, backgroundGrayscale, 1);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        console.log(`draw ${scene.lines.length} lines`);
        for (const { line, color, model } of scene.lines) {
            line.draw(model, color);
        }
    }

    private getGridLines(step: number) {
        if (step * this.scale <= 5) return [];
        const lineColor = this.getLineColor(step);
        const xLines: DrawLine[] = this.getXModels(step).map(model => {
            return { line: this.line, color: lineColor, model: model };
        });
        const yLines: DrawLine[] = this.getYModels(step).map(model => {
            return { line: this.line, color: lineColor, model: model };
        });
        return [xLines, yLines].flat();
    }

    private getLineColor(step: number) {
        const minColor = backgroundGrayscale;
        const maxColor = minColor + 0.15;
        const scale = maxColor - minColor;
        const offset = minColor;
        const maxDim = Math.max(this.width, this.height) / 2 / this.scale;

        const sigmoidGrowthRate = 30;
        const sigmoidOffset = 0.04;
        // sigmoid
        const x = 1.3 / (1 + Math.exp(-sigmoidGrowthRate * (step / maxDim - sigmoidOffset))) - 0.3

        const color = scale * Math.min(Math.max(x, 0), 1) + offset;

        return Array<number>(3).fill(color);
    }

    private getXModels(step: number) {
        return this.getGridLineModels(step, this.height, this.center[1], offset => {
            const model = mat4.create();
            mat4.translate(model, model, [0, offset, 0]);
            return model;
        });
    }

    private getYModels(step: number) {
        return this.getGridLineModels(step, this.width, this.center[0], offset => {
            const model = mat4.create();
            mat4.translate(model, model, [offset, 0, 0]);
            mat4.rotateZ(model, model, glMatrix.toRadian(90));
            return model;
        });
    }

    private getGridLineModels(step: number, dimLenght: number, originOffset: number, getModel: (offset: number) => mat4) {
        dimLenght /= this.scale;
        const models: mat4[] = [];
        const w0 = originOffset - dimLenght / 2;
        const w1 = w0 + dimLenght;
        let s = Math.floor(w0 / step) * step + step;
        while (s < w1) {
            models.push(getModel(getNdc(s - w0, dimLenght)));
            s += step;
        }
        return models;
    }
}

function getNdc(screenCoord: number, dimLenght: number) {
    return 2 * screenCoord / dimLenght - 1;
}

export default Renderer;
