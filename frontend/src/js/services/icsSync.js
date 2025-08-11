/**
 * ICS SYNC SERVICE
 * Handles ICS feed subscriptions and Meet to Match calendar integration
 */

export async function subscribe(url){
  const r = await fetch('/api/ics/subscribe', {
    method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ url })
  });
  if (!r.ok) throw new Error('ICS subscribe failed');
  return r.json();
}

export async function pull(){
  const r = await fetch('/api/ics/pull', { credentials:'include' });
  if (!r.ok) throw new Error('ICS pull failed');
  return r.json(); // normalized events[] delta
}