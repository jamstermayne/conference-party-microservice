function pad(n){ return String(n).padStart(2,'0'); }
function toICS(dt){ const d=new Date(dt); const y=d.getUTCFullYear(), m=pad(d.getUTCMonth()+1), day=pad(d.getUTCDate()), h=pad(d.getUTCHours()), min=pad(d.getUTCMinutes()); return `${y}${m}${day}T${h}${min}00Z`; }
export function openICS(ev){
  // Prefer backend ICS if id is present
  if(ev.id){ window.open(`/api/calendar/ics?partyId=${encodeURIComponent(ev.id)}`, '_blank'); return; }
  // Fallback client-side ICS blob
  const uid = crypto.randomUUID();
  const dtstart = toICS(ev.start||ev.date), dtend = toICS(ev.end||ev.start||ev.date);
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ConferenceParty//EN','BEGIN:VEVENT',
    `UID:${uid}`, `DTSTART:${dtstart}`, `DTEND:${dtend}`, `SUMMARY:${ev.title||'Party'}`,
    `LOCATION:${ev.venue||''}`, `DESCRIPTION:${(ev.desc||'').replace(/\n/g,'\\n')}`, 'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics],{type:'text/calendar'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${(ev.title||'event')}.ics`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
export function openGoogle(ev){
  const params = new URLSearchParams({
    action:'TEMPLATE',
    text: ev.title||'Party',
    dates: `${toICS(ev.start||ev.date)}/${toICS(ev.end||ev.start||ev.date)}`,
    details: ev.desc||'',
    location: ev.venue||''
  });
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
}
