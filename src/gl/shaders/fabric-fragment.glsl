precision highp float;
varying vec2 vUv;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uWarm;
uniform vec2 uSize;
uniform float uPeriod;
uniform float uDrift;
uniform float uTime;
uniform float uRipple;
uniform vec2 uPointer;
uniform float uVelocity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  // vUv is the plane's own UV; convert to page pixels for the fixed size bands.
  float x = vUv.x * uSize.x + uDrift;
  float phase = mod(x, uPeriod);

  // Bands are ~47px (About) or ~69.5px (Footer), with a soft 5px ramp.
  float ramp = 5.0;
  float first = smoothstep(ramp * 0.5, ramp * 1.5, phase);
  float band = smoothstep(uPeriod * 0.5 - ramp * 0.5, uPeriod * 0.5 + ramp * 0.5, phase) * 0.5
             + first * 0.5;
  vec3 color = mix(uColorA, uColorB, band);

  // Cloth ripple: small directional noise in the stripes.
  float rippleNoise = noise(vec2(x * 0.012, vUv.y * 2.0) + uTime * 0.08);
  float distanceToPointer = distance(vUv, uPointer);
  float influence = smoothstep(0.45, 0.0, distanceToPointer);
  color += (rippleNoise - 0.5) * 0.025 * (0.35 + uRipple * influence);
  color += sin(x * 0.045 + uTime * 1.2) * 0.012;

  // Scroll velocity lifts the bands so the cloth feels tugged.
  float bend = sin(vUv.y * 18.0 + uVelocity * 7.0) * uVelocity * 2.2;
  color += bend * 0.012;

  // Footer gets a lamp-like warm highlight that follows the donor pointer.
  if (dot(uWarm, uWarm) > 0.0) {
    float warmD = distance(vUv, uPointer);
    float warm = smoothstep(0.45, 0.0, warmD);
    color = mix(color, uWarm, warm * 0.22);
  }

  gl_FragColor = vec4(color, 1.0);
}
