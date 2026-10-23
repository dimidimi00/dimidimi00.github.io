const pad = (n) => String(n).padStart(2, '0');

export function timecode(frames) {
  const ff = frames % 25, s = Math.floor(frames / 25);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(ff)}`;
}

const CMD = 'generate portfolio --style "engineered to perform"';
const RAIN = '01<>/{}[]#*+=$%&;:';
const SPIN = '|/-\\';

function startRain(canvas) {
  const ctx = canvas.getContext('2d');
  const size = 16;
  let w, h, drops, raf, last = 0;
  const resize = () => {
    w = canvas.width = innerWidth; h = canvas.height = innerHeight;
    drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -40);
    ctx.font = `700 ${size - 2}px ui-monospace, Menlo, Consolas, monospace`;
  };
  resize();
  addEventListener('resize', resize);
  const frame = (t) => {
    raf = requestAnimationFrame(frame);
    if (t - last < 33) return;
    last = t;
    ctx.fillStyle = 'rgba(5, 5, 5, 0.14)';
    ctx.fillRect(0, 0, w, h);
    drops.forEach((y, i) => {
      ctx.fillStyle = Math.random() < 0.08 ? '#ffffff' : '#9a9ba3';
      ctx.fillText(RAIN[(Math.random() * RAIN.length) | 0], i * size, y * size);
      drops[i] = y * size > h && Math.random() > 0.97 ? 0 : y + 1;
    });
  };
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); };
}

export function runLoader({ gsap, tasks = [], sys = '', fillTime = 1.1, maxTime = 8 }) {
  const loader = document.getElementById('loader');
  const cmd = document.getElementById('term-cmd');
  const caret = document.getElementById('term-caret');
  const log = document.getElementById('term-log');
  const end = document.getElementById('term-end');
  const bar = document.getElementById('term-bar');
  const pct = document.getElementById('term-pct');
  const clock = document.getElementById('term-clock');
  document.getElementById('term-sys').textContent = sys;
  const stopRain = startRain(document.getElementById('loader-rain'));
  const start = performance.now();
  const print = (el) => el.classList.add('is-printed');

  const reserve = (list, n) => Array.from({ length: n }, () => list.appendChild(Object.assign(document.createElement('li'), { innerHTML: '&nbsp;' })));
  const slots = reserve(log, tasks.length + 2);
  const endSlots = reserve(end, 2);
  let next = 0;
  const line = (html) => { const li = slots[next++]; li.innerHTML = html; return li; };
  const okRow = (r) => { r.li.innerHTML = `<b>[ ok ]</b> ${r.label}`; };
  const rows = tasks.map((t) => {
    const row = { label: t.label, done: false, li: null };
    Promise.resolve(t.promise).then(() => { row.done = true; if (row.li) okRow(row); });
    return row;
  });

  let cells = 28;
  const measure = () => {
    const probe = Object.assign(document.createElement('span'), { textContent: '█'.repeat(20) });
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    bar.append(probe);
    const cw = probe.getBoundingClientRect().width / 20;
    probe.remove();
    cells = Math.max(10, Math.floor(bar.getBoundingClientRect().width / cw) - 2);
  };
  measure();
  addEventListener('resize', measure);

  const GAP = 0.12, TYPE_AT = 0.45, CHAR = 0.032;
  const typeEnd = TYPE_AT + CMD.length * CHAR;
  const logLines = [
    () => line('<b>[ ok ]</b> booting portfolio v2.8'),
    () => line('<b>[ ok ]</b> resolving modules: three@0.169 · gsap@3.12 · lenis@1.1'),
    ...rows.map((r) => () => { r.li = line(`<span class="wait">[ ${SPIN[0]} ]</span> ${r.label}`); if (r.done) okRow(r); }),
  ];
  const steps = [
    [0.05, () => print(loader.querySelector('.term'))],
    [0.05 + GAP * 1.5, () => print(loader.querySelector('.term-cmd'))],
    ...logLines.map((fn, i) => [typeEnd + 0.18 + i * GAP, fn]),
    [typeEnd + 0.18 + logLines.length * GAP, () => { print(loader.querySelector('.term-progress')); print(loader.querySelector('.term-foot')); }],
  ];
  const barAt = steps[steps.length - 1][0];

  let step = 0, typed = 0, shown = 0, spin = 0, fullAt = 0;
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      while (step < steps.length && elapsed >= steps[step][0]) steps[step++][1]();
      const nextTyped = Math.min(CMD.length, Math.max(0, Math.floor((elapsed - TYPE_AT) / CHAR)));
      if (nextTyped !== typed) { typed = nextTyped; cmd.textContent = CMD.slice(0, typed); }
      spin++;
      rows.forEach((r) => { if (r.li && !r.done) r.li.firstElementChild.textContent = `[ ${SPIN[(spin >> 2) % 4]} ]`; });
      const real = rows.length ? rows.filter((r) => r.done).length / rows.length : 1;
      const fill = elapsed < barAt ? 0 : (elapsed - barAt) / fillTime;
      const target = elapsed > maxTime ? 1 : Math.min(real, fill, 1);
      shown += (target - shown) * 0.16;
      if (target === 1 && shown > 0.995) shown = 1;
      if (shown === 1 && !fullAt) fullAt = elapsed;
      const filled = Math.round(shown * cells);
      bar.textContent = `[${'█'.repeat(filled)}${'░'.repeat(cells - filled)}]`;
      pct.textContent = `${Math.round(shown * 100)}%`;
      clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
      if (!fullAt || step < steps.length || elapsed < fullAt + 0.3) return requestAnimationFrame(tick);

      rows.forEach((r) => { if (!r.done) r.li.innerHTML = `<span class="wait">[skip]</span> ${r.label}`; });
      removeEventListener('resize', measure);
      endSlots[0].innerHTML = `<b>[ ok ]</b> rendered in ${fullAt.toFixed(2)}s`;
      const word = 'launch';
      const typedLaunch = { n: 0 };
      gsap.timeline({ onComplete: () => { stopRain(); resolve(); } })
        .call(() => {
          endSlots[1].innerHTML = '<span class="term-prompt">&gt;</span> <span class="term-launch"></span>';
          endSlots[1].append(caret);
        }, null, 0.25)
        .to(typedLaunch, {
          n: word.length, duration: word.length * 0.055, ease: 'none',
          onUpdate: () => { endSlots[1].querySelector('.term-launch').textContent = word.slice(0, Math.round(typedLaunch.n)); },
        }, 0.35)
        .to('#loader .term, #loader .term-foot, #loader-rain', { opacity: 0, duration: 0.25 }, '+=0.35')
        .to(loader, { scaleY: 0.004, backgroundColor: '#f4f2ee', duration: 0.36, ease: 'power4.in' })
        .to(loader, { scaleX: 0, duration: 0.26, ease: 'power4.in' })
        .set(loader, { display: 'none' });
    };
    tick();
  });
}
