export default `
precision highp float;

uniform sampler2D uMap;
uniform vec2  uMouse;
uniform vec2 uVelocity;

uniform float uTime;
uniform float uChromatic;

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
  float distance = (uv * 3.0) - (time * 1.4);
  return tan(distance) * (multi * prog);
}

void main() {

  vec2 uv = vUv;

  /* -------- Per-letter center -------- */
  float letterCenterX = (vGlyphIndex + 0.5) / uGlyphCount;

  /* -------- Mouse distance from this letter -------- */
  float mx = uMouse.x - letterCenterX;
  float d = abs(mx) * 0.75;


  /* -------- Hover gating -------- */
  float hover = smoothstep(uRadius, 0.0, d);

  /* -------- Progress factor -------- */
float prog = 1.0 - (d / uRadius);
prog = clamp(prog, 0.0, 1.0);

// hard cutoff to prevent ghost ripple
if (prog < 0.03) prog = 0.0;

// glass density
prog = pow(prog, 2.4);


// compensate wide glyphs (D, O, S)
float centerBias = smoothstep(0.0, 0.25, prog);
prog *= mix(1.4, 1.0, centerBias);





  /* -------- HORIZONTAL RIPPLE ONLY --------
     - wave based on vUv.x
     - distortion applied on x
  ------------------------------------------ */
  float rippleH = 0.0;

if (prog > 0.0) {
  rippleH =
    ripple(
      vUv.x * uFrequency,
      uTime * uSpeed,
      prog,
      -0.36
    )
    * (0.12 * prog)
    * uStrength;
}


  float velX = clamp(uVelocity.x * 10.0, -1.0, 1.0);
uv.x += rippleH * (1.0 + velX * 0.7);


  /* -------- MSDF sampling -------- */
  // chromatic offset (very small)
float ca = uChromatic * prog;

// sample RGB separately
float r = texture2D(uMap, uv + vec2(ca, 0.0)).r;
float g = texture2D(uMap, uv).g;
float b = texture2D(uMap, uv - vec2(ca, 0.0)).b;

float sigDist = median(r, g, b) - 0.5;
float alpha = smoothstep(-0.02, 0.02, sigDist);

gl_FragColor = vec4(vec3(0.0), alpha);

}


`;
