import Store from '/js/store.js';
import Events from '/assets/js/events.js';

function googleConnected(){ return !!Store.get('calendar.googleConnected'); }
function emailConnected(){ return !!Store.get('calendar.emailConnected'); }

function authRow(){
  const g = googleConnected();
  const e = emailConnected();
  return `
    <div class="section-card">
      <div class="left-accent"></div>
      <h3 class="text-heading">Connect Calendars</h3>
      <div class="actions" style="margin:10px 0;">
        <button class="btn ${g?'':'btn-primary'}" data-action="connect-google">${g?'Google Connected':'Connect Google (MeetToMatch)'}</button>
        <button class="btn ${e?'':'btn-primary'}" data-action="connect-email">${e?'Email Connected':'Connect Email (ICS import)'}</button>
      </div>
      <div class="text-secondary">We'll keep your saved parties in sync.</div>
    </div>`;
}

function dayStrip(){
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const i = new Date().getDay();
  return `
    <div class="section-card">
      <div class="left-accent"></div>
      <div class="actions">
        ${days.map((d,idx)=>`<button class="btn ${idx===i?'btn-primary':''}" data-day="${idx}">${d}</button>`).join('')}
      </div>
    </div>`;
}

export async function renderCalendar(rootEl){
  const root = rootEl || document.getElementById('app'); if(!root) return;
  root.innerHTML = authRow() + dayStrip();

  root.querySelector('[data-action="connect-google"]').addEventListener('click', ()=>{
    if(!window.__ENV?.GOOGLE_CLIENT_ID){ Events.emit?.('ui:toast',{message:'Google client ID missing'}); return; }
    // Hook into your existing auth module
    document.dispatchEvent(new CustomEvent('calendar:connect:google'));
  });
  root.querySelector('[data-action="connect-email"]').addEventListener('click', ()=>{
    document.dispatchEvent(new CustomEvent('calendar:connect:email'));
  });

  root.addEventListener('click', (e)=>{
    const d = e.target?.dataset?.day;
    if(d){ Store.patch('calendar.day', Number(d)); }
  });
}