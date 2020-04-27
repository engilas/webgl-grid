import { Shader } from "./Shader";
import { mat4 } from "gl-matrix"

export default class Line {
    private begin: number[];
    private end: number[];
    private gl: WebGLRenderingContext;
    private shader: Shader;
    private buffer: WebGLBuffer = {};

    constructor(gl: WebGLRenderingContext, shader: Shader) {
        this.begin = [-1.0, 0.0];
        this.end = [1.0, 0.0];
        this.gl = gl;
        this.shader = shader;
        this.initBuffer();
    }

    public draw(model: mat4, color: number[]) {
        this.setupBuffer();
        this.shader.use();
        this.shader.setMat4("uModelViewMatrix", model);
        this.shader.setVec3("uColor", color);
        const offset = 0;
        const vertexCount = 2;
        this.gl.drawArrays(this.gl.LINES, offset, vertexCount);
    }

    private initBuffer() {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        const data = [
            this.begin,
            this.end,
        ].flat();

        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            new Float32Array(data),
            this.gl.STATIC_DRAW);

        this.buffer = buffer;
    }

    private setupBuffer() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        const type = this.gl.FLOAT;
        const normalize = false;
        const posLocation = this.shader.getAttribLocation('aPos');
        this.gl.vertexAttribPointer(posLocation, 2, type, normalize, 0, 0);
        this.gl.enableVertexAttribArray(posLocation);
    }
}