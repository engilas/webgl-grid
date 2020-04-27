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

const initialGridStep = 250;
const backgroundGrayscale = 0.2;

class Renderer {
    private width: number;
    private height: number;
    private originOffset = [0, 0];
    private shader: Shader | null = null;
    private isMouseDown = false;
    private startPos = [0, 0];
    private gl: WebGLRenderingContext;
    private line: Line;

    private gridStep = initialGridStep;
    private zoom: number = Math.log(initialGridStep);

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
            2 * event.clientX / this.width - 1 - this.originOffset[0],
            this.originOffset[1] + 2 * event.clientY / this.height - 1
        ];
    }

    private onMouseUp() {
        this.isMouseDown = false;
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isMouseDown) return;
        this.originOffset = [
            this.getNdc(event.clientX, this.width) - this.startPos[0],
            this.startPos[1] - this.getNdc(event.clientY, this.height)
        ];
        this.render();
    }

    private onWheel(event: WheelEvent) {
        this.zoom -= Math.sign(event.deltaY) * 0.20;
        this.gridStep = Math.exp(this.zoom);
        this.render();
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    render() {
        if (!this.shader) return;

        const grid2Step = this.gridStep / 10;
        const grid3Step = grid2Step / 10;

        const grid1Lines = this.getGridLines(this.gridStep);
        const grid2Lines = this.getGridLines(grid2Step);
        const grid3Lines = this.getGridLines(grid3Step);

        const xAxisModel = mat4.create();
        const yAxisModel = mat4.create();
        mat4.translate(xAxisModel, xAxisModel, [0, this.originOffset[1], 0]);
        mat4.translate(yAxisModel, yAxisModel, [this.originOffset[0], 0, 0]);
        mat4.rotateZ(yAxisModel, yAxisModel, glMatrix.toRadian(90));

        const xLine = { line: this.line, color: [1, 0, 0], model: xAxisModel };
        const yLine = { line: this.line, color: [0, 1, 0], model: yAxisModel };

        const scene: Scene = {
            lines: [
                grid3Lines,
                grid2Lines,
                grid1Lines,
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
        if (step <= 5) return [];
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
        const maxColor = 0.35;
        const scale = maxColor - minColor;
        const offset = minColor;
        const maxDim = Math.max(this.width, this.height) / 2;
        const sigmoidOffset = 70;
        const sigmoidGrowthRate = 30;
        const k = (1000 / sigmoidGrowthRate) / maxDim;
        const x0 = maxDim / (1000 / sigmoidOffset);
        // sigmoid
        //const x = 1.1 / (1 + Math.exp(-k*(step - x0))) - 0.1;
        const x = Math.min(step / (maxDim / 7), 1);

        const color = scale * x + offset;
        console.log(`step: ${step}; color: ${color}`);

        return Array<number>(3).fill(color > backgroundGrayscale + 0.005 ? color : backgroundGrayscale);
    }

    private getXModels(step: number) {
        return this.getGridLineModels(step, this.height, this.originOffset[1], offset => {
            const model = mat4.create();
            mat4.translate(model, model, [0, offset, 0]);
            return model;
        });
    }

    private getYModels(step: number) {
        return this.getGridLineModels(step, this.width, this.originOffset[0], offset => {
            const model = mat4.create();
            mat4.translate(model, model, [offset, 0, 0]);
            mat4.rotateZ(model, model, glMatrix.toRadian(90));
            return model;
        });
    }

    private getGridLineModels(stepSize: number, dimLenght: number, originOffset: number, getModel: (offset: number) => mat4) {
        const models: mat4[] = []
        const step = stepSize / (dimLenght / 2);
        // positive
        let i = step + originOffset;
        while (i <= 1) {
            models.push(getModel(i));
            i += step;
        }
        // negative
        i = originOffset - step;
        while (i >= -1) {
            models.push(getModel(i));
            i -= step;
        }
        return models;
    }

    private getNdc(screenCoord: number, dimLenght: number) {
        return 2 * screenCoord / dimLenght - 1;
    }
}

export default Renderer;
