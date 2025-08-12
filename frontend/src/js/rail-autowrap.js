// Adds .section-rail to all main sections so the rail can appear.
// Safe to run multiple times.
function applyRailWrapper(){
  const main = document.querySelector('main');
  if (!main) return;
  main.querySelectorAll('section[id^="view-"]').forEach(sec=>{
    sec.classList.add('section-rail');
  });
}
document.addEventListener('DOMContentLoaded', applyRailWrapper);
export {}; // keep as ESM