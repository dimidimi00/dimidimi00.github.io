import * as THREE from 'three';

/* 3D simplex noise: Ashima Arts / Stefan Gustavson, MIT License */
const noise = `  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`;

const helpers = `  uniform float uTime;
  uniform float uAmp;
  uniform vec3 uMouse;
  uniform float uMouseAmt;
  uniform float uStretch;
  ${noise}
  float disp(vec3 p) {
    float n = snoise(p * 0.85 + vec3(0.0, uTime * 0.2, uTime * 0.12));
    n += snoise(p * 1.9 - vec3(uTime * 0.16)) * 0.12;
    float m = pow(max(dot(normalize(p), uMouse), 0.0), 5.0) * uMouseAmt;
    return n * uAmp + m;
  }
  vec3 orthogonal(vec3 v) {
    return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
  }`;

const filmic = `  vec3 blobRRT(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
  vec3 blobAces(vec3 c) {
    const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    return clamp(outM * blobRRT(inM * (c / 0.6)), 0.0, 1.0);
  }
  vec3 blobToSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }`;

function studioScene() {
  const scene = new THREE.Scene();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = vP.y * 0.5 + 0.5;
        vec3 c = mix(vec3(0.015, 0.015, 0.02), vec3(0.42, 0.42, 0.45), smoothstep(0.25, 1.0, h));
        c += vec3(1.0) * pow(max(0.0, dot(vP, normalize(vec3(-1.0, -0.15, 0.4)))), 6.0) * 1.2;
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  scene.add(dome);
  const softbox = (color, intensity, pos, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  softbox('#ffffff', 5, [0, 14, 5], 22, 7);
  softbox('#ffffff', 2.6, [15, 2, 7], 4, 18);
  softbox('#ffffff', 2, [-15, -1, 3], 5, 15);
  softbox('#dde3ff', 1.4, [0, -2, -18], 26, 8);
  return scene;
}

const PATH = [
  [0.62, -0.7, 0.28],
  [-0.3, -0.08, 0.5],
  [0.26, 0.14, 0.74],
  [0, 0, 1],
];
const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
function pathAt(t) {
  const n = PATH.length - 1;
  const f = Math.min(t * n, n - 1e-6), i = Math.floor(f), u = f - i;
  const P = (k) => PATH[Math.max(0, Math.min(n, k))];
  return [0, 1, 2].map((c) => catmull(P(i - 1)[c], P(i)[c], P(i + 1)[c], P(i + 2)[c], u));
}

export class ChromeBlob {
  constructor(stage, anchor, start) {
    this.stage = stage;
    this.anchor = anchor;
    this.start = start;
    this.mouseAmt = 0;
    this.pos = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.dir = new THREE.Vector3();
    this.invQuat = new THREE.Quaternion();
    this.size = 0;
    this.placed = false;

    const pmrem = new THREE.PMREMGenerator(stage.renderer);
    stage.scene.environment = pmrem.fromScene(studioScene(), 0.02).texture;
    pmrem.dispose();

    this.uniforms = {
      uTime: { value: 0 }, uAmp: { value: 0.12 }, uMouse: { value: new THREE.Vector3(0, 0, 1) },
      uMouseAmt: { value: 0 }, uStretch: { value: 1 },
    };
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 1, roughness: 0.16,
      transparent: true,
    });
    this.material = material;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${helpers}`)
        .replace('#include <beginnormal_vertex>', `          vec3 bnT = orthogonal(normal);
          vec3 bnB = normalize(cross(normal, bnT));
          vec3 pA = position + normal * disp(position);
          vec3 b0 = position + bnT * 0.008;
          vec3 c0 = position + bnB * 0.008;
          vec3 pB = b0 + normalize(b0) * disp(b0);
          vec3 pC = c0 + normalize(c0) * disp(c0);
          vec3 objectNormal = normalize(cross(pB - pA, pC - pA));`)
        .replace('#include <begin_vertex>', 'vec3 transformed = pA; transformed.y *= uStretch;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${filmic}`)
        .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = blobAces(gl_FragColor.rgb);')
        .replace('#include <colorspace_fragment>', 'gl_FragColor.rgb = blobToSRGB(gl_FragColor.rgb);');
    };

    const geo = stage.isMobile ? new THREE.SphereGeometry(1, 112, 76) : new THREE.SphereGeometry(1, 192, 128);
    this.mesh = new THREE.Mesh(geo, material);
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    this.object = this.mesh;
  }

  measure() {
    this.ar = this.anchor.getBoundingClientRect();
    this.sr = this.start.getBoundingClientRect();
  }

  update(s, stage) {
    const { ar, sr } = this;
    const visible = sr.top < s.vh * 1.05;
    this.mesh.visible = visible;
    if (!visible) { this.placed = false; return; }

    const anchorMid = ar.top + ar.height / 2;
    const span = s.vh / 2 + (anchorMid - sr.top);
    const t = Math.min(1, Math.max(0, 1 - (anchorMid - s.vh / 2) / span));
    const since = Math.max(0, s.vh / 2 - anchorMid);
    const remaining = Math.max(0, s.maxScroll - s.scrollY);
    const q = since > 0 ? since / (since + remaining + 1) : 0;
    let x, y, size;
    if (t < 1) {
      const [px, py, ps] = pathAt(t);
      x = px * s.vw; y = py * s.vh; size = ps;
    } else {
      x = 0; y = q * s.vh * 0.05; size = 1 + q * 1.6;
    }
    y += Math.sin(s.time * 0.8) * 10;
    const target = this.target.set(x, y, 0);
    if (!this.placed) { this.pos.copy(target); this.size = size; this.placed = true; }
    this.pos.lerp(target, 0.08);
    this.size += (size - this.size) * 0.08;
    const r = ar.width * 0.34 * this.size;
    this.mesh.position.copy(this.pos);
    this.mesh.scale.setScalar(r);
    const fadeIn = Math.min(1, t / 0.08);
    const k = Math.min(1, Math.max(0, (q - 0.45) / 0.4));
    const alpha = fadeIn * (1 - k * k * (3 - 2 * k));
    this.material.opacity = alpha;
    this.mesh.visible = alpha > 0.005;

    const vel = Math.max(-60, Math.min(60, s.vel));
    this.mesh.rotation.y = s.time * 0.18 + t * 5 + q * 4;
    this.mesh.rotation.z = Math.sin(t * Math.PI) * 0.8;
    this.mesh.rotation.x = Math.sin(s.time * 0.3) * 0.25;

    const u = this.uniforms;
    u.uTime.value = s.time;
    u.uAmp.value += ((0.12 + q * 0.22 + Math.abs(vel) * 0.004) - u.uAmp.value) * 0.05;
    u.uStretch.value += ((1 + Math.abs(vel) * 0.003) - u.uStretch.value) * 0.06;

    const cx = this.pos.x + s.vw / 2, cy = s.vh / 2 - this.pos.y;
    const dx = s.mouse.x - cx, dy = cy - s.mouse.y;
    const dist = Math.hypot(dx, dy);
    const dir = this.dir.set(dx, dy, r * 1.2).normalize().applyQuaternion(this.invQuat.copy(this.mesh.quaternion).invert());
    u.uMouse.value.lerp(dir, 0.1).normalize();
    const pull = dist < r * 1.6 ? 0.3 : 0;
    this.mouseAmt += (pull - this.mouseAmt) * 0.05;
    u.uMouseAmt.value = this.mouseAmt;
  }
}
