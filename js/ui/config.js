const SPEC = {
  ascii: { type: 'bool', def: false, comment: 'letters filled with living code' },
  pixel: { type: 'bool', def: false, comment: 'pixelate 3D, marquee and timeline' },
  crt: { type: 'bool', def: false, comment: 'amber terminal monitor' },
  debug: { type: 'bool', def: false, comment: 'developer view' },
};
const KEYS = Object.keys(SPEC);
const defaults = () => Object.fromEntries(KEYS.map((k) => [k, SPEC[k].def]));
const clampTo = (spec, v) => Math.round(Math.min(spec.max, Math.max(spec.min, v)));

function fromHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const out = {};
  for (const k of KEYS) {
    if (!params.has(k)) continue;
    out[k] = SPEC[k].type === 'bool' ? params.get(k) === '1' : clampTo(SPEC[k], Number(params.get(k)) || 0);
  }
  return out;
}

export function setupConfig(gsap, apply) {
  const settings = { ...defaults(), ...fromHash() };
  const panel = document.createElement('aside');
  panel.className = 'config mono';
  panel.id = 'config';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Remix this site');

  const line = (n, html) => `<div class="cl"><span class="ln">${n}</span><span>${html}</span></div>`;
  const token = (k) => SPEC[k].type === 'bool'
    ? `<button class="tok bool" type="button" data-key="${k}" aria-pressed="${settings[k]}">${settings[k]}</button>`
    : `<button class="nudge" type="button" data-nudge="-1" data-for="${k}" aria-label="Decrease ${k}">◂</button><button class="tok num" type="button" data-key="${k}" aria-label="${k}, drag to change">${settings[k]}</button><button class="nudge" type="button" data-nudge="1" data-for="${k}" aria-label="Increase ${k}">▸</button>`;
  panel.innerHTML = `
    <header class="config-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="config-title">site.config.js</span><span>remix this site</span><button class="config-close" type="button" aria-label="Close">✕</button></header>
    <div class="config-code">
      ${line(1, '<span class="cm">// click true / false to remix the site</span>')}
      ${line(2, '<span class="kw">const</span> site = {')}
      ${KEYS.map((k, i) => line(i + 3, `  <span class="key">${k}</span>: ${token(k)},  <span class="cm">// ${SPEC[k].comment}</span>`)).join('')}
      ${line(KEYS.length + 3, '};')}
    </div>
    <footer class="config-actions"><button type="button" data-act="reset">reset()</button><button type="button" data-act="share">share()</button><span class="config-msg" aria-live="polite"></span></footer>`;
  document.body.append(panel);

  const msg = panel.querySelector('.config-msg');
  const render = () => panel.querySelectorAll('[data-key]').forEach((t) => {
    t.textContent = String(settings[t.dataset.key]);
    if (SPEC[t.dataset.key].type === 'bool') t.setAttribute('aria-pressed', String(settings[t.dataset.key]));
  });
  const update = () => { render(); apply(settings); };
  const setNum = (k, v) => { settings[k] = clampTo(SPEC[k], v); update(); };

  panel.querySelectorAll('.tok.bool').forEach((t) => t.addEventListener('click', () => {
    settings[t.dataset.key] = !settings[t.dataset.key];
    update();
  }));
  panel.querySelectorAll('.nudge').forEach((b) => b.addEventListener('click', () => {
    setNum(b.dataset.for, settings[b.dataset.for] + Number(b.dataset.nudge) * 2);
  }));

  panel.querySelectorAll('.tok.num').forEach((t) => {
    const k = t.dataset.key;
    let startX = 0, startV = 0;
    t.addEventListener('pointerdown', (e) => {
      startX = e.clientX; startV = settings[k];
      t.setPointerCapture(e.pointerId);
      t.classList.add('is-drag');
    });
    t.addEventListener('pointermove', (e) => { if (t.classList.contains('is-drag')) setNum(k, startV + (e.clientX - startX) / 6); });
    const end = () => t.classList.remove('is-drag');
    t.addEventListener('pointerup', end);
    t.addEventListener('pointercancel', end);
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setNum(k, settings[k] + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setNum(k, settings[k] - 1); }
    });
  });

  panel.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'reset') { Object.assign(settings, defaults()); update(); history.replaceState(null, '', location.pathname); msg.textContent = 'defaults restored'; }
    if (act === 'share') {
      const changed = KEYS.filter((k) => settings[k] !== SPEC[k].def).map((k) => `${k}=${SPEC[k].type === 'bool' ? 1 : settings[k]}`);
      const url = `${location.origin}${location.pathname}${changed.length ? `#${changed.join('&')}` : ''}`;
      try { await navigator.clipboard.writeText(url); msg.textContent = 'link copied ✓'; } catch { msg.textContent = url; }
    }
  });

  const listeners = [];
  const open = () => {
    if (!panel.hidden) return;
    panel.hidden = false;
    msg.textContent = '';
    listeners.forEach((f) => f());
    gsap.fromTo(panel, { y: 40, opacity: 0, scale: 0.96, rotateX: 8 }, { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.7, ease: 'expo.out', transformPerspective: 900 });
  };
  const close = () => {
    if (panel.hidden) return;
    gsap.to(panel, { y: 24, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { panel.hidden = true; } });
  };
  panel.querySelector('.config-close').addEventListener('click', close);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-config]')) { e.preventDefault(); open(); } });
  addEventListener('keydown', (e) => {
    if (e.key === '`') { e.preventDefault(); panel.hidden ? open() : close(); }
    if (e.key === 'Escape') close();
  });

  apply(settings);
  if (KEYS.some((k) => settings[k] !== SPEC[k].def)) open();
  return { settings, onOpen: (f) => listeners.push(f) };
}

export function setupRemixHint(config) {
  const btn = document.getElementById('nav-remix');
  let seen = false;
  try { seen = sessionStorage.getItem('remix-seen') === '1'; } catch {  }
  if (seen || !btn) return;
  const hint = document.createElement('div');
  hint.className = 'remix-hint';
  hint.textContent = 'psst, you can remix this site ↗';
  document.body.append(hint);
  const place = () => {
    const r = btn.getBoundingClientRect();
    hint.style.left = `${Math.max(8, r.right - hint.offsetWidth)}px`;
    hint.style.top = `${r.bottom + 12}px`;
  };
  let gone = false;
  const hide = () => { if (gone) return; gone = true; hint.classList.remove('is-on'); setTimeout(() => hint.remove(), 600); };
  addEventListener('scroll', () => { if (scrollY > 150) hide(); }, { passive: true });
  config.onOpen(() => { try { sessionStorage.setItem('remix-seen', '1'); } catch {  } hide(); });
  setTimeout(() => { place(); hint.classList.add('is-on'); }, 3500);
  setTimeout(hide, 10500);
}
