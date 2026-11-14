// Pointer ink trail, ping-ponged at 1/8 resolution. Subtracting a small constant
// lets 8-bit targets decay all the way to zero.
precision highp float;

uniform sampler2D uPrev;
uniform vec2 uPointer;   // CSS px, y up
uniform vec2 uRes;       // CSS px viewport
uniform float uStrength;
uniform float uRadius;
varying vec2 vUv;

void main() {
  float prev = texture2D(uPrev, vUv).r;
  vec2 p = vUv * uRes;
  float d = length(p - uPointer);
  float splat = exp(-(d * d) / (uRadius * uRadius)) * uStrength;
  float v = max(0.0, prev * 0.96 - 0.004) + splat;
  gl_FragColor = vec4(min(v, 1.0), 0.0, 0.0, 1.0);
}
