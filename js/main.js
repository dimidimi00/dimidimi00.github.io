import { Stage } from './gl/stage.js';
import { MediaPlanes } from './gl/media.js';
import { Lines } from './gl/lines.js';
import { Comet } from './gl/comet.js';
import { runLoader, timecode } from './ui/loader.js';
import { splitText, splitChars, setupReveals, playIntro } from './ui/reveal.js';
import { setupCursor } from './ui/cursor.js';
import { setupTimeline } from './ui/timeline.js';
import { setupHoverScrub } from './ui/scrub.js';
import { setupConfig, setupRemixHint } from './ui/config.js';
import { setupAsciiText } from './ui/asciitext.js';
import { setupImageFx } from './ui/imgfx.js';
import { setupDebug } from './ui/debug.js';
import { setupArchive } from './ui/archive.js';
import { setupPlayer } from './ui/player.js';
import { setupLightbox } from './ui/lightbox.js';
import { setupThemes, setupScrollFx, setupLabHover, setupTilt, setupFrameFx } from './ui/fx.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const lerp = (a, b, t) => a + (b - a) * t;

const content = await fetch('data/content.json').then((r) => r.json());

function renderContent(c) {
  const total = String(c.featured.length).padStart(2, '0');
  document.getElementById('work-grid').innerHTML = c.featured.map((f, i) => `
    <article class="project" data-cursor="Play" data-player data-video="${f.video}" data-title="${f.title} - ${f.subtitle}" data-href="${f.href}">
      <div class="project-media" data-gl="video" data-cursor=""><video data-src="${f.video}" muted loop playsinline preload="none"></video><span class="scrub-line"></span><span class="scrub-tc mono"></span></div>
      <div class="project-info">
        <span class="mono project-index" data-reveal>${String(i + 1).padStart(2, '0')} / ${total}</span>
        <h3 data-split><span class="line">${f.title}</span></h3>
        <p data-reveal>${f.subtitle}</p>
        <span class="mono project-tags" data-reveal><b>●</b> ${f.year} - ${f.type}</span>
        <a class="pill pill-dark magnetic" href="${f.href}" target="_blank" rel="noreferrer" data-cursor="YouTube" data-reveal><span>Watch on YouTube</span><b>↗</b></a>
      </div>
    </article>`).join('');

  const reel = document.getElementById('reel-media');
  reel.href = c.reel.href;
  reel.dataset.video = c.reel.full || c.reel.video;
  reel.dataset.title = c.reel.title;
  reel.dataset.href = c.reel.href;
  reel.querySelector('video').src = c.reel.video;
  document.getElementById('reel-caption').textContent = `Latest project - ${c.reel.title} · click to play`;

  const mail = document.getElementById('contact-mail');
  mail.href = `mailto:${c.email}`;
  mail.firstChild.textContent = `${c.email} `;
  document.getElementById('socials').innerHTML = c.socials.map((s) => `<a href="${s.href}" target="_blank" rel="noreferrer" data-scramble>${s.label} ↗</a>`).join('');
  document.getElementById('year').textContent = new Date().getFullYear();
}
renderContent(content);
splitText();
splitChars();

const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
lenis.stop();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.lagSmoothing(0);
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const target = document.querySelector(a.getAttribute('href'));
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target, { duration: 1.8 });
}));

content.archive.ai = content.aiImages.map((src, i) => ['AI @ Work', `Static design ${String(i + 1).padStart(2, '0')}`, '', src]);
let stage = null, media = null, lines = null;
try {
  stage = new Stage(document.getElementById('gl'));
  lines = stage.add(new Lines(stage));
  media = stage.add(new MediaPlanes(stage));
  media.addAll();
  stage.add(new Comet(stage, document.getElementById('blob-anchor'), document.querySelector('.bigtype')));
  root.classList.add('gl-on');
} catch (err) {
  console.warn('[portfolio] WebGL unavailable - showing plain video. Check that hardware acceleration is enabled.', err);
  stage = null;
}
if (!stage) document.querySelectorAll('[data-gl] video').forEach((v) => {
  if (v.dataset.src) v.src = v.dataset.src;
  v.autoplay = true;
  v.play().catch(() => {});
});

const cursorTick = setupCursor(gsap);
const frameFx = setupFrameFx(gsap);
setupArchive(content.archive, gsap, ScrollTrigger);
setupReveals(gsap, ScrollTrigger);
setupScrollFx(gsap, ScrollTrigger);
setupTilt(gsap);
setupLabHover();
setupHoverScrub();
setupPlayer(gsap, lenis);
setupLightbox(gsap, lenis, content.aiImages);
setupThemes(ScrollTrigger, (theme, showLines) => {
  lines?.setTheme(theme);
  lines?.setPresence(showLines ? 1 : 0.16);
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
});

const reelEl = document.getElementById('reel-media');
const reelStack = document.getElementById('reel-stack');
const timelineEl = document.getElementById('timeline');
const reelVideo = reelEl.querySelector('video');
const reelTc = document.getElementById('reel-tc');
const reelWords = document.querySelectorAll('.reel-word');
const reelState = { p: 0, target: 0 };
let reelBox = { w0: 1, w1: 1 };
const sizeReel = () => {
  const vw = innerWidth, vh = innerHeight, mobile = vw < 760;
  const w1 = mobile ? vw * 0.92 : Math.min(vw * 0.74, 1280, (vh * 0.8 - 110) * 16 / 9);
  reelBox = { w0: mobile ? vw * 0.86 : vw * 0.4, w1 };
  reelStack.style.setProperty('--w', `${w1}px`);
  reelStack.style.setProperty('--h', `${w1 * 9 / 16}px`);
};
const layoutReel = () => {
  const e = gsap.parseEase('power2.inOut')(Math.min(1, reelState.p / 0.8));
  const r = lerp(24, 14, e);
  reelEl.style.transform = `scale(${lerp(reelBox.w0 / reelBox.w1, 1, e)})`;
  const t = Math.min(1, Math.max(0, (e - 0.55) / 0.45));
  timelineEl.style.opacity = String(t);
  timelineEl.style.transform = `translateY(${(1 - t) * 24}px)`;
  timelineEl.style.pointerEvents = t > 0.5 ? 'auto' : 'none';
  reelWords.forEach((w, i) => {
    w.style.transform = `translateX(${(i ? 1 : -1) * e * 40}vw)`;
    w.style.opacity = String(1 - e * 1.4);
  });
  const plane = media?.byEl.get(reelEl);
  if (plane) plane.radius = r;
};
ScrollTrigger.create({
  trigger: '#reel', start: 'top top', end: 'bottom bottom',
  onUpdate: (self) => { reelState.target = self.progress; },
});
addEventListener('resize', () => { sizeReel(); layoutReel(); });
sizeReel();
layoutReel();
const timelineTick = setupTimeline(reelVideo);

const debug = setupDebug(stage);
const asciiText = setupAsciiText();
const imgFx = setupImageFx();
const PIXEL = 8;
let pixelFont = null;
const loadPixelFont = () => (pixelFont ??= new Promise((resolve) => {
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600;700&display=swap' });
  link.onload = () => document.fonts.ready.then(resolve);
  link.onerror = resolve;
  document.head.append(link);
}));
const relayout = () => dispatchEvent(new Event('resize'));
let was = { ascii: false, pixel: false };
const config = setupConfig(gsap, (s) => {
  root.classList.toggle('fx-ascii', s.ascii);
  root.classList.toggle('fx-pixel', s.pixel);
  if (s.ascii !== was.ascii) s.ascii ? asciiText.start() : asciiText.stop();
  if (s.pixel !== was.pixel) { relayout(); if (s.pixel) loadPixelFont().then(relayout); }
  was = { ascii: s.ascii, pixel: s.pixel };
  root.classList.toggle('fx-crt', s.crt);
  stage?.setFx({ ascii: s.ascii, pixel: s.pixel ? PIXEL : 0 });
  imgFx.set(s.ascii ? 'ascii' : s.pixel ? 'pixel' : 'none', PIXEL);
  debug.set(s.debug);
});

const marquees = [...document.querySelectorAll('.marquee-track')].map((el) => ({ el, dir: Number(el.dataset.dir || 1), loop: 1 }));
let mx = 0, mdir = -1;
const fillMarquee = () => marquees.forEach((m) => {
  const base = m.el.firstElementChild;
  m.el.replaceChildren(base);
  m.loop = base.offsetWidth || 1;
  const copies = Math.ceil(innerWidth / m.loop) + 1;
  for (let i = 0; i < copies; i++) m.el.append(base.cloneNode(true));
});
fillMarquee();
document.fonts?.ready.then(fillMarquee);
addEventListener('resize', fillMarquee);

const nav = document.querySelector('.nav');
gsap.set(nav, { yPercent: -100, autoAlpha: 0 });
let lastY = 0, navHidden = false, navScrolled = false;

let maxScroll = 1;
const measurePage = () => { maxScroll = document.documentElement.scrollHeight - innerHeight; };
new ResizeObserver(measurePage).observe(document.body);
addEventListener('resize', measurePage);
ScrollTrigger.addEventListener('refresh', measurePage);
measurePage();

let vel = 0, prevY = scrollY, lastReelTc = '', lastActive = performance.now();
const playerEl = document.getElementById('player');
const wake = () => { lastActive = performance.now(); };
['pointermove', 'wheel', 'touchmove', 'keydown', 'scroll'].forEach((t) => addEventListener(t, wake, { passive: true }));
let tickNo = 0, renderEvery = 1, rafPrev = 0;
const rafDeltas = [];
gsap.ticker.add((time) => {
  if (rafPrev && rafDeltas.length < 90) {
    rafDeltas.push(time - rafPrev);
    if (rafDeltas.length === 90) {
      const hz = 1 / rafDeltas.sort((a, b) => a - b)[45];
      renderEvery = Math.max(1, Math.floor(hz / 58));
      stage?.setBudget((1000 / hz) * renderEvery);
    }
  }
  rafPrev = time;
  cursorTick();
  tickNo++;
  if (tickNo % (performance.now() - lastActive < 1500 ? renderEvery : renderEvery * 2) !== 0) return;
  lenis.raf(time * 1000);
  const y = scrollY;
  vel = lerp(vel, y - prevY, 0.1);
  if (Math.abs(vel) < 0.01) vel = 0;
  prevY = y;
  if (Math.abs(vel) > 0.05) lastActive = performance.now();
  const active = performance.now() - lastActive < 1500;
  const draw = playerEl.hidden;
  if (draw) stage?.measure();

  if (Math.abs(y - lastY) > 4) {
    const hide = y > lastY && y > 200;
    if (hide !== navHidden) { nav.classList.toggle('is-hidden', hide); navHidden = hide; }
    lastY = y;
  }
  if ((y > 40) !== navScrolled) { navScrolled = y > 40; nav.classList.toggle('is-scrolled', navScrolled); }

  if (Math.abs(reelState.target - reelState.p) > 0.0005) { reelState.p = lerp(reelState.p, reelState.target, 0.14); layoutReel(); }

  if (Math.abs(vel) > 0.1) mdir = vel > 0 ? -1 : 1;
  mx += mdir * (0.6 + Math.min(Math.abs(vel), 40) * 0.18);
  for (const m of marquees) {
    const x = (((mx * m.dir) % m.loop) + m.loop) % m.loop - m.loop;
    m.el.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  if (reelVideo.readyState >= 2) {
    const tc = `TC ${timecode(Math.floor(reelVideo.currentTime * 25))}`;
    if (tc !== lastReelTc) { reelTc.textContent = tc; lastReelTc = tc; }
  }

  timelineTick();
  frameFx(vel, y, maxScroll);
  if (draw) stage?.render(time, vel, y, maxScroll, active);
  debug.tick(vel, y, maxScroll);
});

const shadersReady = !stage ? null : stage.renderer.extensions.has('KHR_parallel_shader_compile')
  ? stage.renderer.compileAsync(stage.scene, stage.camera).catch(() => { })
  : new Promise((resolve) => setTimeout(() => { stage.renderer.compile(stage.scene, stage.camera); resolve(); }, 80));
const saveData = navigator.connection?.saveData || /2g|3g/.test(navigator.connection?.effectiveType || '');
const videoCount = document.querySelectorAll('[data-gl] video').length;
const videosWarm = media ? media.warm(stage.renderer, !saveData && !stage.isMobile) : Promise.resolve();
const thumbs = [...document.querySelectorAll('#archive-grid img')];
const thumbsReady = Promise.all(thumbs.map((img) => { img.loading = 'eager'; return img.decode().catch(() => { }); }));
const reelReady = new Promise((res) => (reelVideo.readyState >= 2 ? res() : reelVideo.addEventListener('loadeddata', res, { once: true })));
await runLoader({
  gsap,
  sys: `${innerWidth}×${innerHeight} · ${stage ? 'webgl2 ok' : 'webgl off'}`,
  tasks: [
    { label: `compiling shaders (${stage ? stage.scene.children.length : 0} passes)`, promise: shadersReady ?? Promise.resolve() },
    { label: 'decoding fonts', promise: document.fonts?.ready },
    { label: 'buffering "latest project"', promise: reelReady },
    { label: `warming video decoders (${videoCount})`, promise: videosWarm },
    { label: `decoding thumbnails (${thumbs.length})`, promise: thumbsReady },
  ],
});
root.classList.remove('is-loading');
lenis.start();
ScrollTrigger.refresh();
playIntro(gsap, lines, asciiText);
setupRemixHint(config);
