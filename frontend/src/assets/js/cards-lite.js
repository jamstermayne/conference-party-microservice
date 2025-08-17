import { openICS, openGoogle } from './calendar-lite.js';

export function cardFor(ev){
  const article = document.createElement('article');
  article.className = 'card-modern card-modern--event';
  
  const dateObj = ev.date ? new Date(ev.date) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) : '';
  const timeStr = ev.time || '';
  const venue = ev.venue || '';
  const price = ev.price || '';
  
  article.innerHTML = `
    ${price ? `
      <span class="card-modern__badge ${price.toLowerCase() === 'free' ? 'card-modern__badge--free' : ''}">
        ${price}
      </span>
    ` : ''}
    
    <header class="card-modern__header">
      <div class="card-modern__eyebrow">
        <span>${dateStr}</span>
        ${timeStr ? `<span>•</span><span>${timeStr}</span>` : ''}
      </div>
      <h3 class="card-modern__title">${ev.title || 'Party'}</h3>
      ${venue ? `<p class="card-modern__subtitle">${venue}</p>` : ''}
    </header>
    
    ${ev.description ? `
      <div class="card-modern__body">
        <p class="card-modern__description">${ev.description}</p>
      </div>
    ` : ''}
    
    <footer class="card-modern__footer">
      <button class="card-modern__action card-modern__action--primary" data-action="cal-ics">
        Add to Calendar
      </button>
      <button class="card-modern__action card-modern__action--secondary" data-action="cal-google">
        Google
      </button>
    </footer>
  `;
  
  article.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a) return;
    if (a.dataset.action === 'cal-ics') openICS(ev);
    if (a.dataset.action === 'cal-google') openGoogle(ev);
  }, { passive: true });
  
  return article;
}
