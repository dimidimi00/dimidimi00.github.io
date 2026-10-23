import * as THREE from 'three';

const RAMP = ' .:-=+*/<{#0@';

const fragment = `  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 uRes;
  uniform float uPixel;
  uniform float uAscii;
  uniform float uCell;
  uniform float uGlyphs;
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 px = vUv * uRes;
    if (uAscii > 0.5) {
      float cellSize = max(uCell, uPixel);
      vec2 cell = floor(px / cellSize);
      vec4 s = texture2D(tScene, (cell + 0.5) * cellSize / uRes);
      if (s.a < 0.01) { gl_FragColor = vec4(0.0); return; }
      vec3 rgb = s.rgb / s.a;
      float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
      float idx = min(floor(lum * uGlyphs), uGlyphs - 1.0);
      float tick = floor(uTime * 10.0);
      if (hash(cell + tick) > 0.83) idx = clamp(idx + floor(hash(cell * 1.7 + tick) * 5.0) - 2.0, 1.0, uGlyphs - 1.0);
      float band = exp(-pow((fract(uTime * 0.18) - (1.0 - vUv.y)) * 9.0, 2.0));
      if (hash(cell - tick) < band * 0.6) idx = uGlyphs - 1.0 - floor(hash(cell + tick * 0.3) * 3.0);
      vec2 f = fract(px / cellSize);
      float g = texture2D(tGlyphs, vec2((idx + f.x) / uGlyphs, f.y)).r;
      vec3 col = mix(rgb * 0.32, min(rgb * 1.45 + 0.12, vec3(1.0)), g);
      gl_FragColor = vec4(col * s.a, s.a);
      return;
    }
    if (uPixel > 1.0) px = (floor(px / uPixel) + 0.5) * uPixel;
    gl_FragColor = texture2D(tScene, px / uRes);
  }`;

function glyphAtlas() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size * RAMP.length;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${size * 0.8}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  [...RAMP].forEach((c, i) => ctx.fillText(c, i * size + size / 2, size / 2 + 1));
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export class PostPass {
  constructor(renderer) {
    this.renderer = renderer;
    this.size = new THREE.Vector2();
    this.target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.uniforms = {
      tScene: { value: this.target.texture },
      tGlyphs: { value: glyphAtlas() },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPixel: { value: 0 },
      uAscii: { value: 0 },
      uCell: { value: 10 },
      uGlyphs: { value: RAMP.length },
      uTime: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: fragment,
      transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    });
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  get active() { return this.uniforms.uAscii.value > 0.5 || this.uniforms.uPixel.value > 1; }

  set({ ascii, pixel }) {
    this.pixel = pixel;
    this.uniforms.uAscii.value = ascii ? 1 : 0;
    this.uniforms.uPixel.value = pixel > 0 ? 2 : 0;
  }

  render(scene, camera, time = 0) {
    this.uniforms.uTime.value = time;
    const dpr = this.renderer.getPixelRatio();
    this.uniforms.uPixel.value = this.pixel > 0 ? this.pixel * dpr : 0;
    this.uniforms.uCell.value = 10 * dpr;
    this.renderer.getDrawingBufferSize(this.size);
    if (this.size.x !== this.target.width || this.size.y !== this.target.height) {
      this.target.setSize(this.size.x, this.size.y);
      this.uniforms.uRes.value.copy(this.size);
    }
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
}
