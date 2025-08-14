export async function draftICS({ to, subject, html, ics, filename="invite.ics" }) {
  const r = await fetch("/api/google/gmail/draft-ics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to, subject, html, ics, filename })
  });
  return r.json();
}