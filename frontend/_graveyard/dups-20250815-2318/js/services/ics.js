export function downloadIcs({ title, start, end, description = '', location = '' }) {
  const esc = (s='') => String(s).replace(/[\n\r]/g, '\\n');
  const pad = (n)=> String(n).padStart(2,'0');
  const toDt = (iso) => {
    const d = new Date(iso);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Velocity//Conference Party//EN',
    'BEGIN:VEVENT',
    `DTSTAMP:${toDt(new Date().toISOString())}`,
    `DTSTART:${toDt(start)}`,
    `DTEND:${toDt(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(location)}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'event.ics';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}