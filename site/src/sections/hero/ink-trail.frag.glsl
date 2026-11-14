// Hero pointer trail, ping-ponged at 1/8 resolution. It decays fast (about half a
// second) and its splat is capped, so a sweep lifts dot sizes instead of flooding ink.
precision highp float;

uniform sampler2D uPrev;
uniform vec2 uPointer;   // host CSS px, y up
uniform vec2 uRes;       // host CSS px
uniform float uStrength;
uniform float uRadius;
varying vec2 vUv;

void main() {
  float prev = texture2D(uPrev, vUv).r;
  vec2 d = vUv * uRes - uPointer;
  float splat = exp(-dot(d, d) / (uRadius * uRadius)) * uStrength;
  float v = max(0.0, prev * 0.9 - 0.012) + splat;
  gl_FragColor = vec4(min(v, 1.0), 0.0, 0.0, 1.0);
}
