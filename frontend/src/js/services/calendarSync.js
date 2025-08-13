import { Store } from '../store.js?v=b022';
import * as GCal from './googleCalendar.js?v=b022';
import * as ICS from './icsSync.js?v=b022';

export async function syncNow({ window='conference' }={}){
  const { timeMin, timeMax } = getWindow(window);
  const out = { found:0, matched:0, lastSync: Date.now() };
  let all = [];

  try{
    const g = await GCal.list({ timeMin, timeMax });
    all = all.concat(g.map(nrmGoogle));
    Store.patch('calendar', { ...(Store.get().calendar||{}), googleConnected:true });
  }catch{}

  try{
    const i = await ICS.pull();
    all = all.concat(i.map(nrmICS));
    Store.patch('calendar', { ...(Store.get().calendar||{}), icsSubscribed:true });
  }catch{}

  const unique = dedupe(all);
  out.found = unique.length;

  const matched = unique.map(matchVenue);
  out.matched = matched.filter(m=>m.venueId).length;

  // Store for UI and Hotspots lift (optional)
  Store.patch('calendar', { events: matched, meta: out });

  return matched;
}

export async function pullICS(){ return syncNow(); }

function getWindow(kind){
  // Replace with real conference bounds
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(Date.now()+7*86400000);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

// ---- Normalizers ----
function nrmGoogle(e){
  return {
    uid: e.iCalUID || e.id,
    title: e.summary || 'Meeting',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || '',
    attendees: (e.attendees||[]).map(a=>a.email).filter(Boolean),
    source: 'google',
    sourceHint: e.sourceHint || ''    // allow backend to tag "Meet to Match"
  };
}
function nrmICS(e){
  return {
    uid: e.uid, title: e.summary, start: e.start, end: e.end,
    location: e.location||'', attendees: e.attendees||[],
    source: 'ics', sourceHint: e.sourceHint || ''
  };
}

// ---- Dedupe (UID + fingerprint) ----
function dedupe(list){
  const seen = new Map();
  for (const ev of list){
    const fp = (ev.uid || '') + '|' + (ev.title||'').toLowerCase().trim() + '|' + (ev.start||'') + '|' + (ev.location||'').toLowerCase();
    if (!seen.has(fp)) seen.set(fp, ev);
    else {
      // prefer Google over ICS if duplicate
      const cur = seen.get(fp);
      if (cur.source==='ics' && ev.source==='google') seen.set(fp, ev);
    }
  }
  return [...seen.values()];
}

// ---- Venue & MeetToMatch hints ----
function matchVenue(ev){
  const vmap = getVenueMap(); // lightweight dictionary
  const loc = (ev.location||'').toLowerCase();
  for (const [id, aliases] of Object.entries(vmap)){
    if (aliases.some(a=>loc.includes(a))) { ev.venueId=id; break; }
  }
  // Tag provenance chip "MeetToMatch" if indicators present
  const isM2M = /meet.?to.?match/i.test(ev.title) || /meettomatch|m2m/i.test(ev.sourceHint||'');
  ev.provenance = [
    ev.source==='google' ? 'From Google' : 'From ICS',
    isM2M ? 'MeetToMatch' : null
  ].filter(Boolean);
  return ev;
}
function getVenueMap(){
  return {
    'venue_marriott': ['marriott','marriot','mariott'],
    'venue_dorint':   ['dorint'],
    'venue_confex':   ['confex','kölnmesse','kolnmesse','messe']
  };
}