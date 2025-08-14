const B = "b035";
const base = "/api/m2m";
function authHeaders() {
  const t = localStorage.getItem("idToken") || sessionStorage.getItem("idToken");
  return t ? { "Authorization": "Bearer " + t } : {};
}
async function j(method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: { "content-type":"application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!r.ok) throw new Error("m2m_"+method+"_"+path+"_"+r.status);
  return r.json();
}
export async function verify(url){ return j("POST","/verify",{url}); }
export async function subscribe(url){ return j("POST","/subscribe",{url}); }
export async function refresh(){ return j("POST","/refresh"); }
export async function disconnect(){ return j("POST","/disconnect"); }
export async function listEvents(){ return j("GET","/events"); }
export function mask(u=""){ try{ const q=u.split("?")[0]; return q.slice(0,24)+"…"+q.slice(-6);}catch{return "…" } }
export default { verify, subscribe, refresh, disconnect, listEvents, mask };