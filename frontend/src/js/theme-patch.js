(function(){
  function upgrade(){
    const root = document.getElementById('main'); if(!root) return;

    // Promote common legacy cards to hero cards
    root.querySelectorAll('article.card, .card, .profile-card, [data-card]').forEach(el=>{
      if(!el.classList.contains('vcard')) el.classList.add('vcard');
      // Try to create hero head/title if missing
      if(!el.querySelector('.vcard__head')){
        const title = el.querySelector('h2,h3,.title,.card-title');
        if(title){
          const head = document.createElement('div'); head.className='vcard__head';
          const t = document.createElement('div'); t.className='vcard__title'; t.textContent = title.textContent.trim();
          const badges = document.createElement('div'); badges.className='vcard__badges';
          head.appendChild(t); head.appendChild(badges);
          title.replaceWith(head);
        }
      }
      // Meta rows
      if(!el.querySelector('.vmeta')){
        const metaEl = el.querySelector('.meta,.subtitle,.subhead');
        if(metaEl){
          const m = document.createElement('div'); m.className='vmeta'; m.textContent = metaEl.textContent.trim();
          metaEl.replaceWith(m);
        }
      }
      // Actions → buttons
      el.querySelectorAll('a.btn, button.btn').forEach(b=>{
        b.classList.add('vbtn');
        const txt = (b.textContent||'').toLowerCase();
        if(/save|add|create|sync|invite|connect|today|redeem|copy/.test(txt)) b.classList.add('primary');
      });
      if(!el.querySelector('.vactions')){
        const acts = el.querySelector('.card-actions,.actions'); if(acts){ acts.classList.add('vactions'); }
      }
    });

    // Calendar: ensure hour rows adopt the unified height
    document.documentElement.style.setProperty('--hour-height', getComputedStyle(document.documentElement).getPropertyValue('--hour-height') || '240px');
  }
  window.addEventListener('DOMContentLoaded', upgrade);
  window.addEventListener('hashchange', () => setTimeout(upgrade,0));
})();
