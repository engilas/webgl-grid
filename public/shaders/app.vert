attribute vec4 aPos;

uniform mat4 uModelViewMatrix;

void main() {
    gl_Position = uModelViewMatrix * aPos;
}