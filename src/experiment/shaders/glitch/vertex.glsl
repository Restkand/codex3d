// Vertex shader untuk post-processing: geometrinya hanya satu persegi yang menutupi layar.
// Cukup teruskan koordinat UV (0..1) ke fragment shader.
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
