import { startOAuth, addToCalendar } from "./services/google-calendar.js?v=b029";

function withBusy(btn, fn) {
  const prev = { text: btn.textContent, disabled: btn.disabled };
  btn.disabled = true; btn.textContent = "Working…";
  return fn().then(() => {
    btn.textContent = "✓ Added"; setTimeout(() => {
      btn.textContent = prev.text; btn.disabled = prev.disabled;
    }, 1400);
  }).catch((e) => {
    btn.textContent = "Retry Add"; btn.disabled = false; throw e;
  });
}

document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-gcal-start],[data-gcal-add]");
  if (!t) return;
  e.preventDefault();

  if (t.hasAttribute("data-gcal-start")) {
    startOAuth();
    return;
  }
  
  const addBtn = e.target.closest("[data-gcal-add]");
  if (!addBtn) return;
  
  const card = addBtn.closest(".vcard");
  const title = addBtn.dataset.title || card?.querySelector(".vcard__title")?.textContent?.trim() || card?.querySelector(".vtitle")?.textContent?.trim() || "Event";
  const venue = addBtn.dataset.venue || "";
  const start = addBtn.dataset.start;
  const end   = addBtn.dataset.end;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  await withBusy(addBtn, () => addToCalendar({ 
    title, 
    location: venue, 
    start, 
    end, 
    timeZone,
    description: "Added from Conference Party" 
  }));
});
