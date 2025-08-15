export function buildICS(event) {
  // Support both formats
  const title = event.summary || event.title || 'Event';
  const description = event.description || '';
  const location = event.location || event.venue || '';
  const startISO = event.start || event.startISO || new Date().toISOString();
  const endISO = event.end || event.endISO || new Date(Date.now() + 3600000).toISOString();
  const uid = event.uid || event.id;
  
  const dt = (s)=> s.replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const now = dt(new Date().toISOString());
  const uidStr = uid || (now + "@conference-party-app");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Conference Party App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uidStr}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dt(startISO)}`,
    `DTEND:${dt(endISO)}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    location ? `LOCATION:${escapeText(location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}

function escapeText(s){ 
  return String(s).replace(/([,;])/g,"\\$1").replace(/\n/g,"\\n"); 
}

export function downloadICS(ics, filename="invite.ics"){
  const blob = new Blob([ics], { type:"text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); 
  a.href = url; 
  a.download = filename; 
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

export function outlookDeeplink({ title, body="", location="", startISO, endISO }){
  const base = "https://outlook.live.com/calendar/0/deeplink/compose";
  const q = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    body: body,
    location: location,
    startdt: startISO,
    enddt: endISO
  });
  return `${base}?${q.toString()}`;
}

// Create ICS file for the next upcoming event
export async function createIcsFileForNextEvent() {
  // Sample event - in production, fetch from your event source
  const nextEvent = {
    title: 'Gamescom Party',
    location: 'Cologne, Germany',
    description: 'Annual gaming conference party',
    start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    end: new Date(Date.now() + 90000000).toISOString()    // Tomorrow + 1hr
  };
  
  const icsContent = buildICS(nextEvent);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

// Build and download ICS file for an event
export async function buildIcsAndDownload(event) {
  const icsContent = buildICS(event);
  const filename = `${(event.title || event.summary || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  downloadICS(icsContent, filename);
}