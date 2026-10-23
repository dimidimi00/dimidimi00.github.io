import * as THREE from 'three';

const vertex = `  uniform vec2 uSize;
  uniform float uProgress;
  uniform float uDir;
  uniform vec2 uVel;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;
  varying float vShade;
  #define PI 3.14159265
  void main() {
    vUv = uv;
    vec3 p = position;
    p.xy *= uSize;
    float e = 1.0 - uProgress;
    float bx = sin(uv.x * PI);
    float by = sin(uv.y * PI);
    float edge = uDir > 0.0 ? (1.0 - uv.y) : uv.y;
    p.z += bx * e * 300.0 + by * e * 120.0;
    p.y -= uDir * bx * e * uSize.y * 0.2 * edge * edge;
    p.x += (uv.x - 0.5) * e * uSize.x * 0.12 * edge;
    p.xy *= mix(0.8, 1.0, uProgress);
    p.y -= bx * uVel.y * 1.6;
    p.x -= by * uVel.x * 1.4;
    p.z += (bx * abs(uVel.y) + by * abs(uVel.x)) * 4.0;
    float d = distance(uv, uMouse);
    p.z += uHover * (bx * by * 60.0 + sin(d * 22.0 - uTime * 6.0) * 16.0 * (1.0 - smoothstep(0.0, 0.7, d)));
    vShade = e;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;

const fragment = `  uniform sampler2D uTex;
  uniform vec2 uTexSize;
  uniform vec2 uSize;
  uniform float uRadius;
  uniform float uProgress;
  uniform vec2 uVel;
  uniform float uHover;
  uniform vec2 uMouse;
  uniform float uTime;
  varying vec2 vUv;
  varying float vShade;
  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    float ra = uSize.x / uSize.y;
    float ta = uTexSize.x / uTexSize.y;
    vec2 s = ra > ta ? vec2(1.0, ta / ra) : vec2(ra / ta, 1.0);
    vec2 uv = (vUv - 0.5) * s;
    uv *= 1.0 - 0.08 * uHover - 0.2 * (1.0 - uProgress);
    uv += 0.5;
    float d = distance(vUv, uMouse);
    uv += normalize(vUv - uMouse + 1e-4) * sin(d * 36.0 - uTime * 7.0) * 0.008 * uHover * (1.0 - smoothstep(0.0, 0.6, d));
    vec2 dir = uVel * 0.00025 + vec2(0.0, (1.0 - uProgress) * 0.01);
    float r = texture2D(uTex, uv + dir).r;
    vec2 gb = texture2D(uTex, uv).gb;
    float b = texture2D(uTex, uv - dir).b;
    vec3 col = vec3(r, gb.x, b);
    col *= mix(1.0, 0.72, vShade);
    col += uHover * 0.03;
    float dd = roundedBox((vUv - 0.5) * uSize, uSize * 0.5, uRadius);
    float alpha = 1.0 - smoothstep(-1.0, 0.5, dd);
    gl_FragColor = vec4(col, alpha);
  }`;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

class FrameTexture extends THREE.VideoTexture {
  update() { }
}

export class MediaPlanes {
  constructor(stage) {
    this.stage = stage;
    this.object = new THREE.Group();
    this.planes = [];
    this.byEl = new Map();
    const seg = stage.isMobile ? 20 : 32;
    this.geometry = new THREE.PlaneGeometry(1, 1, seg, seg);
    this.io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const plane = this.byEl.get(en.target);
        if (!plane) return;
        plane.inView = en.isIntersecting;
        if (plane.video) en.isIntersecting ? plane.video.play().catch(() => {}) : plane.video.pause();
      });
    }, { rootMargin: '25% 0px' });
    this.near = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const v = en.target.querySelector('video[data-src]');
        if (v) { v.src = v.dataset.src; v.removeAttribute('data-src'); v.preload = 'auto'; }
        this.near.unobserve(en.target);
      });
    }, { rootMargin: '150% 0px' });
  }

  addAll(selector = '[data-gl]') {
    document.querySelectorAll(selector).forEach((el) => this.addEl(el));
  }

  addEl(el) {
    if (this.byEl.has(el)) return;
    const source = el.querySelector('video, img');
    if (!source) return;
    const isVideo = source.tagName === 'VIDEO';
    const texture = isVideo ? new FrameTexture(source) : new THREE.Texture(source);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    const uniforms = {
      uTex: { value: texture },
      uTexSize: { value: new THREE.Vector2(16, 9) },
      uSize: { value: new THREE.Vector2(1, 1) },
      uRadius: { value: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 },
      uProgress: { value: 0 },
      uDir: { value: 1 },
      uVel: { value: new THREE.Vector2() },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    };
    const setSize = () => {
      const w = isVideo ? source.videoWidth : source.naturalWidth;
      const h = isVideo ? source.videoHeight : source.naturalHeight;
      if (w && h) uniforms.uTexSize.value.set(w, h);
      if (!isVideo) texture.needsUpdate = true;
    };
    if (isVideo) {
      source.muted = true;
      source.addEventListener('loadedmetadata', setSize);
      if (source.readyState >= 1) setSize();
    } else {
      source.complete && source.naturalWidth ? setSize() : source.addEventListener('load', setSize, { once: true });
    }

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    this.object.add(mesh);

    const plane = {
      el, mesh, uniforms, video: isVideo ? source : null, inView: false, wasVisible: false, prog: 0, hover: 0, hoverTarget: 0,
      radius: null, rect: null, fresh: false, rvfc: false, lastTime: -1,
    };
    if (isVideo) {
      const mark = () => { plane.fresh = true; };
      source.addEventListener('loadeddata', mark);
      source.addEventListener('seeked', mark);
      plane.rvfc = 'requestVideoFrameCallback' in source;
    }
    const hoverEl = el.closest('a, .card') || el;
    hoverEl.addEventListener('pointerenter', () => { plane.hoverTarget = 1; });
    hoverEl.addEventListener('pointerleave', () => { plane.hoverTarget = 0; });
    this.planes.push(plane);
    this.byEl.set(el, plane);
    this.io.observe(el);
    if (source.dataset?.src) this.near.observe(el);
  }

  async warm(renderer, all = true) {
    for (const p of this.planes) {
      const v = p.video;
      if (!v) continue;
      if (v.dataset.src) {
        if (!all) continue;
        v.src = v.dataset.src;
        v.removeAttribute('data-src');
        v.preload = 'auto';
        this.near.unobserve(p.el);
      }
      await new Promise((resolve) => {
        const upload = () => {
          const tex = p.uniforms.uTex.value;
          tex.needsUpdate = true;
          try { renderer.initTexture(tex); } catch { }
          resolve();
        };
        v.readyState >= 2 ? upload() : v.addEventListener('loadeddata', upload, { once: true });
        setTimeout(resolve, 4000);
      });
    }
  }

  measure() {
    for (const p of this.planes) p.rect = p.inView ? p.el.getBoundingClientRect() : null;
  }

  update(s) {
    const vel = clamp(s.vel, -60, 60);
    for (const p of this.planes) {
      p.mesh.visible = !!p.rect;
      if (!p.rect) { p.wasVisible = false; continue; }
      const v = p.video;
      if (v && v.readyState >= 2 && (p.fresh || (!p.rvfc && !v.paused && v.currentTime !== p.lastTime))) {
        p.uniforms.uTex.value.needsUpdate = true;
        p.fresh = false;
        p.lastTime = v.currentTime;
      }
      const rect = p.rect;
      const { x, y } = this.stage.toWorld(rect);
      p.mesh.position.set(x, y, 0);
      const u = p.uniforms;
      u.uSize.value.set(rect.width, rect.height);
      const settledTop = Math.max(0, s.vh * 0.55 - rect.height / 2);
      const enter = clamp((s.vh - rect.top) / (s.vh - settledTop), 0, 1);
      const exit = clamp(rect.bottom / (s.vh * 0.3), 0, 1);
      const entering = enter < exit;
      const k = entering ? enter : exit;
      const target = 1 - Math.pow(1 - k, 3);
      p.prog = p.wasVisible ? p.prog + (target - p.prog) * 0.12 : target;
      p.wasVisible = true;
      const prog = p.prog;
      u.uProgress.value = prog;
      u.uDir.value = entering ? 1 : -1;
      p.mesh.rotation.x = (entering ? -1 : 1) * (1 - prog) * 0.38;
      p.mesh.rotation.y = (x / s.vw) * (1 - prog) * 0.3;
      u.uVel.value.set(0, vel);
      p.hover += (p.hoverTarget - p.hover) * 0.07;
      u.uHover.value = p.hover;
      u.uTime.value = s.time;
      if (p.hover > 0.01) {
        u.uMouse.value.set((s.mouse.x - rect.left) / rect.width, 1 - (s.mouse.y - rect.top) / rect.height);
      }
      if (p.radius !== null) u.uRadius.value = p.radius;
    }
  }
}
