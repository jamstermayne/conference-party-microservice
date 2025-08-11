/**
 * CONNECTIONS SERVICE
 * Manages professional connections, notes, and relationship history
 */

export async function create({ userId, connectionId, eventId, conferenceId, tags=[] }){
  const r = await fetch('/api/connections', {
    method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId, connectionId, eventId, conferenceId, tags })
  });
  if(!r.ok) throw new Error('Create connection failed'); 
  return r.json();
}

export async function addNote(connectionId, text){
  const r = await fetch(`/api/connections/${connectionId}/notes`, {
    method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  if(!r.ok) throw new Error('Save note failed'); 
  return r.json();
}

export async function toggleStar(connectionId, starred){
  const r = await fetch(`/api/connections/${connectionId}/star`, {
    method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ starred })
  });
  if(!r.ok) throw new Error('Star toggle failed'); 
  return r.json();
}

export async function history(connectionId){
  const r = await fetch(`/api/connections/${connectionId}/history`, { credentials:'include' });
  if(!r.ok) throw new Error('History fetch failed'); 
  return r.json(); // [{ts, conference, event, note?}]
}

export async function list(){
  const r = await fetch('/api/connections', { credentials:'include' });
  if(!r.ok) throw new Error('List connections failed');
  return r.json();
}

export async function remove(connectionId){
  const r = await fetch(`/api/connections/${connectionId}`, {
    method:'DELETE', credentials:'include'
  });
  if(!r.ok) throw new Error('Remove connection failed');
  return r.json();
}