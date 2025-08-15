export function makeIcsAndDownload(p) {
  const esc = (s='') => String(s).replace(/[\n\r]/g, '\\n');
  const dt = (iso) => iso.replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');

  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//velocity.ai//conference//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${p.id || (Date.now()+'@velocity')}`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    p.start ? `DTSTART:${dt(p.start)}` : '',
    p.end   ? `DTEND:${dt(p.end)}`     : '',
    `SUMMARY:${esc(p.title)}`,
    `DESCRIPTION:${esc(p.description)}`,
    p.location ? `LOCATION:${esc(p.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type:'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (p.title || 'event') + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}