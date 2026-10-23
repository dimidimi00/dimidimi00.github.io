export function setupCursor(gsap) {
  if (!matchMedia('(hover: hover)').matches) return () => {};
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  const halo = document.getElementById('cursor-halo');
  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const dot = { ...target }, trail = { ...target }, glow = { ...target }, click = { s: 1 };

  addEventListener('pointermove', (e) => { target.x = e.clientX; target.y = e.clientY; halo.classList.add('is-on'); });
  document.documentElement.addEventListener('pointerleave', () => halo.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest('[data-cursor]');
    const text = el?.dataset.cursor || '';
    cursor.classList.toggle('has-label', !!text);
    if (text) label.textContent = text;
  });
  document.addEventListener('pointerdown', () => gsap.fromTo(click, { s: 0.5 }, { s: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: true }));

  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  return () => {
    if (Math.abs(target.x - glow.x) + Math.abs(target.y - glow.y) < 0.1 && click.s === 1) return;
    dot.x += (target.x - dot.x) * 0.25;
    dot.y += (target.y - dot.y) * 0.25;
    cursor.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
    const dx = target.x - trail.x, dy = target.y - trail.y;
    trail.x += dx * 0.12; trail.y += dy * 0.12;
    const speed = Math.min(Math.hypot(dx, dy), 200);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    ring.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) rotate(${angle}deg) scale(${(1 + speed / 160) * click.s}, ${(1 - speed / 500) * click.s})`;
    glow.x += (target.x - glow.x) * 0.07; glow.y += (target.y - glow.y) * 0.07;
    halo.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0)`;
  };
}
