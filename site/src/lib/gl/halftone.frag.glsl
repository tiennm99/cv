// Riso halftone: two rotated dot plates (vermilion 15deg, ink 45deg) whose dot radius
// follows a slow domain-warped fBm (from the low-resolution field pass), the pointer
// trail and a halo around the display type. Dots are knocked out inside the glyph boxes (+2px gutter) so DOM text stays crisp.
precision highp float;

uniform vec2 uRes;        // CSS px viewport
uniform float uDpr;
uniform float uTime;
uniform float uCell;      // CSS px
uniform float uScroll;    // hero exit 0..1
uniform float uMode;      // 0 hero, 1 contact convergence
uniform float uAlpha;
uniform vec2 uFocus;      // CSS px, y down (contact CTA)
uniform vec2 uShift;      // plate B misregistration, CSS px
uniform vec3 uInk;
uniform vec3 uAccent;
uniform sampler2D uTrail;
uniform sampler2D uField; // warped fBm per plate (halftone-field.frag.glsl)
uniform vec4 uBoxes[32];  // CSS px, y down: centre.xy, half-size.zw
uniform int uBoxCount;
varying vec2 vUv;

float boxDistance(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 32; i++) {
    if (i >= uBoxCount) break;
    vec2 q = abs(p - uBoxes[i].xy) - uBoxes[i].zw;
    d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
  }
  return d;
}

// Warped fBm at a CSS point, from the low-resolution field pass (channel by plate).
float warped(vec2 c, float seed) {
  vec2 f = texture2D(uField, vec2(c.x / uRes.x, 1.0 - c.y / uRes.y)).rg;
  return seed < 1.0 ? f.r : f.g;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

// Coverage of one plate at CSS point p (y down).
float plate(vec2 p, float angle, float cell, float seed, float sparse, bool halo) {
  mat2 r = rot(angle);
  vec2 g = (r * p) / cell;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 centre = (id + 0.5) * cell * r; // row-vector product = inverse rotation

  float n = warped(centre, seed);
  float density;
  if (uMode < 0.5) {
    density = smoothstep(0.46 + sparse, 0.8 + sparse * 0.5, n);
  } else {
    float far = length(centre - uFocus);
    float waves = pow(0.5 + 0.5 * sin(far * 0.045 + uTime * 2.2), 3.0);
    density = waves * smoothstep(780.0, 60.0, far) * 0.95 + smoothstep(0.55 + sparse, 0.9, n) * 0.35;
  }

  vec2 tuv = vec2(centre.x / uRes.x, 1.0 - centre.y / uRes.y);
  density += texture2D(uTrail, tuv).r * (1.0 - sparse);

  float d = boxDistance(centre);
  if (halo) density += 0.38 * exp(-max(d, 0.0) / 70.0);

  float radius = clamp(density, 0.0, 1.0) * 0.64 * (1.0 - uScroll * 0.55);
  if (d < radius * cell + 2.0) return 0.0;

  float aa = 0.9 / (cell * uDpr);
  return 1.0 - smoothstep(radius - aa, radius + aa, length(f));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float fall = uScroll * uScroll * uRes.y * 0.32;
  float cell = uCell * (1.0 + uScroll * 1.4);
  float a = plate(p - vec2(0.0, fall), radians(15.0), cell, 0.0, 0.0, true);
  float b = plate(p - uShift - vec2(0.0, fall * 1.25), radians(45.0), cell * 1.15, 7.3, 0.22, false) * 0.9;
  vec3 rgb = uAccent * a + uInk * b * (1.0 - a);
  float alpha = a + b * (1.0 - a);
  float fade = uAlpha * (1.0 - smoothstep(0.55, 1.0, uScroll));
  gl_FragColor = vec4(rgb, alpha) * fade;
}
