export default `
precision highp float;

uniform sampler2D uMap;
uniform vec2  uMouse;
uniform float uTime;

uniform float uStrength;
uniform float uRadius;
uniform float uFrequency;
uniform float uSpeed;
uniform float uGlyphCount;

varying vec2 vUv;
varying float vGlyphIndex;

/* -------- MSDF helper -------- */
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

/* -------- Ripple function (friend’s logic) -------- */
float ripple(float uv, float time, float prog, float multi) {
  float distance = (uv * 3.0) + (time * 1.4);
  return tan(distance) * (multi * prog);
}

void main() {

  vec2 uv = vUv;

  /* -------- Per-letter center -------- */
  float letterCenterX = (vGlyphIndex + 0.5) / uGlyphCount;

  /* -------- Mouse distance from this letter -------- */
  float mx = uMouse.x - letterCenterX;
  float d = abs(mx);

  /* -------- Hover gating -------- */
  float hover = smoothstep(uRadius, 0.0, d);

  /* -------- Progress factor -------- */
  float prog = (1.0 - d) * hover;

  /* -------- HORIZONTAL RIPPLE ONLY --------
     - wave based on vUv.x
     - distortion applied on x
  ------------------------------------------ */
  float rippleH =
    ripple(
      vUv.x * uFrequency,
      uTime * uSpeed,
      prog,
      -0.36
    )
    * (0.1 * prog)
    * uStrength;

  uv.x += rippleH;

  /* -------- MSDF sampling -------- */
  vec3 sample = texture2D(uMap, uv).rgb;
  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
  float alpha = smoothstep(-0.025, 0.025, sigDist);

  gl_FragColor = vec4(vec3(0.0), alpha);
}


`;
