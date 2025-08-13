// calendar-sync.js
import Events from './events.js?v=b021';

function toICSDate(d) {
  // Input: ISO or Date; Output: YYYYMMDDTHHMMSSZ
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function downloadICS({ id, title, startsAt, endsAt, venue }) {
  const now = new Date();
  const uid = `${id}@velocity.ai`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//velocity.ai//Gamescom//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(startsAt)}`,
    `DTEND:${toICSDate(endsAt || new Date(new Date(startsAt).getTime() + 60*60*1000))}`,
    `SUMMARY:${title}`,
    `LOCATION:${venue || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  Events.emit('metrics:track', { event: 'ics_download', id });
}