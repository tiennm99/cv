// Hero riso print: two rotated dot plates (vermilion 15deg, ink 45deg) sampled from the
// precomputed field. Dots shrink as they near the type and are clipped per pixel with a
// soft edge, so the ink parts around the letters instead of stepping in cell-sized slabs.
// The pointer trail lifts dot size up to 0.45 of a cell, never past the base dot, so it
// never merges dots into a solid smear. The print fades out above the hero's bottom edge.
precision highp float;

uniform vec2 uRes;        // host CSS px
uniform float uDpr;
uniform float uCell;      // CSS px
uniform float uScroll;    // hero exit 0..1
uniform float uAlpha;
uniform float uBias;      // density threshold lift (invert theme reads denser)
uniform vec2 uShift;      // plate B misregistration, CSS px
uniform vec3 uInk;
uniform vec3 uAccent;
uniform sampler2D uField;
varying vec2 vUv;

vec4 field(vec2 c) {
  return texture2D(uField, vec2(c.x / uRes.x, 1.0 - c.y / uRes.y));
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float plate(vec2 p, float fall, float angle, float cell, float sparse, bool halo) {
  mat2 r = rot(angle);
  vec2 g = (r * (p - vec2(0.0, fall))) / cell;
  vec2 f = fract(g) - 0.5;
  vec2 centre = (floor(g) + 0.5) * cell * r; // row-vector product = inverse rotation
  vec4 at = field(centre + vec2(0.0, fall));
  float n = halo ? field(centre).r : field(centre).g;
  float d = at.a * 96.0;

  float lo = 0.46 + sparse + uBias;
  float density = smoothstep(lo, lo + 0.34 - sparse * 0.5, n);
  if (halo) density += 0.34 * exp(-d / 70.0);
  float radius = min(0.5, density * 0.56);
  radius = min(radius + at.b * 0.3 * (1.0 - sparse), max(radius, 0.45));
  radius *= smoothstep(3.0, 30.0, d);
  radius *= 1.0 - uScroll * 0.55;

  float aa = 0.9 / (cell * uDpr);
  return 1.0 - smoothstep(radius - aa, radius + aa, length(f));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float clip = smoothstep(1.5, 4.5, field(p).a * 96.0);
  float fall = uScroll * uScroll * uRes.y * 0.32;
  float cell = uCell * (1.0 + uScroll * 1.4);
  float a = plate(p, fall, radians(15.0), cell, 0.0, true) * clip;
  float b = plate(p - uShift, fall * 1.25, radians(45.0), cell * 1.15, 0.22, false) * 0.9 * clip;
  vec3 rgb = uAccent * a + uInk * b * (1.0 - a);
  float alpha = a + b * (1.0 - a);
  float fade = uAlpha * (1.0 - smoothstep(0.55, 1.0, uScroll)) * smoothstep(uRes.y, uRes.y - 160.0, p.y);
  gl_FragColor = vec4(rgb, alpha) * fade;
}
