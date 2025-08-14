import { startOAuth, addToCalendar } from "./services/google-calendar.js?v=b028";

function closestAttr(el, name) {
  while (el && el !== document) {
    if (el.dataset && el.dataset[name]) return el.dataset[name];
    el = el.parentElement;
  }
  return null;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-gcal-start],[data-gcal-add]");
  if (!t) return;
  e.preventDefault();

  if (t.hasAttribute("data-gcal-start")) {
    startOAuth();
    return;
  }
  if (t.hasAttribute("data-gcal-add")) {
    const card = t.closest(".vcard");
    const title = closestAttr(t, "title") || card?.querySelector(".vcard__title")?.textContent?.trim() || card?.querySelector(".vtitle")?.textContent?.trim() || "Event";
    const venue = closestAttr(t, "venue") || card?.querySelector(".vmeta")?.textContent?.trim() || "";
    const start = closestAttr(t, "start") || t.getAttribute("data-start") || "";
    const end   = closestAttr(t, "end")   || t.getAttribute("data-end")   || "";
    const timeZone = closestAttr(t, "timezone") || t.getAttribute("data-timezone") || "Europe/Berlin";
    addToCalendar({ title, location: venue, start, end, timeZone, description: "Added from Conference Party" });
  }
});
