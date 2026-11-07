precision highp float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uSize;
uniform float uAspect;
uniform float uReveal;
uniform float uHover;
uniform vec2 uPointer;
uniform float uVelocity;
uniform float uTime;

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

float sdRoundBox(vec2 p, vec2 b, float radius) {
  vec2 q = abs(p) - b + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  vec2 uv = vUv;
  vec2 planeRatio = uSize / uSize.y;
  vec2 cover = uv;
  if (uAspect > planeRatio.x) {
    cover.x = (uv.x - 0.5) * (planeRatio.x / uAspect) + 0.5;
  } else {
    cover.y = (uv.y - 0.5) * (uAspect / planeRatio.x) + 0.5;
  }

  float ripple = sin(noise(uv * 8.0 + uTime * 0.35) * 6.28318) * uHover;
  float pointerD = distance(uv, uPointer);
  float pointerGlow = smoothstep(0.35, 0.0, pointerD) * uHover;
  float yBend = sin((uv.y + uVelocity) * 40.0) * max(uVelocity, 0.0) * 0.04;

  cover.x += ripple * 0.025 + pointerGlow * 0.035;
  cover.y += yBend;

  float dispersion = max(uVelocity, 0.0) * 0.05 + uHover * 0.02;
  vec3 color = vec3(
    texture2D(uMap, vec2(cover.x + dispersion, cover.y)).r,
    texture2D(uMap, cover).g,
    texture2D(uMap, vec2(cover.x - dispersion, cover.y)).b
  );

  // Tiny gaps fade the horizontal curtain strips without changing coverage.
  float strip = fract(uv.y * 24.0);
  float curtain = smoothstep(0.82, 0.97, strip);
  float stagger = floor(uv.y * 24.0) * 0.018;
  float reveal = smoothstep(stagger, stagger + 0.75, uReveal);
  color *= 0.985 + (1.0 - curtain) * 0.05;

  vec2 halfSize = uSize * 0.5;
  vec2 local = (vUv - 0.5) * uSize;
  float mask = 1.0 - smoothstep(-1.0, 1.0, sdRoundBox(local, halfSize, 36.0));

  gl_FragColor = vec4(color, mask * reveal);
}
