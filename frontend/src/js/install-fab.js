(function(){
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(isStandalone) return;
  const wrap = document.createElement('div');
  wrap.className = 'float-install';
  wrap.innerHTML = `<a class="fab btn" href="/install">Get the app</a>`;
  document.addEventListener('DOMContentLoaded', ()=> document.body.appendChild(wrap));
})();