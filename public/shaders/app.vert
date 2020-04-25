attribute vec4 aPos;
attribute vec3 aColor;

varying lowp vec4 Position;
varying lowp vec3 Color;

uniform mat4 uModelViewMatrix;

void main() {
    gl_Position = uModelViewMatrix * aPos;
    Position = gl_Position;
    Color = aColor;
}