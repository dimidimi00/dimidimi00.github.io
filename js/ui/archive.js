const VERTICAL = new Set(['campaigns', 'ai']);

function tile([client, title, href, image], kind) {
  const tag = href ? 'a' : 'div';
  const attrs = href ? ` href="${href}" target="_blank" rel="noreferrer" data-cursor="Open"` : kind === 'ai' ? ' role="button" tabindex="0" data-cursor="View"' : '';
  const media = image
    ? `<div class="tile-media"><img src="${image}" alt="${client} - ${title}" loading="lazy" decoding="async"><span class="tile-shine"></span></div>`
    : `<div class="tile-media tile-code">&lt;/&gt;<span class="tile-shine"></span></div>`;
  return `<${tag} class="tile" data-kind="${kind}"${attrs}>${media}<div><h4>${client}</h4><p>${title}</p></div></${tag}>`;
}

const KIND = { video: 'video projects', campaigns: 'campaigns', web: 'web builds', ai: 'AI designs' };

export function setupArchive(archive, gsap, ScrollTrigger) {
  const grid = document.getElementById('archive-grid');
  const more = document.getElementById('archive-more');
  const tabs = document.querySelectorAll('[data-tab]');
  let key = 'video', expanded = false, first = true;

  const count = document.getElementById('archive-count');
  const kind = document.getElementById('archive-kind');
  const columns = () => getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  let cols = 0;

  const render = (fromIndex = 0) => {
    const items = archive[key];
    grid.classList.toggle('is-vertical', VERTICAL.has(key));
    cols = columns();
    const shown = expanded ? items : items.slice(0, cols);
    grid.innerHTML = shown.map((item) => tile(item, key)).join('');
    more.hidden = expanded || items.length <= cols;
    count.textContent = items.length;
    kind.textContent = KIND[key];
    const tiles = [...grid.children].slice(fromIndex);
    gsap.from(tiles, {
      y: 120, rotateX: -40, opacity: 0, transformOrigin: '50% 0%', duration: 1.2, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: first ? { trigger: grid, start: 'top 85%' } : undefined,
    });
    first = false;
    ScrollTrigger.refresh();
  };

  tabs.forEach((btn) => btn.addEventListener('click', () => {
    tabs.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    key = btn.dataset.tab;
    render();
  }));
  more.addEventListener('click', () => { expanded = true; render(cols); });
  addEventListener('resize', () => { if (!expanded && columns() !== cols) render(); });
  render();
}
