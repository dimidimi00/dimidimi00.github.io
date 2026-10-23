const CHARS = '01<>/{}[]#*+=:;$%&?!';
const CW = 7, CH = 10, TILE = 210;

function pattern(color) {
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = `700 ${CH - 1}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textBaseline = 'top';
  for (let y = 0; y < TILE; y += CH) {
    for (let x = 0; x < TILE; x += CW) {
      if (Math.random() < 0.9) ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], x, y);
    }
  }
  return `url(${c.toDataURL()})`;
}

export function setupAsciiText() {
  const root = document.documentElement;
  root.style.setProperty('--ascii-dark', pattern('#111113'));
  root.style.setProperty('--ascii-light', pattern('#f4f2ee'));
  root.style.setProperty('--ascii-accent', pattern('#ff4f1f'));
  let y = 0, timer = null, users = 0;
  return {
    start() {
      if (users++ > 0) return;
      timer = setInterval(() => { y = (y + CH) % TILE; root.style.setProperty('--ascii-y', `${y}px`); }, 110);
    },
    stop() {
      if (users === 0 || --users > 0) return;
      clearInterval(timer);
      timer = null;
    },
  };
}
