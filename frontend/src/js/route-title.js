export function setTitles(routeName){
  const pretty = String(routeName||'parties').replace(/^#?/,'');
  document.title = `Velocity — ${pretty}`;
  const chip = document.querySelector('[data-route-chip]');
  if(chip) chip.textContent = `#${pretty}`;
}