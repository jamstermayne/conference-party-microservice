// Safe JSON fetching utility that prevents HTML parsing as JSON
export async function jsonGET(url) {
  const r = await fetch(url, { credentials: "include" });
  const ct = r.headers.get("content-type") || "";
  if (!r.ok) {
    const body = ct.includes("application/json") ? await r.json() : await r.text();
    const msg = typeof body === "string" ? body.slice(0, 200) : (body.error || JSON.stringify(body));
    throw new Error(`HTTP ${r.status} ${msg}`);
  }
  if (!ct.includes("application/json")) {
    const text = await r.text();
    throw new Error(`Non-JSON response: ${text.slice(0, 200)}`);
  }
  return r.json();
}