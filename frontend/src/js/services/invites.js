const base = '';

async function getJSON(url, opts={}) {
  const token = await (window.firebase?.auth?.().currentUser?.getIdToken?.());
  const headers = Object.assign({
    'Content-Type':'application/json',
    ...(token ? { 'Authorization': 'Bearer '+token } : {})
  }, opts.headers||{});
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error('HTTP '+res.status+': '+(await res.text()));
  return res.json();
}

export async function myInvites(){
  return getJSON(`${base}/api/invites/my`);
}
export async function createInvite(email){
  return getJSON(`${base}/api/invites/create`, { method:'POST', body: JSON.stringify({ email }) });
}
export async function revokeInvite(code){
  return getJSON(`${base}/api/invites/revoke`, { method:'POST', body: JSON.stringify({ code }) });
}
export async function redeemInvite(code){
  return getJSON(`${base}/api/invites/redeem`, { method:'POST', body: JSON.stringify({ code }) });
}