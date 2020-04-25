import React, { useEffect, useState, useRef } from 'react';
import Renderer from './Renderer';

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvasSize, setCanvasSize] = useState([window.innerWidth, window.innerHeight]);
    const [renderer, setRenderer] = useState<Renderer>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = canvas.getContext("webgl");
        if (gl === null) {
            throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.");
        }
        const renderer = new Renderer(gl, canvas, canvas.width, canvas.height);
        window.onresize = function () {
            setCanvasSize([window.innerWidth, window.innerHeight]);
        }
        renderer.init().then(() => renderer.render());
        setRenderer(renderer);
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

export default App;
