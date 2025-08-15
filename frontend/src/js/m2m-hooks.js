import * as M2M from "/js/services/m2m.js?v=b036";

const busy = { v:false };
function setBusy(on){
  busy.v = !!on;
  document.querySelectorAll("[data-m2m-busy]").forEach(el => el.hidden = !on);
  document.querySelectorAll("[data-m2m-idle]").forEach(el => el.hidden = !!on);
}

export function mountM2MControls(container){
  if(!container) return;
  if(!container.querySelector("#m2m-btn")){
    container.insertAdjacentHTML("beforeend", `
      <div id="m2m-ctl" style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <button id="m2m-btn" class="vbtn">Connect MeetToMatch</button>
        <span data-m2m-busy hidden class="vspinner" aria-label="loading"></span>
      </div>`);
  }
  const btn = container.querySelector("#m2m-btn");
  btn.onclick = openModal;
}

function openModal(){
  const host = document.createElement("div");
  host.innerHTML = `
  <div class="vmodal" role="dialog" aria-modal="true">
    <div class="vmodal__panel">
      <h3 class="vmodal__title">MeetToMatch</h3>
      <p class="vmodal__desc">Paste your personal .ics feed URL. We store it securely and only the server fetches it.</p>
      <div class="vmodal__row">
        <input id="m2m-url" type="url" placeholder="https://…/your-feed.ics" />
      </div>
      <div class="vmodal__row" style="display:flex;gap:8px">
        <button id="m2m-test"  class="vbtn" data-m2m-idle>Test</button>
        <button id="m2m-save"  class="vbtn primary" data-m2m-idle disabled>Save</button>
        <button id="m2m-refresh" class="vbtn" data-m2m-manage hidden>Refresh</button>
        <button id="m2m-disconnect" class="vbtn" data-m2m-manage hidden>Disconnect</button>
        <span class="vspinner" data-m2m-busy hidden></span>
      </div>
      <div id="m2m-msg" class="vmodal__msg" aria-live="polite"></div>
      <button class="vmodal__close" aria-label="Close">&times;</button>
    </div>
  </div>`;
  document.body.appendChild(host);
  const url = host.querySelector("#m2m-url");
  const closeBtn = host.querySelector(".vmodal__close");
  const btnTest = host.querySelector("#m2m-test");
  const btnSave = host.querySelector("#m2m-save");
  const btnRefresh = host.querySelector("#m2m-refresh");
  const btnDisc = host.querySelector("#m2m-disconnect");
  const msg = host.querySelector("#m2m-msg");
  function say(t, ok=false){ msg.textContent=t; msg.style.color= ok? "var(--alias-baf5d3)":"var(--alias-ffb4b4)"; }

  // manage state? try to fetch events to detect connection
  setBusy(true);
  M2M.listEvents().then(r=>{
    const connected = r?.connected;
    btnRefresh.hidden = btnDisc.hidden = !connected;
    if(connected){ say("Connected. You can refresh or disconnect.", true); }
  }).catch(()=>{}).finally(()=> setBusy(false));

  function lock(on){
    setBusy(on);
    btnTest.disabled = btnSave.disabled = btnRefresh.disabled = btnDisc.disabled = !!on;
  }

  btnTest.onclick = async ()=>{
    const u = url.value.trim();
    if(!/\.ics(\?|$)/i.test(u) || !/^https?:\/\//i.test(u)){ say("Paste a valid https://… .ics link"); return; }
    lock(true);
    try{
      const r = await M2M.verify(u);
      say(`Looks good — ${r.sampleCount} events detected`, true);
      btnSave.disabled = false;
    } catch(e){ say("Could not fetch your feed (login or wrong link?)."); }
    finally{ lock(false); }
  };
  btnSave.onclick = async ()=>{
    const u = url.value.trim();
    if(!/\.ics(\?|$)/i.test(u)){ say("Enter a valid .ics URL"); return; }
    lock(true);
    try{
      await M2M.subscribe(u);
      say("Connected. We'll keep it in sync.", true);
      btnRefresh.hidden = btnDisc.hidden = false;
      document.getElementById("m2m-btn")?.classList.add("primary");
      document.getElementById("m2m-btn").textContent = "Manage MeetToMatch";
    } catch(e){ say("Save failed. Use your personal .ics feed."); }
    finally{ lock(false); }
  };
  btnRefresh.onclick = async ()=>{
    lock(true);
    try{ const r = await M2M.refresh(); say(r.throttled?"Using recent copy (try later).":"Refreshed.", true); }
    catch{ say("Refresh failed"); }
    finally{ lock(false); }
  };
  btnDisc.onclick = async ()=>{
    if(!confirm("Disconnect MeetToMatch?")) return;
    lock(true);
    try{ await M2M.disconnect(); say("Disconnected", true); btnRefresh.hidden = btnDisc.hidden = true; }
    catch{ say("Disconnect failed"); }
    finally{ lock(false); }
  };

  function close(){
    if(busy.v) return; // prevent close while busy
    host.remove();
  }
  closeBtn.onclick = close;
  host.addEventListener("click", (e)=>{ if(e.target === host.firstElementChild) close(); }, { capture:true });
  host.addEventListener("keydown", (e)=>{ if(e.key==="Escape") close(); });
}

export function mergeAndDedup(a = [], b = []){
  // a: calendar events; b: m2m events
  const key = (ev) => {
    const t = (ev.title||"").toLowerCase().replace(/\s+/g," ").trim();
    const s = +new Date(ev.start||0);
    return t+"|"+Math.round(s/ (10*60*1000)); // 10-min buckets
  };
  const map = new Map();
  [...a,...b].forEach(ev=>{
    const k = key(ev);
    if(!map.has(k)) map.set(k, ev);
    else {
      // prefer event with location or longer title
      const x = map.get(k);
      const better = (ev.location?1:0) - (x.location?1:0) || (ev.title?.length||0) - (x.title?.length||0);
      if(better>0) map.set(k, ev);
    }
  });
  return [...map.values()];
}