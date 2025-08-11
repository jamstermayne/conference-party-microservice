// Simple focus trap + announce helper (pairs with toast.js live region)
let trapPrev = null, first, last;

export function trapFocus(container){
  releaseFocus();
  const focusables = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  first = focusables[0]; last = focusables[focusables.length-1];
  trapPrev = (e)=>{
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', trapPrev);
  first.focus();
}

export function releaseFocus(container){
  if (container && trapPrev) container.removeEventListener('keydown', trapPrev);
  trapPrev = null; first = null; last = null;
}

// Optional: announce utility, if you don't use the toast live region
export function announce(msg){
  let live = document.querySelector('.sr-live');
  if (!live){
    live = document.createElement('div');
    live.className = 'sr-live';
    live.setAttribute('role','status');
    live.setAttribute('aria-live','polite');
    live.setAttribute('aria-atomic','true');
    document.body.appendChild(live);
  }
  live.textContent = '';
  setTimeout(()=> live.textContent = msg, 40);
}

export default { trapFocus, releaseFocus, announce };