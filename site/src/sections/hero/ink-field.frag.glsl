// Hero ink field, rendered at 1/4 resolution once per frame so the per-pixel plate pass
// only samples it. Channels: R plate A noise, G plate B noise, B pointer trail and tap
// ripple, A distance to the type (glyph boxes and the avatar circle) over 96px.
precision highp float;

uniform vec2 uRes;          // host CSS px
uniform float uTime;
uniform vec4 uShapes[32];   // host CSS px, y down: centre.xy, half-size.zw; w < 0 = circle of radius z
uniform int uShapeCount;
uniform sampler2D uTrail;
uniform vec3 uRipple;       // host CSS px (y down) and age in s; age < 0 = none
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

// Signed distance to the type: rounded glyph boxes, and a true circle for the avatar.
float typeDistance(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 32; i++) {
    if (i >= uShapeCount) break;
    vec4 s = uShapes[i];
    if (s.w < 0.0) {
      d = min(d, length(p - s.xy) - s.z);
    } else {
      float r = min(s.z, s.w) * 0.3;
      vec2 q = abs(p - s.xy) - s.zw + r;
      d = min(d, length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r);
    }
  }
  return d;
}

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float boost = texture2D(uTrail, vUv).r;
  if (uRipple.z >= 0.0) {
    float ring = (length(p - uRipple.xy) - uRipple.z * 560.0) / 54.0;
    boost = max(boost, exp(-ring * ring) * 0.85 * (1.0 - smoothstep(0.5, 1.2, uRipple.z)));
  }
  gl_FragColor = vec4(warped(p, 0.0), warped(p, 7.3), clamp(boost, 0.0, 1.0), clamp(typeDistance(p) / 96.0, 0.0, 1.0));
}
