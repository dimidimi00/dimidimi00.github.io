import { scramble } from './reveal.js';
import { timecode } from './loader.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function setupThemes(ScrollTrigger, onChange) {
  const root = document.documentElement;
  const label = document.getElementById('hud-section');
  const set = (el) => {
    root.dataset.theme = el.dataset.theme;
    onChange?.(el.dataset.theme, el.dataset.lines === 'full');
    if (el.dataset.label && label.dataset.text !== el.dataset.label) { label.dataset.text = el.dataset.label; scramble(label, 0.5); }
  };
  document.querySelectorAll('main > [data-theme], footer[data-theme]').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onEnter: () => set(el), onEnterBack: () => set(el) });
  });
}

export function setupScrollFx(gsap, ScrollTrigger) {
  const introLines = gsap.utils.toArray('.intro-title .line');
  gsap.timeline({ scrollTrigger: { trigger: '.intro', start: 'top top', end: 'bottom top', scrub: 1 } })
    .to(introLines[0], { xPercent: -16, ease: 'none' }, 0)
    .to(introLines[1], { xPercent: 12, ease: 'none' }, 0)
    .to(introLines[2], { xPercent: -8, ease: 'none' }, 0)
    .to('.intro-title', { opacity: 0.15, ease: 'none' }, 0)
    .to('.intro-aside, .eyebrow, .scroll-hint', { y: -140, opacity: 0, ease: 'none' }, 0);

  document.querySelectorAll('[data-drift]').forEach((h) => {
    h.querySelectorAll('.line').forEach((line, i) => {
      const d = i % 2 ? -1 : 1;
      gsap.fromTo(line, { x: () => d * innerWidth * 0.08 }, {
        x: () => -d * innerWidth * 0.04, ease: 'none',
        scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true },
      });
    });
  });

  const track = document.getElementById('craft-track');
  gsap.to(track, {
    x: () => -(track.scrollWidth - innerWidth), ease: 'none',
    scrollTrigger: { trigger: '.craft', start: 'top top', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
  });
  gsap.fromTo('#craft-progress', { scaleX: 0 }, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: '.craft', start: 'top top', end: 'bottom bottom', scrub: 1 },
  });

  document.querySelectorAll('.bigtype-row').forEach((row) => {
    const dir = Number(row.dataset.dir);
    gsap.fromTo(row, { xPercent: dir > 0 ? -45 : 0 }, {
      xPercent: dir > 0 ? 0 : -45, ease: 'none',
      scrollTrigger: { trigger: '.bigtype', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });

  const name = document.querySelector('.footer-name');
  const fit = () => {
    const base = innerWidth * 0.1;
    name.style.fontSize = `${base}px`;
    const range = document.createRange();
    range.selectNodeContents(name);
    const textWidth = range.getBoundingClientRect().width;
    const cs = getComputedStyle(name);
    const available = name.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    name.style.fontSize = `${base * available / textWidth * 0.98}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  addEventListener('resize', fit);
  gsap.from('.footer-name .ch', {
    yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.045,
    scrollTrigger: { trigger: '.footer', start: 'top 92%', toggleActions: 'play none none reverse' },
  });

  document.querySelectorAll('.lab-row').forEach((row) => {
    gsap.from(row.children, {
      y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: row, start: 'top 88%', onEnter: () => row.classList.add('in') },
    });
  });

  document.querySelectorAll('.project').forEach((row) => {
    gsap.from(row, {
      y: 110, ease: 'none',
      scrollTrigger: { trigger: row, start: 'top bottom', end: 'top 50%', scrub: 1 },
    });
  });

  gsap.from('.contact-mail', { y: 80, opacity: 0, scrollTrigger: { trigger: '.contact-mail', start: 'top 95%', end: 'top 65%', scrub: true } });
}

export function setupLabHover() {
  document.querySelectorAll('.lab-row[data-cmd]').forEach((row) => {
    const title = row.querySelector('h3');
    const cmd = document.createElement('code');
    cmd.className = 'lab-cmd mono';
    row.append(cmd);
    let timer = null;
    row.addEventListener('pointerenter', () => {
      scramble(title, 0.5);
      const text = row.dataset.cmd;
      let i = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        cmd.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(timer);
      }, 26);
    });
    row.addEventListener('pointerleave', () => { clearInterval(timer); cmd.textContent = ''; });
  });
}

export function setupTilt(gsap) {
  const grid = document.getElementById('archive-grid');
  let current = null;
  grid.addEventListener('pointermove', (e) => {
    const tile = e.target.closest('.tile');
    if (current && current !== tile) gsap.to(current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'expo.out' });
    current = tile;
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    gsap.to(tile, { rotateX: (0.5 - y) * 16, rotateY: (x - 0.5) * 18, z: 30, duration: 0.6, ease: 'expo.out' });
    tile.style.setProperty('--mx', `${x * 100}%`);
    tile.style.setProperty('--my', `${y * 100}%`);
  });
  grid.addEventListener('pointerleave', () => {
    if (current) gsap.to(current, { rotateX: 0, rotateY: 0, z: 0, duration: 0.8, ease: 'expo.out' });
    current = null;
  });
}

export function setupFrameFx(gsap) {
  const bigRows = gsap.utils.toArray('.bigtype-row').map((el) => gsap.quickSetter(el, 'skewX', 'deg'));
  const hudTc = document.getElementById('hud-tc');
  const playhead = document.getElementById('playhead');
  const introLines = gsap.utils.toArray('.intro-title .line');
  const lineX = introLines.map((el) => gsap.quickTo(el, 'x', { duration: 1.2, ease: 'expo.out' }));
  const TOTAL_FRAMES = 25 * 150;
  let skew = 0, lastSkew = 0, lastMouse = -1;

  addEventListener('pointermove', (e) => {
    const m = e.clientX / innerWidth - 0.5;
    if (Math.abs(m - lastMouse) < 0.005) return;
    lastMouse = m;
    lineX.forEach((to, i) => to(m * -(i + 1) * 22));
  });

  const track = document.getElementById('craft-track');
  const panels = gsap.utils.toArray('.craft-panel').map((el) => ({ el, num: el.querySelector('.craft-num'), mid: 0 }));
  const measure = () => panels.forEach((p) => { p.mid = p.el.offsetLeft + p.el.offsetWidth / 2; });
  measure();
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  let craftInView = false;
  new IntersectionObserver(([en]) => { craftInView = en.isIntersecting; }).observe(document.querySelector('.craft'));
  let lastTc = '';

  return (vel, scrollY, maxScroll) => {
    if (craftInView) {
      const x = gsap.getProperty(track, 'x');
      for (const p of panels) {
        const d = (p.mid + x - innerWidth / 2) / innerWidth;
        p.el.style.opacity = String(1 - clamp(Math.abs(d) - 0.3, 0, 1) * 0.9);
        p.el.style.transform = `scale(${1 - clamp(Math.abs(d), 0, 1) * 0.06})`;
        if (p.num) p.num.style.transform = `translateX(${d * 24}vw)`;
      }
    }
    skew += (clamp(vel * 0.08, -4, 4) - skew) * 0.08;
    if (Math.abs(skew) < 0.005) skew = 0;
    if (skew !== lastSkew) {
      bigRows.forEach((set, i) => set(skew * (i ? 1.6 : -1.6)));
      lastSkew = skew;
    }
    const p = maxScroll > 0 ? Math.min(1, scrollY / maxScroll) : 0;
    const tc = timecode(Math.round(p * TOTAL_FRAMES));
    if (tc !== lastTc) { hudTc.textContent = tc; playhead.style.transform = `scaleX(${p})`; lastTc = tc; }
  };
}
