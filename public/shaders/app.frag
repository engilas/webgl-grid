varying mediump vec4 Position;
varying lowp vec3 Color;

void main() {
    gl_FragColor = vec4(Color, 1.0);
}