export function toast(msg, ok=true){
  let el = document.getElementById("vtoast");
  if (!el){
    el = document.createElement("div"); 
    el.id="vtoast";
    Object.assign(el.style,{ 
      position:"fixed", 
      right:"16px", 
      bottom:"16px", 
      zIndex:9999, 
      maxWidth:"360px" 
    });
    document.body.appendChild(el);
  }
  const item = document.createElement("div");
  Object.assign(item.style,{ 
    marginTop:"8px", 
    padding:"10px 12px", 
    borderRadius:"12px", 
    border:"1px solid var(--neutral-300)",
    background: ok? "linear-gradient(180deg,var(--alias-0f1b2f),var(--alias-0b1422))":"linear-gradient(180deg,var(--neutral-200),var(--neutral-200))",
    color:"var(--alias-eaf0ff)", 
    boxShadow:"0 10px 30px rgba(0,0,0,.35)", 
    fontSize:"14px" 
  });
  item.textContent = msg;
  el.appendChild(item);
  setTimeout(()=>item.remove(), 2800);
}