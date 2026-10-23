import * as THREE from 'three';

const vertex = `  uniform vec2 uView;
  uniform float uTime;
  uniform float uScroll;
  uniform float uVel;
  uniform float uWidth;
  uniform float uPhase;
  uniform float uAmp;
  varying float vT;
  varying float vSide;
  #define PI 3.14159265
  vec2 path(float t) {
    float x = (t - 0.5) * uView.x * 1.35;
    float sweep = sin(uScroll * 0.00055 + uPhase) * 0.36 + sin(uTime * 0.12 + uPhase * 2.0) * 0.08;
    float tilt = sin(uScroll * 0.0003 + uPhase * 1.7) * 0.55;
    float H = min(uView.y, uView.x * 0.9);
    float y = uView.y * sweep + H * (t - 0.5) * tilt;
    y += sin(t * 6.2832 * (0.7 + uPhase * 0.15) + uTime * 0.35 + uScroll * 0.0012 + uPhase) * H * 0.13 * uAmp;
    y += sin(t * 6.2832 * 1.9 - uTime * 0.25 + uPhase * 3.0) * H * 0.04;
    y += sin(t * PI) * uVel * 9.0;
    return vec2(x, y);
  }
  void main() {
    vT = uv.x;
    vSide = uv.y * 2.0 - 1.0;
    vec2 a = path(uv.x);
    vec2 b = path(uv.x + 0.002);
    vec2 n = normalize(vec2(a.y - b.y, b.x - a.x));
    float w = uWidth * (0.35 + 0.65 * sin(uv.x * PI)) * (1.0 + min(abs(uVel) * 0.02, 0.8));
    vec2 p = a + n * vSide * w * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  }`;

const fragment = `  uniform vec3 uColor;
  uniform float uReveal;
  uniform float uOpacity;
  varying float vT;
  varying float vSide;
  void main() {
    if (vT > uReveal) discard;
    float d = abs(vSide);
    float aa = fwidth(d) * 1.5;
    float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, d);
    alpha *= smoothstep(0.0, 0.04, uReveal - vT);
    gl_FragColor = vec4(uColor, alpha * uOpacity);
  }`;

export class Lines {
  constructor(stage) {
    this.object = new THREE.Group();
    this.reveal = 0;
    this.presence = 1;
    this.presenceTarget = 1;
    const geo = new THREE.PlaneGeometry(1, 1, stage.isMobile ? 160 : 320, 1);
    const specs = [
      { width: 16, phase: 0.0, amp: 1.0, light: '#ff4f1f', dark: '#3a3a40', alpha: 0.85 },
      { width: 1.5, phase: 1.3, amp: 0.8, light: '#111113', dark: '#f4f2ee', alpha: 0.7 },
      { width: 6, phase: 2.6, amp: 1.2, light: '#c9c4ba', dark: '#26262b', alpha: 1 },
    ];
    this.lines = specs.map((spec, i) => {
      const uniforms = {
        uView: { value: new THREE.Vector2() },
        uTime: { value: 0 }, uScroll: { value: 0 }, uVel: { value: 0 },
        uWidth: { value: spec.width * (stage.isMobile ? 0.45 : 1) },
        uPhase: { value: spec.phase }, uAmp: { value: spec.amp },
        uColor: { value: new THREE.Color(spec.light) },
        uReveal: { value: 0 }, uOpacity: { value: 1 },
      };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      this.object.add(mesh);
      const palette = { light: new THREE.Color(spec.light), dark: new THREE.Color(spec.dark) };
      return { mesh, uniforms, palette, target: palette.light, alpha: spec.alpha, delay: i * 0.12 };
    });
  }

  setTheme(name) {
    for (const l of this.lines) l.target = l.palette[name] || l.palette.light;
  }

  setPresence(v) { this.presenceTarget = v; }

  update(s) {
    const scroll = s.scrollY;
    this.presence += (this.presenceTarget - this.presence) * 0.04;
    for (const l of this.lines) {
      const u = l.uniforms;
      u.uView.value.set(s.vw, s.vh);
      u.uTime.value = s.time;
      u.uScroll.value = scroll;
      u.uVel.value += (s.vel - u.uVel.value) * 0.12;
      u.uReveal.value = Math.min(1.05, Math.max(0, this.reveal * 1.25 - l.delay));
      u.uColor.value.lerp(l.target, 0.08);
      u.uOpacity.value = l.alpha * this.presence;
    }
  }
}
