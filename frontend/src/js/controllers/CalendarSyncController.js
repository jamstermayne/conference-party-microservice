// js/controllers/CalendarSyncController.js
import { Events } from '../events.js?v=b022';
import { Store }  from '../store.js?v=b022';
// Services you already have
// GCal.connect(), GCal.list(), ICS.subscribe(url), CalSync.syncNow({ window:'conference' })

export function CalendarSyncController(section){
  const btnGoogle = section.querySelector('#cs-google');
  const stGoogle  = section.querySelector('#cs-google-status');

  const icsInput  = section.querySelector('#cs-ics');
  const btnIcs    = section.querySelector('#cs-ics-sub');
  const stIcs     = section.querySelector('#cs-ics-status');

  const btnSkip   = section.querySelector('#cs-skip');
  const btnFinish = section.querySelector('#cs-finish');

  section.addEventListener('route:enter', ()=>{
    // reflect current state
    const cal = Store.get()?.calendar || {};
    if (cal.googleConnected) stGoogle.textContent = 'Google connected';
    if (cal.icsSubscribed)   stIcs.textContent    = 'ICS subscribed';
  });

  btnGoogle.addEventListener('click', onGoogleConnect);
  btnIcs.addEventListener('click', onIcsSub);
  btnSkip.addEventListener('click', onFinish);
  btnFinish.addEventListener('click', onFinish);

  async function onGoogleConnect(){
    try{
      await GCal.connect(); // your existing popup OAuth
      await CalSync.syncNow({ window:'conference' }); // process + merge
      const meta = Store.get()?.calendar?.meta || {};
      stGoogle.textContent = `Connected • ${meta.found||0} found • ${meta.matched||0} matched`;
      toast('Google Calendar connected');
      Events.emit('calendar.synced', { provider:'google' });
    }catch(e){
      toast('Google Calendar failed'); console.error(e);
    }
  }

  async function onIcsSub(){
    const url = (icsInput.value||'').trim();
    if (!url) return toast('Paste your Meet to Match .ics URL');
    try{
      await ICS.subscribe(url);
      await CalSync.pullICS(); // runs through syncNow pipeline
      const meta = Store.get()?.calendar?.meta || {};
      stIcs.textContent = `Subscribed • ${meta.found||0} found • ${meta.matched||0} matched`;
      toast('Meet to Match subscribed');
      Events.emit('calendar.synced', { provider:'ics' });
    }catch(e){
      toast('ICS subscription failed'); console.error(e);
    }
  }

  function onFinish(){
    // Strongest moment: parties saved + calendar synced → PWA install
    Events.emit('calendar.synced', { provider:'finish' });
    Events.emit('pwa.install.hint', { source:'post-sync' });
    // send them to Home or Events
    location.hash = '#/home';
  }
}

function toast(msg){
  const tpl = document.getElementById('tpl-toast');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.msg').textContent = msg;
  document.body.appendChild(node);
  setTimeout(()=> node.remove(), 1800);
}