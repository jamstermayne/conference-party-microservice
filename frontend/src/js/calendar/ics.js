// ics.js - ICS file generation for calendar downloads

export function makeIcsAndDownload(party) {
  const icsContent = generateICS(party);
  
  // Create blob and download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(party.title)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function generateICS(party) {
  const startDate = new Date(party.start);
  const endDate = new Date(party.end);
  
  // Format dates for ICS (YYYYMMDDTHHmmSS)
  const formatICSDate = (date) => {
    return date.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  };
  
  // Generate unique ID
  const uid = `${party.id || Date.now()}@conference-party-app`;
  
  // Build ICS content
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'PRODID:-//Conference Party App//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(party.title)}`,
    `DESCRIPTION:${escapeICS(party.description)}`,
    `LOCATION:${escapeICS(party.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0'
  ];
  
  // Add geo coordinates if available
  if (party.lat && party.lng) {
    lines.push(`GEO:${party.lat};${party.lng}`);
  }
  
  // Add URL if available
  if (party.url) {
    lines.push(`URL:${party.url}`);
  }
  
  // Add alarms/reminders
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Event in 1 hour',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Event in 10 minutes',
    'END:VALARM'
  );
  
  lines.push('END:VEVENT', 'END:VCALENDAR');
  
  // Join with CRLF as per ICS spec
  return lines.join('\r\n');
}

// Escape special characters for ICS format
function escapeICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Sanitize filename for download
function sanitizeFilename(str) {
  if (!str) return 'event';
  return str
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50);
}