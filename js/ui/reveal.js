const make = (cls) => { const s = document.createElement('span'); s.className = cls; return s; };

export function splitText() {
  document.querySelectorAll('[data-split] .line').forEach((line) => {
    const frag = document.createDocumentFragment();
    [...line.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const w = make('w');
          w.textContent = part;
          frag.append(w);
        });
      } else {
        const w = make('w');
        w.append(node);
        frag.append(w);
      }
    });
    line.replaceChildren(frag);
  });
}

function charsify(node) {
  const frag = document.createDocumentFragment();
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(' ');
        const w = make('w');
        for (const c of part) { const ch = make('ch'); ch.textContent = c; w.append(ch); }
        frag.append(w);
      });
    } else {
      const clone = child.cloneNode(false);
      clone.append(charsify(child));
      frag.append(clone);
    }
  }
  return frag;
}

export function splitChars() {
  document.querySelectorAll('[data-chars] .line, [data-footer-name]').forEach((el) => el.replaceChildren(charsify(el)));
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_*<>';
export function scramble(el, duration = 0.6) {
  const text = (el.dataset.text ??= el.textContent);
  const start = performance.now();
  cancelAnimationFrame(el._scramble);
  const step = (now) => {
    const p = Math.min(1, (now - start) / (duration * 1000));
    const fixed = Math.floor(p * text.length);
    let out = text.slice(0, fixed);
    for (let i = fixed; i < text.length; i++) out += /\s/.test(text[i]) ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    el.textContent = out;
    if (p < 1) el._scramble = requestAnimationFrame(step);
  };
  el._scramble = requestAnimationFrame(step);
}

export function setupReveals(gsap, ScrollTrigger) {
  gsap.set('[data-split] .w', { yPercent: 115, rotate: 4 });
  gsap.set('[data-reveal]', { y: 50, opacity: 0 });
  gsap.set('.intro-title .ch', { yPercent: 120, rotateX: -110, opacity: 0 });
  document.querySelectorAll('.intro-title .ch').forEach((ch) => ch.classList.add('ascii-fill'));

  document.querySelectorAll('[data-split]').forEach((el) => {
    gsap.to(el.querySelectorAll('.w'), {
      yPercent: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.closest('.intro')) return;
    gsap.to(el, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.addEventListener('pointerenter', () => scramble(el, 0.45));
    if (!el.closest('.nav')) ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el, 1) });
  });

  document.querySelectorAll('.intro-title .ch').forEach((ch) => {
    ch.addEventListener('pointerenter', () => {
      if (gsap.isTweening(ch)) return;
      gsap.timeline()
        .to(ch, { yPercent: -28, rotate: gsap.utils.random(-14, 14), color: '#ff4f1f', duration: 0.25, ease: 'power2.out' })
        .to(ch, { yPercent: 0, rotate: 0, color: '', duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    });
  });
}

export function playIntro(gsap, lines, ascii) {
  const tl = gsap.timeline();
  const chars = gsap.utils.toArray('.intro-title .ch');
  ascii?.start();
  const decodeAt = 1.05, step = 0.045;
  chars.forEach((ch, i) => tl.call(() => ch.classList.remove('ascii-fill'), null, decodeAt + i * step));
  tl.call(() => ascii?.stop(), null, decodeAt + chars.length * step + 0.5);
  tl.to(chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.5, ease: 'expo.out', stagger: 0.028 }, 0)
    .to('.intro [data-reveal]', { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.5)
    .to('.nav', { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0.2)
    .from('.marquee', { opacity: 0, yPercent: 100, duration: 1.2, ease: 'expo.out' }, 0.7)
    .add(() => document.querySelectorAll('.intro [data-scramble]').forEach((el) => scramble(el, 1.2)), 0.4);
  if (lines) tl.to(lines, { reveal: 1, duration: 2.6, ease: 'expo.inOut' }, 0);
  return tl;
}
