const BUILD = window.BUILD || String(Date.now());

function ensureCss(href){
  const id='css:'+href; if(document.getElementById(id)) return;
  const l=document.createElement('link'); l.id=id; l.rel='stylesheet';
  l.href = href + (href.includes('?')?'&':'?') + 'b='+BUILD;
  document.head.appendChild(l);
}
function setActive(route){
  document.querySelectorAll('[data-route]').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('data-route')===route);
  });
}
function route(){ return (location.hash.replace(/^#\/?/,'')||'parties').split('?')[0]; }

async function render(){
  const r = route(); setActive(r);
  const main = document.getElementById('main'); if(!main) return;
  main.innerHTML='';

  // Shared CSS
  ensureCss('/assets/css/cards.css');

  switch(r){
    case 'parties':  (await import('./views/parties.js?b='+BUILD)).renderParties(main); break;
    case 'calendar': ensureCss('/assets/css/calendar.css'); (await import('./calendar-view.js?b='+BUILD)).renderCalendar(main); break;
    case 'contacts': (await import('./views/contacts.js?b='+BUILD)).renderContacts(main); break;
    case 'invites':  (await import('./views/invites.js?b='+BUILD)).renderInvites(main); break;
    default:         (await import('./views/parties.js?b='+BUILD)).renderParties(main); break;
  }
}
addEventListener('hashchange', render);
addEventListener('load', render);
