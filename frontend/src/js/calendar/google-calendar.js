// Uses backend-only OAuth. No styles touched.
export async function ensureGoogleConnected() {
  const st = await fetch('/api/googleCalendar/status', { credentials:'include' })
    .then(r=>r.json()).catch(()=>({connected:false}));
  if (st.connected) return;

  const authUrl = '/api/googleCalendar/google/start';
  const w = window.open(authUrl, 'gcal_oauth', 'width=480,height=640');
  if (!w) throw new Error('Popup blocked');

  // poll status (10s)
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    await new Promise(r=>setTimeout(r, 600));
    const s = await fetch('/api/googleCalendar/status', { credentials:'include' })
      .then(r=>r.json()).catch(()=>({connected:false}));
    if (s.connected) { try{ w.close(); }catch{} return; }
  }
  throw new Error('Google auth timeout');
}

export async function addToGoogleCalendar(party) {
  const res = await fetch('/api/googleCalendar/create', {
    method:'POST',
    headers: { 'content-type':'application/json' },
    credentials:'include',
    body: JSON.stringify(party),
  });
  if (!res.ok) throw new Error('Create failed');
  return res.json();
}