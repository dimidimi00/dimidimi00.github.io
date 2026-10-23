export function setupDebug(stage) {
  const root = document.documentElement;
  const stats = document.createElement('div');
  stats.className = 'dbg-stats mono';
  stats.setAttribute('aria-hidden', 'true');
  const box = document.createElement('div');
  box.className = 'dbg-box';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<span class="mono"></span>';
  const label = box.firstElementChild;
  document.body.append(stats, box);

  let on = false, target = null, lastStats = 0;
  addEventListener('pointermove', (e) => { if (on) target = e.target; });

  const set = (value) => {
    on = value;
    root.classList.toggle('fx-debug', on);
    stage?.setWireframe(on);
    if (!on) target = null;
  };

  const describe = (el) => {
    const cls = [...el.classList].slice(0, 2).map((c) => `.${c}`).join('');
    const id = el.id ? `#${el.id}` : '';
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };

  const tick = (vel, scrollY, maxScroll) => {
    if (!on) return;
    const now = performance.now();
    if (now - lastStats > 250) {
      lastStats = now;
      const info = stage?.renderer.info.render;
      stats.textContent = [
        `fps     ${stage ? Math.round(1000 / stage.frameMs) : '-'}`,
        `dpr     ${stage ? stage.dpr.toFixed(2) : '-'}`,
        `draws   ${info ? info.calls : '-'}`,
        `tris    ${info ? `${(info.triangles / 1000).toFixed(1)}k` : '-'}`,
        `scroll  ${Math.round(scrollY)} / ${Math.round(maxScroll)}`,
        `vel     ${vel.toFixed(1)}`,
        `theme   ${root.dataset.theme}`,
      ].join('\n');
    }
    const el = target && !target.closest('.config, .dbg-stats') ? target : null;
    box.style.opacity = el ? '1' : '0';
    if (!el) return;
    const r = el.getBoundingClientRect();
    box.style.transform = `translate(${r.left}px, ${r.top}px)`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
    label.textContent = `${describe(el)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
  };

  return { set, tick };
}
