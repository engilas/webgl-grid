import { Shader } from "./Shader";
import { mat4 } from "gl-matrix"

export default class Line {
    private begin: number[];
    private end: number[];
    private color: number[];
    private gl: WebGLRenderingContext;
    private shader: Shader;
    private buffer: WebGLBuffer = {};

    constructor(gl: WebGLRenderingContext, shader: Shader, color: number[]) {
        this.begin = [-1.0, 0.0];
        this.end = [1.0, 0.0];
        this.color = color;
        this.gl = gl;
        this.shader = shader;
        this.initBuffer();
    }

    public draw(model: mat4) {
        this.setupBuffer();
        this.shader.use();
        this.shader.setMat4("uModelViewMatrix", model);
        const offset = 0;
        const vertexCount = 2;
        this.gl.drawArrays(this.gl.LINES, offset, vertexCount);
    }

    private initBuffer() {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        const data = [
            this.begin, //2, 0
            this.color, //3, 2

            this.end,
            this.color,
        ].flat();

        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(data),
            this.gl.STATIC_DRAW);

        this.buffer = buffer;
    }

    private setupBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const floatSize = 4;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = floatSize * 5;
        const posLocation = this.shader.getAttribLocation('aPos');
        const colorLocation = this.shader.getAttribLocation('aColor');
        this.gl.vertexAttribPointer(posLocation, 2, type, normalize, stride, 0);
        this.gl.vertexAttribPointer(colorLocation, 3, type, normalize, stride, floatSize * 2);
        this.gl.enableVertexAttribArray(posLocation);
        this.gl.enableVertexAttribArray(colorLocation);
    }
}