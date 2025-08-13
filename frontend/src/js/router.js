/**
 * Router — single entry, single mount (#main). Build b018.
 * No CSS imports; all modules are versioned (?v=b018)
 */
const ROUTES = ["parties","calendar","map","hotspots","invites","contacts","me","settings"];
const currentRoute = () => (location.hash || "#/parties").replace(/^#\/?/, "").split("?")[0] || "parties";

function mount() {
  return document.getElementById("main");
}

async function render(r) {
  const el = mount();
  if (!el) return;
  el.innerHTML = "";

  switch (r) {
    case "parties":
      (await import("./events-controller.js?v=b018")).renderParties(el);
      break;
    case "calendar":
      (await import("./calendar-view.js?v=b017")).renderCalendar(el);
      break;
    case "invites":
      (await import("./invite-panel.js?v=b018")).renderInvites(el);
      break;
    case "contacts":
      (await import("./contacts-panel.js?v=b018")).renderContacts(el);
      break;
    case "me":
      (await import("./me-panel.js?v=b018")).renderMe(el);
      break;
    case "map":
    case "hotspots":
    case "settings":
      el.innerHTML = `
        <div class="section-card">
          <div class="left-accent" aria-hidden="true"></div>
          <h2 class="text-heading" style="margin-bottom:8px;">${r.charAt(0).toUpperCase()+r.slice(1)}</h2>
          <p class="muted">Coming soon.</p>
        </div>`;
      break;
    default:
      (await import("./events-controller.js?v=b018")).renderParties(el);
  }
}

function start() {
  const go = () => render(currentRoute());
  addEventListener("hashchange", go, { passive:true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", go, { once:true });
  } else { go(); }
}
start();
export { currentRoute };
