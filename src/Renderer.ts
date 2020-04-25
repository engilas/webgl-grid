import { Shader } from './Shader';
import Line from './Line';
import { mat4, glMatrix } from 'gl-matrix';

type Scene = {
    lines: [Line, mat4[]][];
}

type Lines = {
    xAxisLine: Line;
    yAxisLine: Line;
    grid1Line: Line;
    grid2Line: Line;
}

const defaultGridStep = 500;

class Renderer {
    private width: number;
    private height: number;
    private originOffset = [0, 0];
    private shader: Shader | null = null;
    private isMouseDown = false;
    private startPos = [0, 0];
    private gl: WebGLRenderingContext;
    private lines: Lines;
    private gridStep = defaultGridStep;

    private grids = [

    ];

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
        this.lines = {
            xAxisLine: new Line(this.gl, this.shader, [0.0, 1.0, 0.0]),
            yAxisLine: new Line(this.gl, this.shader, [1.0, 0.0, 0.0]),
            grid1Line: new Line(this.gl, this.shader, [0.5, 0.5, 0.5]),
            grid2Line: new Line(this.gl, this.shader, [0.3, 0.3, 0.3]),
        }
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
            (2 * event.clientX / this.width - 1) - this.startPos[0],
            this.startPos[1] - (2 * event.clientY / this.height - 1)
        ];
        this.render();
    }

    private onWheel(event: WheelEvent) {
        this.gridStep -= event.deltaY * 5;
        if (this.gridStep > defaultGridStep * 10 || this.gridStep < defaultGridStep) {
            this.gridStep = 500;
        }
        console.log(this.gridStep);
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

        const grid1Models = [
            this.getXModels(this.gridStep),
            this.getYModels(this.gridStep),
        ].flat();

        const grid2Models = [
            this.getXModels(grid2Step),
            this.getYModels(grid2Step),
        ].flat();

        const xAxisModel = mat4.create();
        const yAxisModel = mat4.create();
        mat4.translate(xAxisModel, xAxisModel, [0, this.originOffset[1], 0]);
        mat4.translate(yAxisModel, yAxisModel, [this.originOffset[0], 0, 0]);
        mat4.rotateZ(yAxisModel, yAxisModel, glMatrix.toRadian(90));

        const scene: Scene = {
            lines: [
                [this.lines.grid2Line, grid2Models],
                [this.lines.grid1Line, grid1Models],
                [this.lines.yAxisLine, [yAxisModel]],
                [this.lines.xAxisLine, [xAxisModel]],
            ]
        }

        this.drawScene(scene);
    }

    drawScene(scene: Scene) {
        this.gl.clearColor(0.2, 0.2, 0.2, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
        for (const line of scene.lines) {
            for (const model of line[1]) {
                line[0].draw(model);
            }
        }
    }

    private getGridLineModels(stepSize: number, dimLenght: number, originOffset: number, getModel: (offset: number) => mat4) {
        const models: mat4[] = []
        const step = stepSize / dimLenght;
        if (step <= 0.001) {
            throw new Error("fafa");
        }
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
}

export default Renderer;
