// events-empty-state.js — skeleton + empty-state helpers
import { emptyState as _emptyState } from '/js/ui-feedback.js?v=b022';

function emptyState(message = 'No events yet.') {
  if (typeof _emptyState === 'function') return _emptyState(message);
  const el = document.createElement('div');
  el.className = 'empty-card';
  el.innerHTML = `<strong>${message}</strong><div class="text-caption" style="margin-top:6px">Try changing filters or check back soon.</div>`;
  return el;
}

export function paintSkeleton(container, count = 6) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const card = document.createElement('article');
    card.className = 'event-skeleton';
    card.innerHTML = `
      <div class="skel-line" style="width: 60%"></div>
      <div class="skel-line" style="width: 40%"></div>
      <div class="skel-chip" style="position: relative;"></div>
    `;
    frag.appendChild(card);
  }
  container.replaceChildren(frag);
}

export function paintEmpty(container, message = 'No parties found for today.') {
  container.replaceChildren(emptyState(message));
}