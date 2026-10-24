import { timecode } from './loader.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function setupTimeline(video) {
  const el = document.getElementById('timeline');
  const ruler = document.getElementById('tl-ruler');
  const v1 = document.getElementById('tl-v1');
  const a1 = document.getElementById('tl-a1');
  const head = document.getElementById('tl-playhead');
  let clips = [], bars = [], activeClip = -1, played = -1, laneW = 0;
  const measure = () => { laneW = v1.clientWidth; };
  const marks = () => {
    const d = video.duration || 40;
    const w = v1.clientWidth || 600;
    const step = [5, 10, 15, 30, 60].find((s) => (s / d) * w >= 58) || 120;
    let html = '';
    for (let t = 0; t <= d - step * 0.6; t += step) html += `<span style="left:${(t / d) * 100}%">${timecode(Math.round(t * 25)).slice(3, 8)}</span>`;
    ruler.innerHTML = html;
  };
  addEventListener('resize', () => { measure(); marks(); });

  const build = () => {
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    marks();

    let at = 0, html = '';
    clips = [];
    while (at < 0.999) {
      const w = Math.min(1 - at, 0.05 + rand() * 0.1);
      clips.push([at, at + w]);
      html += `<span class="tl-clip" style="left:${at * 100}%;width:${w * 100}%"><em>CLIP_${String(clips.length).padStart(2, '0')}</em></span>`;
      at += w;
    }
    v1.innerHTML = html;
    a1.innerHTML = Array.from({ length: 150 }, () => `<i style="height:${16 + Math.pow(rand(), 1.4) * 84}%"></i>`).join('');
    bars = [...a1.children];
    activeClip = played = -1;
  };
  build();
  video.addEventListener('loadedmetadata', build);

  let scrubbing = false;
  const seek = (e) => {
    const r = v1.getBoundingClientRect();
    if (video.duration) video.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * video.duration;
  };
  el.addEventListener('pointerdown', (e) => {
    scrubbing = true;
    el.setPointerCapture(e.pointerId);
    video.pause();
    seek(e);
  });
  el.addEventListener('pointermove', (e) => { if (scrubbing) seek(e); });
  const end = () => { if (!scrubbing) return; scrubbing = false; video.play().catch(() => {}); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  return () => {
    if (!video.duration) return;
    const f = video.currentTime / video.duration;
    if (!laneW) measure();
    head.style.transform = `translateX(${f * laneW}px)`;
    const c = clips.findIndex(([a, b]) => f >= a && f < b);
    if (c !== activeClip) {
      v1.children[activeClip]?.classList.remove('is-active');
      v1.children[c]?.classList.add('is-active');
      activeClip = c;
    }
    const n = Math.floor(f * bars.length);
    if (n !== played) {
      bars.forEach((b, i) => b.classList.toggle('is-played', i < n));
      played = n;
    }
  };
}
