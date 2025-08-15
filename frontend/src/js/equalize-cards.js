// Equalize heights by setting a CSS var --card-h (used only if content variance > 8px)
export function equalizeCards(sel = '.vcard, .card'){
  const cards = Array.from(document.querySelectorAll(sel));
  if (!cards.length) return;

  // clear previous
  document.documentElement.style.removeProperty('--card-h');
  cards.forEach(c => (c.style.height = ''));

  const heights = cards.map(c => c.getBoundingClientRect().height);
  const maxH = Math.max(...heights), minH = Math.min(...heights);

  if (maxH - minH > 8) {                 // only clamp if visibly uneven
    document.documentElement.style.setProperty('--card-h', `${maxH}px`);
    cards.forEach(c => (c.style.height = `var(--card-h)`));
  }
}

export function observeEqualize(sel = '.vcard, .card'){
  const ro = new ResizeObserver(() => equalizeCards(sel));
  window.addEventListener('load', () => {
    equalizeCards(sel);
    document.querySelectorAll(sel).forEach(c => ro.observe(c));
  });
  window.addEventListener('resize', () => equalizeCards(sel));
}