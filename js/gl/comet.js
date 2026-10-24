import * as THREE from 'three';

const STEP = 1 / 60;
const rgb = (hex) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);

const glow = {
  transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

const ribbonVertex = `  attribute float aT;
  attribute float aSide;
  varying float vT;
  varying float vSide;
  void main() {
    vT = aT;
    vSide = aSide;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const ribbonFragment = `  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  uniform float uSoft;
  uniform float uTime;
  uniform float uGain;
  varying float vT;
  varying float vSide;
  void main() {
    float edge = 1.0 - abs(vSide);
    float body = pow(edge, uSoft);
    float hot = pow(edge, 6.0) * pow(1.0 - vT, 4.0);
    float flicker = 0.85 + 0.15 * sin(vT * 40.0 - uTime * 18.0);
    float fade = pow(1.0 - vT, 1.25) * smoothstep(0.0, 0.06, vT);
    vec3 col = mix(uColor, uHot, clamp(hot * 1.4, 0.0, 1.0));
    float a = min(1.0, (body * 0.7 + hot) * fade * flicker * uGain) * uOpacity;
    gl_FragColor = vec4(col * a, a * 0.8);
  }`;

const headVertex = `  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const headFragment = `  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPulse;
  uniform float uAspect;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    vec2 q = vec2(p.x * uAspect, p.y);
    float r = length(q);
    float core = exp(-r * r * 90.0) * 1.8;
    float inner = exp(-r * r * 12.0);
    float halo = exp(-r * 3.6) * (0.4 + uPulse * 0.8) * (0.92 + 0.08 * sin(uTime * 13.0));
    float flare = exp(-abs(p.y) * 60.0) * exp(-abs(p.x) * 2.6) * (0.55 + uPulse * 0.6);
    float clip = 1.0 - smoothstep(0.7, 1.0, max(abs(p.x), abs(p.y)));
    vec3 col = uColor * (inner + halo + flare) + vec3(1.0, 0.94, 0.88) * core;
    float a = clamp(core + inner * 0.9 + halo + flare, 0.0, 1.0) * uOpacity * clip;
    gl_FragColor = vec4(col * uOpacity * clip, a);
  }`;

const sparkVertex = `  attribute float aLife;
  attribute float aSize;
  uniform float uScale;
  varying float vLife;
  void main() {
    vLife = aLife;
    gl_PointSize = aSize * uScale * (1.0 - aLife * 0.6);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const sparkFragment = `  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vLife;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a * (1.0 - vLife) * uOpacity;
    vec3 col = mix(vec3(1.0, 0.95, 0.9), uColor, smoothstep(0.0, 0.3, vLife));
    gl_FragColor = vec4(col * a, a);
  }`;

const PATH = [[0.62, 0.46], [0.3, 0.2], [-0.3, 0.12], [-0.22, -0.22], [0.16, -0.12], [0, 0]];
const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
function pathAt(t) {
  const n = PATH.length - 1;
  const f = Math.min(t * n, n - 1e-6), i = Math.floor(f), u = f - i;
  const P = (k) => PATH[Math.max(0, Math.min(n, k))];
  return [0, 1].map((c) => catmull(P(i - 1)[c], P(i)[c], P(i + 1)[c], P(i + 2)[c], u));
}

class Ribbon {
  constructor(count, shape, uniforms) {
    this.count = count;
    this.shape = shape;
    this.width = 1;
    this.pos = new Float32Array(count * 6);
    const t = new Float32Array(count * 2), side = new Float32Array(count * 2), index = [];
    for (let i = 0; i < count; i++) {
      t[i * 2] = t[i * 2 + 1] = i / (count - 1);
      side[i * 2] = -1; side[i * 2 + 1] = 1;
      if (i < count - 1) { const a = i * 2; index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aT', new THREE.BufferAttribute(t, 1));
    this.geo.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    this.geo.setIndex(index);
    this.uniforms = uniforms;
    this.mesh = new THREE.Mesh(this.geo, new THREE.ShaderMaterial({ uniforms, vertexShader: ribbonVertex, fragmentShader: ribbonFragment, ...glow }));
    this.mesh.frustumCulled = false;
  }

  build(hist) {
    let nx = 0, ny = 1;
    const last = this.count - 1;
    for (let i = 0; i < this.count; i++) {
      const a = hist[Math.max(0, i - 3)], b = hist[Math.min(last, i + 3)];
      const tx = a[0] - b[0], ty = a[1] - b[1], l = Math.hypot(tx, ty);
      if (l > 1e-3) {
        let mx = -ty / l, my = tx / l;
        if (i > 0 && mx * nx + my * ny < 0) { mx = -mx; my = -my; }
        if (i > 0) { mx = nx * 0.55 + mx * 0.45; my = ny * 0.55 + my * 0.45; }
        const m = Math.hypot(mx, my) || 1;
        nx = mx / m; ny = my / m;
      }
      const p = hist[i], o = i * 6;
      const ux = a[0] - p[0], uy = a[1] - p[1], vx = p[0] - b[0], vy = p[1] - b[1];
      const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
      const turn = lu > 1e-3 && lv > 1e-3 ? 1 - (ux * vx + uy * vy) / (lu * lv) : 0;
      const w = this.width * this.shape(i / last) * 0.5 / (1 + turn * 3);
      this.pos[o] = p[0] + nx * w; this.pos[o + 1] = p[1] + ny * w;
      this.pos[o + 3] = p[0] - nx * w; this.pos[o + 4] = p[1] - ny * w;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}

export class Comet {
  constructor(stage, anchor, start) {
    this.stage = stage;
    this.anchor = anchor;
    this.start = start;
    this.section = anchor.parentElement;
    this.object = new THREE.Group();
    this.pos = new THREE.Vector2();
    this.vel = new THREE.Vector2();
    this.target = new THREE.Vector2();
    this.placed = false;
    this.acc = 0;
    this.last = 0;
    this.pulse = 0;
    this.mouseSeen = -9;
    this.lastMouse = { x: -9999, y: -9999 };
    this.dash = null;
    this.bursts = 0;
    this.heading = Math.PI * 1.1;
    this.speed = 600;
    this.radius = stage.isMobile ? 100 : 150;
    this.hover = matchMedia('(hover: hover)').matches;

    const mobile = stage.isMobile;
    this.hist = Array.from({ length: mobile ? 120 : 170 }, () => [0, 0]);
    const time = { value: 0 }, opacity = { value: 0 };
    this.time = time;
    this.opacity = opacity;
    this.dust = new Ribbon(this.hist.length, (t) => (0.45 + 1.4 * t) * Math.pow(1 - t, 0.55), {
      uColor: { value: rgb(0xff4f1f) }, uHot: { value: rgb(0xff8a5c) }, uOpacity: opacity, uSoft: { value: 1.4 }, uTime: time, uGain: { value: 1.8 },
    });
    this.core = new Ribbon(Math.round(this.hist.length * 0.5), (t) => Math.pow(1 - t, 0.8), {
      uColor: { value: rgb(0xff6a3d) }, uHot: { value: rgb(0xfff4ea) }, uOpacity: opacity, uSoft: { value: 2.2 }, uTime: time, uGain: { value: 2.6 },
    });

    this.headUniforms = {
      uColor: { value: rgb(0xff6a3d) }, uOpacity: opacity, uPulse: { value: 0 }, uAspect: { value: 2.4 }, uTime: time,
    };
    this.head = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: this.headUniforms, vertexShader: headVertex, fragmentShader: headFragment, ...glow,
    }));
    this.head.frustumCulled = false;

    const n = mobile ? 90 : 160;
    this.sparks = { n, next: 0, x: new Float32Array(n), y: new Float32Array(n), vx: new Float32Array(n), vy: new Float32Array(n), dur: new Float32Array(n).fill(1) };
    this.sparkPos = new Float32Array(n * 3);
    this.sparkLife = new Float32Array(n).fill(1);
    const sizes = new Float32Array(n).map(() => 3 + Math.random() * 7);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(this.sparkPos, 3).setUsage(THREE.DynamicDrawUsage));
    sg.setAttribute('aLife', new THREE.BufferAttribute(this.sparkLife, 1).setUsage(THREE.DynamicDrawUsage));
    sg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.sparkUniforms = { uColor: { value: rgb(0xff4f1f) }, uOpacity: opacity, uScale: { value: 1 } };
    this.points = new THREE.Points(sg, new THREE.ShaderMaterial({
      uniforms: this.sparkUniforms, vertexShader: sparkVertex, fragmentShader: sparkFragment, ...glow,
    }));
    this.points.frustumCulled = false;

    [this.dust.mesh, this.core.mesh, this.points, this.head].forEach((o, i) => { o.renderOrder = 3 + i; this.object.add(o); });

    this.section.addEventListener('pointerdown', (e) => {
      const s = this.stage.state;
      this.dash = { x: e.clientX - s.vw / 2, y: s.vh / 2 - e.clientY, until: s.time + 1.4 };
      this.bursts++;
    });
  }

  measure() {
    this.ar = this.anchor.getBoundingClientRect();
    this.sr = this.start.getBoundingClientRect();
    this.cr = this.section.getBoundingClientRect();
  }

  emit(count, speed, spread) {
    const sp = this.sparks;
    for (let k = 0; k < count; k++) {
      const i = sp.next;
      sp.next = (sp.next + 1) % sp.n;
      const a = Math.random() * Math.PI * 2, m = spread * (0.3 + Math.random() * 0.7);
      sp.x[i] = this.pos.x + (Math.random() - 0.5) * 8;
      sp.y[i] = this.pos.y + (Math.random() - 0.5) * 8;
      sp.vx[i] = -this.vel.x * speed + Math.cos(a) * m;
      sp.vy[i] = -this.vel.y * speed + Math.sin(a) * m;
      sp.dur[i] = 0.5 + Math.random() * 0.9;
      this.sparkLife[i] = 0;
    }
  }

  simulate(s, t) {
    const tgt = this.target;
    const ar = this.ar;
    const cx = ar.left + ar.width / 2 - s.vw / 2, cy = t < 1 ? s.vh / 2 - (ar.top + ar.height / 2) : 0;
    if (t < 1) {
      const [px, py] = pathAt(t);
      tgt.set(px * s.vw + cx * t, py * s.vh + cy * t);
    } else {
      const R = Math.min(s.vw * 0.34, 520), a = s.time * 0.7;
      tgt.set(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.55);
    }
    const m = s.mouse, cr = this.cr;
    if (this.hover && (m.x !== this.lastMouse.x || m.y !== this.lastMouse.y)) {
      this.lastMouse.x = m.x; this.lastMouse.y = m.y;
      if (m.y > cr.top && m.y < cr.bottom) this.mouseSeen = s.time;
    }
    const dashing = this.dash && s.time < this.dash.until;
    const chasing = !dashing && t >= 1 && s.time - this.mouseSeen < 2.5;
    if (dashing) tgt.set(this.dash.x, this.dash.y);
    else if (chasing) tgt.set(m.x - s.vw / 2, s.vh / 2 - m.y);

    const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    let diff = Math.atan2(dy, dx) - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const cruise = dashing ? 1500 : Math.min(1300, Math.max(dashing || chasing ? 300 : 240, dist * 1.4));
    this.speed += (cruise + Math.min(Math.abs(s.vel), 60) * 12 - this.speed) * 0.04;
    const turn = (this.speed / (this.radius * (dashing || chasing ? 1 : 1.7))) * STEP;
    this.heading += Math.max(-turn, Math.min(turn, diff));
    this.vel.set(Math.cos(this.heading) * this.speed, Math.sin(this.heading) * this.speed);
    const sp = this.speed;
    this.pos.x += this.vel.x * STEP;
    this.pos.y += this.vel.y * STEP;

    const h = this.hist.pop();
    h[0] = this.pos.x; h[1] = this.pos.y;
    this.hist.unshift(h);

    this.emit(Math.random() < 0.35 + sp / 1600 ? 1 + (sp > 1400 ? 1 : 0) : 0, 0.12, 40 + sp * 0.04);
    if (this.bursts) { this.emit(this.stage.isMobile ? 26 : 44, 0, 520); this.pulse = 1; this.bursts = 0; }

    const S = this.sparks;
    for (let i = 0; i < S.n; i++) {
      if (this.sparkLife[i] >= 1) continue;
      S.vx[i] *= 0.955; S.vy[i] *= 0.955;
      S.vy[i] -= 30 * STEP;
      S.x[i] += S.vx[i] * STEP; S.y[i] += S.vy[i] * STEP;
      this.sparkLife[i] = Math.min(1, this.sparkLife[i] + STEP / S.dur[i]);
    }
  }

  update(s, stage) {
    const { ar, sr } = this;
    if (!ar) return;
    const visible = sr.top < s.vh * 1.05;
    this.object.visible = visible;
    if (!visible) { this.placed = false; return; }

    const anchorMid = ar.top + ar.height / 2;
    const span = s.vh / 2 + (anchorMid - sr.top);
    const t = Math.min(1, Math.max(0, 1 - (anchorMid - s.vh / 2) / span));
    const alpha = Math.min(1, t / 0.08);
    this.opacity.value = alpha;
    this.object.visible = alpha > 0.005;

    const dt = Math.min(0.25, Math.max(0, s.time - this.last));
    this.last = s.time;
    if (!this.placed) {
      const [px, py] = pathAt(t);
      this.pos.set(px * s.vw, py * s.vh);
      this.vel.set(0, 0);
      this.heading = Math.PI * 1.1;
      this.speed = 600;
      for (const h of this.hist) { h[0] = this.pos.x; h[1] = this.pos.y; }
      this.sparkLife.fill(1);
      this.placed = true;
      this.acc = 0;
    }
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 12) { this.acc -= STEP; this.simulate(s, t); steps++; }
    if (steps === 12) this.acc = 0;

    const base = Math.max(150, Math.min(300, s.vw * 0.17)) * (this.stage.isMobile ? 0.85 : 1);
    const speed = this.vel.length();
    this.dust.width = base * 1.1 * (0.85 + Math.min(speed / 2600, 0.45));
    this.core.width = base * 0.2;
    this.dust.build(this.hist);
    this.core.build(this.hist);

    this.pulse += (0 - this.pulse) * 0.06;
    const size = base * (1 + Math.min(speed / 3000, 0.35) + this.pulse * 0.5);
    this.head.position.set(this.pos.x, this.pos.y, 0);
    this.head.scale.set(size * 2.4, size, 1);
    this.headUniforms.uPulse.value = this.pulse;
    this.time.value = s.time;
    this.sparkUniforms.uScale.value = stage.renderer.getPixelRatio();

    const S = this.sparks;
    for (let i = 0; i < S.n; i++) {
      this.sparkPos[i * 3] = S.x[i];
      this.sparkPos[i * 3 + 1] = S.y[i];
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.aLife.needsUpdate = true;
  }
}
