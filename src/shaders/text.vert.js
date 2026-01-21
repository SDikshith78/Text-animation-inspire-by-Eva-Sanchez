export default `
precision highp float;

attribute vec2 position;
attribute vec2 uv;
attribute float glyphIndex;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;
varying float vGlyphIndex;

void main() {
  vUv = uv;
  vGlyphIndex = glyphIndex;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 0.0, 1.0);
}

`;
