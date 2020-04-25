import React, { useEffect, useState, useRef } from 'react';
import Renderer from './Renderer';

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState([window.innerWidth, window.innerHeight]);
    const [renderer, setRenderer] = useState<Renderer>(null);

    useEffect(() => {
        (async () => {
            const canvas = canvasRef.current;
            const gl = canvas.getContext("webgl");
            if (gl === null) {
                throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
            }
            const [fragShader, vertShader] = await Promise.all([fetchFile("shaders/app.vert"), fetchFile("shaders/app.frag")]);
            const renderer = new Renderer(gl, canvas, canvas.width, canvas.height, fragShader, vertShader);
            window.onresize = function () {
                setCanvasSize([window.innerWidth, window.innerHeight]);
            }
            renderer.render();
            setRenderer(renderer);
        })();
    }, []);

    useEffect(() => {
        if (!renderer) {
            return;
        }
        renderer.resize(canvasSize[0], canvasSize[1]);
        renderer.render();
    }, [canvasSize]);

    return (
        <canvas ref={canvasRef} width={canvasSize[0]} height={canvasSize[1]} id="glCanvas"></canvas>
    )
}

const fetchFile = async (path: string) => {
    const response = await fetch(path);
    return await response.text()
}

export default App;
