import { verify, subscribe } from "../services/m2m.js?v=b035";
import { toast } from "./toast.js?v=b035";

export function openM2MModal(){
  let wrap = document.getElementById("m2m-modal");
  if (!wrap){
    wrap = document.createElement("div"); 
    wrap.id="m2m-modal";
    wrap.innerHTML = `
      <div class="overlay" style="position:fixed;inset:0;background:rgba(7,9,16,.6);backdrop-filter:saturate(120%) blur(4px);z-index:9998"></div>
      <div class="sheet" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999">
        <div class="panel" style="width:min(560px,94vw);border-radius:16px;border:1px solid #2b2f45;background:linear-gradient(180deg,#0e1320,#0b111c);box-shadow:0 10px 50px rgba(8,10,20,.6);padding:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-weight:800;color:#eaf0ff;font-size:18px">Connect MeetToMatch</div>
            <button id="m2m-close" style="border:0;background:#12192a;color:#cfe0ff;border-radius:10px;padding:6px 10px;cursor:pointer">✕</button>
          </div>
          <p style="color:#9aa7bf;margin:6px 0 14px">Paste your personal MeetToMatch <b>ICS feed URL</b>. We'll verify it, save it to your account, and show those events here.</p>
          <input id="m2m-url" type="url" placeholder="https://meettomatch.com/.../calendar.ics" 
            style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid #2b2f45;background:#0f1625;color:#eaf0ff;outline:none"/>
          <div id="m2m-hint" style="color:#9aa7bf;font-size:12px;margin-top:6px">Only your account can read this. You can remove it anytime.</div>
          <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">
            <button id="m2m-test" style="border:1px solid #2b2f45;background:#18223a;color:#eaf0ff;border-radius:12px;padding:8px 12px;cursor:pointer">Test</button>
            <button id="m2m-save" style="border:0;background:linear-gradient(180deg,#8c7aff,#5b47ff);color:#fff;border-radius:12px;padding:8px 12px;cursor:pointer;font-weight:700">Save</button>
          </div>
          <div id="m2m-result" style="margin-top:12px;color:#cfe0ff;font-size:13px"></div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    
    wrap.querySelector("#m2m-close").onclick = ()=> wrap.remove();
    const urlEl = wrap.querySelector("#m2m-url");
    const outEl = wrap.querySelector("#m2m-result");
    
    wrap.querySelector("#m2m-test").addEventListener("click", async ()=>{
      const url = urlEl.value.trim();
      if (!url) return toast("Paste your ICS link", false);
      outEl.textContent = "Verifying…";
      try{
        const r = await verify(url);
        if (!r.ok) { 
          outEl.textContent = "❌ " + (r.error||"Verify failed"); 
          return; 
        }
        const sample = (r.sample||[]).map((e)=> `• ${new Date(e.start).toLocaleString([], {hour:'2-digit', minute:'2-digit'})} ${e.title}`).join("\n");
        outEl.textContent = sample ? `Looks good:\n${sample}` : "Verified (no near-term events found).";
      }catch(e){ 
        outEl.textContent = "❌ Verify failed"; 
      }
    });
    
    wrap.querySelector("#m2m-save").addEventListener("click", async ()=>{
      const url = urlEl.value.trim();
      if (!url) return toast("Paste your ICS link", false);
      try{
        const r = await subscribe(url);
        if (!r.ok) return toast("Could not save link", false);
        toast("MeetToMatch connected ✓");
        wrap.remove();
        document.dispatchEvent(new CustomEvent("m2m:connected"));
      }catch(e){ 
        toast("Save failed", false); 
      }
    });
  }
}