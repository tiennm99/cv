// Low-resolution field pass for the riso halftone: the slow domain-warped fBm that sets
// the dot size, for both plates (R = vermilion seed 0, G = ink seed 7.3). The field is
// smooth at this scale (460px features), so one texel per 8 CSS px, sampled bilinearly
// at each dot's cell centre, matches evaluating it per fragment at a fraction of the cost.
precision highp float;

uniform vec2 uRes;   // CSS px viewport
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float warped(vec2 c, float seed) {
  vec2 q = c / 460.0;
  float t = uTime * 0.035;
  vec2 w = vec2(fbm(q + vec2(t, seed)), fbm(q + vec2(seed * 1.7, -t) + 3.1));
  return fbm(q * 1.25 + 1.9 * w + seed);
}

void main() {
  vec2 p = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);
  gl_FragColor = vec4(warped(p, 0.0), warped(p, 7.3), 0.0, 1.0);
}
