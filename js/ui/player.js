export function setupPlayer(gsap, lenis) {
  const player = document.getElementById('player');
  const video = document.getElementById('player-video');
  const title = document.getElementById('player-title');
  const yt = document.getElementById('player-yt');
  let fromRect = null, open = false;

  const inset = (r, radius) => `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${radius}px)`;

  function show(trigger) {
    const preview = trigger.querySelector('video');
    fromRect = (trigger.querySelector('[data-gl]') || trigger).getBoundingClientRect();
    video.src = trigger.dataset.video;
    video.currentTime = preview?.currentTime || 0;
    video.muted = false;
    title.textContent = trigger.dataset.title || '';
    yt.href = trigger.dataset.href || '#';
    player.hidden = false;
    open = true;
    lenis?.stop();
    video.play().catch(() => {});
    gsap.fromTo(player, { clipPath: inset(fromRect, 22) }, { clipPath: inset({ top: 0, right: innerWidth, bottom: innerHeight, left: 0 }, 0), duration: 1.1, ease: 'expo.inOut' });
    gsap.fromTo('.player-bar', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, delay: 0.7, duration: 0.8, ease: 'expo.out' });
  }

  function hide() {
    if (!open) return;
    open = false;
    video.pause();
    gsap.to(player, {
      clipPath: inset(fromRect, 22), duration: 0.9, ease: 'expo.inOut',
      onComplete: () => { player.hidden = true; video.removeAttribute('src'); video.load(); lenis?.start(); },
    });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && !link.hasAttribute('data-player')) return;
    const trigger = e.target.closest('[data-player]');
    if (!trigger || !trigger.dataset.video) return;
    e.preventDefault();
    show(trigger);
  });
  document.getElementById('player-close').addEventListener('click', hide);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
}
