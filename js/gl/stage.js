import * as THREE from 'three';
import { PostPass } from './post.js';

export class Stage {
  constructor(canvas) {
    this.isMobile = matchMedia('(max-width: 760px), (hover: none)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.isMobile || devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true });
    const lowEnd = (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4;
    this.maxDpr = Math.min(devicePixelRatio, this.isMobile ? 2 : lowEnd ? 1 : 1.5);
    this.minDpr = 0.6;
    this.pixelBudget = this.isMobile ? 1.8e6 : 2.1e6;
    this.dpr = this.maxDpr;
    this.frameMs = 16.7;
    this.lastFrame = 0;
    this.budget = 16.7;
    this.samples = 0;
    this.missed = 0;
    this.drops = 0;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.info.autoReset = false;
    this.post = null;
    this.scene = new THREE.Scene();
    this.dist = 1200;
    this.camera = new THREE.PerspectiveCamera(45, 1, 10, 5000);
    this.camera.position.z = this.dist;
    this.items = [];
    this.state = { time: 0, vw: 1, vh: 1, vel: 0, scrollY: 0, maxScroll: 1, mouse: { x: -9999, y: -9999 } };
    this.resize();
    addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
    addEventListener('pointermove', (e) => { this.state.mouse.x = e.clientX; this.state.mouse.y = e.clientY; });
  }

  add(item) {
    this.items.push(item);
    if (item.object) this.scene.add(item.object);
    return item;
  }

  fitDpr() {
    const fit = Math.sqrt(this.pixelBudget / (this.state.vw * this.state.vh));
    return Math.max(this.minDpr, Math.min(this.maxDpr, fit) - this.drops * 0.2);
  }

  resize() {
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    this.state.vw = vw; this.state.vh = vh;
    this.dpr = this.fitDpr();
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(vw, vh, true);
    this.camera.aspect = vw / vh;
    this.camera.fov = 2 * Math.atan(vh / 2 / this.dist) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
    this.items.forEach((i) => i.resize?.(this.state));
  }

  toWorld(rect) {
    return {
      x: rect.left + rect.width / 2 - this.state.vw / 2,
      y: this.state.vh / 2 - (rect.top + rect.height / 2),
    };
  }

  measure() {
    for (const item of this.items) item.measure?.();
  }

  setBudget(ms) { this.budget = ms; this.samples = 0; this.missed = 0; }

  adapt(time, sample) {
    if (!sample) { this.lastFrame = 0; return; }
    const dt = (time - this.lastFrame) * 1000;
    this.lastFrame = time;
    if (!dt || dt > 250) return;
    this.frameMs += (dt - this.frameMs) * 0.05;
    this.samples++;
    if (dt > this.budget * 1.6) this.missed++;
    if (this.samples < 180) return;
    if (this.missed / this.samples > 0.25 && this.dpr > this.minDpr && this.drops < 2) {
      this.drops++;
      this.dpr = this.fitDpr();
      this.renderer.setPixelRatio(this.dpr);
    }
    this.samples = 0;
    this.missed = 0;
  }

  setFx({ ascii, pixel }) {
    if ((ascii || pixel > 0) && !this.post) this.post = new PostPass(this.renderer);
    this.post?.set({ ascii, pixel });
  }

  setWireframe(on) {
    this.scene.traverse((o) => { if (o.material) o.material.wireframe = on; });
  }

  render(time, vel, scrollY, maxScroll, sample = true) {
    const s = this.state;
    s.time = time; s.vel = vel; s.scrollY = scrollY; s.maxScroll = maxScroll;
    this.adapt(time, sample);
    for (const item of this.items) item.update(s, this);
    this.renderer.info.reset();
    if (this.post?.active) this.post.render(this.scene, this.camera, time);
    else this.renderer.render(this.scene, this.camera);
  }
}
