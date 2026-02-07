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
uniform float uPhase;


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

// sharpen falloff to isolate letters
prog = pow(prog, 2.2);
prog = max(0.0, prog - 0.11);



  /* -------- HORIZONTAL RIPPLE ONLY --------
     - wave based on vUv.x
     - distortion applied on x
  ------------------------------------------ */
  float rippleH = 0.0;

if (prog > 0.23) {

  rippleH =
    ripple(
  vUv.x * uFrequency,
  uPhase,
  prog,
  -0.36
)

    * (0.12 * prog)
    * uStrength;
    
  // float move = clamp(abs(uVelocity.x) * 25.0, 0.0, 1.0);
  // rippleH *= move;
}


float velX = clamp(uVelocity.x * 10.0, -1.0, 1.0);
float velInfluence = velX * prog;

uv.x += rippleH * (1.0 + velInfluence * 0.7);
uv.y += rippleH * 0.07 * prog;




  /* -------- MSDF sampling -------- */
  // chromatic offset (very small)
float ca = uChromatic * prog;

// sample RGB separately
vec2 lensOffset = rippleH * 0.01 * prog * vec2(1.0, 0.5);

float r = texture2D(uMap, uv + lensOffset + vec2(ca, 0.0)).r;
float g = texture2D(uMap, uv + lensOffset).g;
float b = texture2D(uMap, uv + lensOffset - vec2(ca, 0.0)).b;


float sigDist = median(r, g, b) - 0.5;
float alpha = smoothstep(-0.02, 0.02, sigDist);

// soft glass edge light
float edge = smoothstep(0.0, 0.02, abs(sigDist));
vec3 color = vec3(edge * 0.15);

gl_FragColor = vec4(color, alpha);


}


`;
