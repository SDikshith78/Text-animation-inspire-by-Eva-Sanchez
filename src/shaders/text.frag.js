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

varying vec2 vUv;

/* ---------------- MSDF helper ---------------- */
float median(float r, float g, float b) {
  return max(min(r, g), min(max(r, g), b));
}

void main() {

  vec2 uv = vUv;

  /* --------------------------------------------------
     HOVER / LENS DISTANCE (HORIZONTAL)
  -------------------------------------------------- */

  float d = abs(uv.x - uMouse.x);

  // soft lens falloff
  float falloff = smoothstep(uRadius, 0.0, d);

  // HARD hover gate (this fixes the reverse behavior)
  float hover = step(d, uRadius);

  // non-linear lens curve
  float lens = pow(falloff, 1.6);

  /* --------------------------------------------------
     AMPLITUDE (hover enables, velocity enhances)
  -------------------------------------------------- */

  float velocityBoost = clamp(abs(uVelocity.x) * 6.0, 0.0, 1.5);

  float amplitude =
    uStrength *
    hover *
    (1.0 + velocityBoost);

  /* --------------------------------------------------
     RIPPLE STRUCTURE
  -------------------------------------------------- */

  float primaryWave =
    sin(uv.y * uFrequency - uTime * uSpeed);

  float microWave =
    sin((uv.y + uv.x) * (uFrequency * 2.3) + uTime * 3.0)
    * 0.35;

  float displacement =
    (primaryWave + microWave)
    * amplitude
    * lens;

  // horizontal refraction only
  uv.x += displacement;

  /* --------------------------------------------------
     MSDF TEXT
  -------------------------------------------------- */

  vec3 sample = texture2D(uMap, uv).rgb;
  float sigDist = median(sample.r, sample.g, sample.b) - 0.5;

  float alpha = smoothstep(-0.03, 0.03, sigDist);

  gl_FragColor = vec4(vec3(0.0), alpha);
}
`;
