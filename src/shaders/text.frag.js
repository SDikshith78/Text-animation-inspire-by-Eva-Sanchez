export default `
precision highp float;

uniform sampler2D uMap;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform float uTime;

uniform float uStrength;
uniform float uRadius;
uniform float uFrequency;
uniform float uSpeed;
uniform float uGlyphCount;

varying vec2 vUv;
varying float vGlyphIndex;

/* MSDF */
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {

  vec2 uv = vUv;

  /* -----------------------------------------
     GLYPH → NORMALIZED POSITION
     ----------------------------------------- */
  float glyphCenter = (vGlyphIndex + 0.5) / uGlyphCount;

  /* distance mouse ↔ glyph */
  float d = abs(uMouse.x - glyphCenter);

  /* hover mask */
  float hover = smoothstep(uRadius, 0.0, d);

  /* velocity boost */
  float vel = clamp(length(uVelocity) * 6.0, 0.0, 2.0);

  /* -----------------------------------------
     GLASS RIPPLE (HORIZONTAL)
     ----------------------------------------- */
  float wave1 = sin(uv.y * uFrequency - uTime * uSpeed);
  float wave2 = sin(uv.y * (uFrequency * 1.6) + uTime * (uSpeed * 0.7));

  float ripple = (wave1 * 0.6 + wave2 * 0.4);

  uv.x += ripple * hover * uStrength * (1.0 + vel);

  /* -----------------------------------------
     MSDF SAMPLE
     ----------------------------------------- */
  vec3 sample = texture2D(uMap, uv).rgb;
  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
  float alpha = smoothstep(-0.04, 0.04, sigDist);

  gl_FragColor = vec4(vec3(0.0), alpha);
}
`;
