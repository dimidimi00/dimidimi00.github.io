import { timecode } from './loader.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function setupHoverScrub() {
  if (!matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll('.project-media').forEach((media) => {
    const video = media.querySelector('video');
    const line = media.querySelector('.scrub-line');
    const tc = media.querySelector('.scrub-tc');
    let pending = null;
    const flush = () => {
      if (pending === null || video.seeking) return;
      video.currentTime = pending;
      pending = null;
    };
    video.addEventListener('seeked', flush);

    media.addEventListener('pointerenter', () => { media.classList.add('is-scrubbing'); video.pause(); });
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      const f = clamp((e.clientX - r.left) / r.width, 0, 1);
      line.style.left = `${f * 100}%`;
      if (!video.duration) return;
      pending = f * video.duration;
      tc.textContent = `${timecode(Math.floor(pending * 25))} · click to play`;
      flush();
    });
    media.addEventListener('pointerleave', () => { media.classList.remove('is-scrubbing'); video.play().catch(() => {}); });
  });
}
