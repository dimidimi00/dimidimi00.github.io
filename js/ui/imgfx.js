const RAMP = '01<>/{}[]#*+=:;';
const CELL_W = 7, CELL_H = 10;

function glyphLayer(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${CELL_H}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textBaseline = 'top';
  for (let y = 0; y < h; y += CELL_H) {
    for (let x = 0; x < w; x += CELL_W) {
      if (Math.random() < 0.82) ctx.fillText(RAMP[(Math.random() * RAMP.length) | 0], x, y);
    }
  }
  return c;
}

function cover(img, w, h) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  return [(iw - sw) / 2, (ih - sh) / 2, sw, sh];
}

export function setupImageFx() {
  const grid = document.getElementById('archive-grid');
  let mode = 'none', pixel = 8, timer = null, layers = null, frame = 0;
  const live = new Set();
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    en.isIntersecting ? live.add(en.target) : live.delete(en.target);
  }));

  const ensure = (img) => {
    let c = img.parentElement.querySelector('.tile-fx');
    if (!c) {
      c = document.createElement('canvas');
      c.className = 'tile-fx';
      c._img = img;
      img.after(c);
      io.observe(c);
    }
    return c;
  };

  const drawPixel = (c) => {
    const img = c._img, w = img.clientWidth, h = img.clientHeight;
    c.width = Math.max(1, Math.ceil(w / pixel));
    c.height = Math.max(1, Math.ceil(h / pixel));
    const ctx = c.getContext('2d');
    ctx.drawImage(img, ...cover(img, c.width, c.height), 0, 0, c.width, c.height);
  };

  const drawAscii = (c) => {
    const img = c._img, w = img.clientWidth, h = img.clientHeight;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d');
    const src = cover(img, w, h);
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(layers[frame % layers.length], 0, 0, w, h, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(img, ...src, 0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.globalAlpha = 0.3;
    ctx.drawImage(img, ...src, 0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d0d0f';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };

  const paint = () => {
    grid.querySelectorAll('.tile-media img').forEach((img) => {
      if (!img.complete || !img.naturalWidth) { img.addEventListener('load', paint, { once: true }); return; }
      const c = ensure(img);
      if (mode === 'pixel') drawPixel(c);
    });
  };

  const clear = () => {
    io.disconnect();
    live.clear();
    grid.querySelectorAll('.tile-fx').forEach((c) => c.remove());
  };

  new MutationObserver(() => { if (mode !== 'none') paint(); }).observe(grid, { childList: true });
  addEventListener('resize', () => { if (mode === 'pixel') paint(); });

  return {
    set(nextMode, nextPixel) {
      if (nextMode === mode && nextPixel === pixel) return;
      mode = nextMode; pixel = Math.max(2, nextPixel || 8);
      clearInterval(timer); timer = null;
      if (mode === 'none') { clear(); return; }
      paint();
      if (mode === 'ascii') {
        layers ??= [0, 1, 2, 3].map(() => glyphLayer(520, 520));
        timer = setInterval(() => { frame++; live.forEach((c) => { if (c._img.complete) drawAscii(c); }); }, 130);
      }
    },
  };
}
