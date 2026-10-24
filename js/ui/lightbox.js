export function setupLightbox(gsap, lenis, images) {
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const count = document.getElementById('lightbox-count');
  const grid = document.getElementById('archive-grid');
  let index = 0, open = false, from = null;

  const inset = (r, radius) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${radius}px)`;
  const pad = (n) => String(n).padStart(2, '0');

  const showAt = (i, dir = 0) => {
    index = (i + images.length) % images.length;
    img.src = images[index];
    img.alt = `AI @ Work - Static design ${pad(index + 1)}`;
    count.textContent = `AI @ Work  ${pad(index + 1)} / ${pad(images.length)}`;
    if (dir) gsap.fromTo(img, { x: dir * 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
  };

  const show = (tile) => {
    const i = [...grid.children].indexOf(tile);
    if (i < 0) return;
    from = tile.querySelector('.tile-media').getBoundingClientRect();
    showAt(i);
    box.hidden = false;
    open = true;
    lenis?.stop();
    gsap.fromTo(box, { clipPath: inset(from, 18) }, { clipPath: inset({ top: 0, right: innerWidth, bottom: innerHeight, left: 0 }, 0), duration: 1, ease: 'expo.inOut' });
    gsap.fromTo(box.querySelectorAll('.player-bar, .lightbox-nav'), { opacity: 0 }, { opacity: 1, delay: 0.6, duration: 0.6 });
  };

  const hide = () => {
    if (!open) return;
    open = false;
    const tile = grid.children[index];
    const to = tile?.querySelector('.tile-media')?.getBoundingClientRect() || from;
    gsap.to(box, {
      clipPath: inset(to, 18), duration: 0.8, ease: 'expo.inOut',
      onComplete: () => { box.hidden = true; img.removeAttribute('src'); lenis?.start(); },
    });
  };

  grid.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile[data-kind="ai"]');
    if (tile) show(tile);
  });
  grid.addEventListener('keydown', (e) => {
    const tile = e.target.closest('.tile[data-kind="ai"]');
    if (tile && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(tile); }
  });
  document.getElementById('lightbox-close').addEventListener('click', hide);
  document.getElementById('lightbox-prev').addEventListener('click', () => showAt(index - 1, -1));
  document.getElementById('lightbox-next').addEventListener('click', () => showAt(index + 1, 1));
  box.addEventListener('click', (e) => { if (e.target === box) hide(); });
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') showAt(index - 1, -1);
    if (e.key === 'ArrowRight') showAt(index + 1, 1);
  });
  let sx = null;
  box.addEventListener('pointerdown', (e) => { sx = e.clientX; });
  box.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) showAt(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
}
