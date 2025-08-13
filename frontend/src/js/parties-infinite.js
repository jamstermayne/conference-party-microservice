// Simple infinite scroller for parties
import { eventCard, wireCardActions } from '/js/party-cards.js?v=b021';

const PAGE = 10;

export async function renderPartiesInfinite(container, events){
  container.innerHTML = `<div class="event-grid" id="event-grid"></div><div id="sentinel" style="height:1px"></div>`;
  const grid = container.querySelector('#event-grid');
  wireCardActions(container);

  let i = 0;
  function drawMore(){
    const next = events.slice(i, i+PAGE);
    if(!next.length) return;
    grid.insertAdjacentHTML('beforeend', next.map(eventCard).join(''));
    i += next.length;
  }
  drawMore();

  const io = new IntersectionObserver((entries)=>{
    if(entries.some(e=>e.isIntersecting)) drawMore();
  }, { rootMargin:'600px 0px' });
  io.observe(container.querySelector('#sentinel'));
}