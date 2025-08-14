export async function startOAuth() {
  const w = 520, h = 620;
  const y = Math.max(0, (window.outerHeight - h) / 2);
  const x = Math.max(0, (window.outerWidth  - w) / 2);
  const popup = window.open("/api/googleCalendar/google/start", "gcal_oauth",
    `width=${w},height=${h},left=${x},top=${y},resizable=yes,scrollbars=yes`);
  if (!popup) alert("Please allow popups to connect Google Calendar.");
}
export async function addToCalendar(evt) {
  const eventData = {
    ...evt,
    timeZone: evt.timeZone || 'Europe/Berlin'
  };
  const res = await fetch("/api/googleCalendar/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn("[gcal] create failed", data?.error || res.statusText);
    throw new Error(data?.error || res.statusText);
  }
  console.log("[gcal] created", data);
  return data;
}
export async function listEvents() {
  const r = await fetch("/api/googleCalendar/events");
  if (!r.ok) throw new Error("Not authorized or no events");
  return r.json();
}
