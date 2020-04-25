import { mat4 } from "gl-matrix";

export class Shader {
    private gl: WebGLRenderingContext;
    private vsSource: string;
    private fsSource: string;
    private programId: WebGLProgram;

    constructor(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
        this.gl = gl;
        this.vsSource = vsSource;
        this.fsSource = fsSource;
        this.programId = this.gl.createProgram();
        this.initShaderProgram();
    }

    public use() {
        this.gl.useProgram(this.programId);
    }

    public setMat4(name: string, mat: mat4) {
        this.gl.uniformMatrix4fv(this.getUniformLocation(name), false, mat);
    }

    public getAttribLocation(name: string) {
        return this.gl.getAttribLocation(this.programId, name);
    }

    private getUniformLocation(name: string) {
        const location = this.gl.getUniformLocation(this.programId, name);
        if (!location) {
            throw new Error("No uniform with name " + name);
        }
        return location;
    }

    private initShaderProgram() {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, this.vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, this.fsSource);

        this.gl.attachShader(this.programId, vertexShader);
        this.gl.attachShader(this.programId, fragmentShader);
        this.gl.linkProgram(this.programId);

        if (!this.gl.getProgramParameter(this.programId, this.gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(this.programId));
        }
    }

    private loadShader(type: number, source: string) {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error("Shader loading failed");
        }

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const infoLog = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error("An error occurred compiling the shaders: " + infoLog);
        }

        return shader;
    }
}

