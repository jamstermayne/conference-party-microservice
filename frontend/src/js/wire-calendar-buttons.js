import { startGoogleOAuth, addToGoogleCalendar } from './services/gcal.js';
import { toOutlookIcs } from './services/ics.js';
import { launchMeetToMatch } from './services/mtm.js';

function safePopup(url, name='oauth') {
  const w = window.open(url, name, 'noopener');
  if (!w || w.closed) { window.location.assign(url); return null; }
  return w;
}

async function ensureGoogleSession() {
  try {
    const r = await fetch('/api/googleCalendar/status', { credentials: 'include' });
    const j = await r.json();
    return !!j.connected;
  } catch { return false; }
}

export function wireCalendarButtons(root=document) {
  root.addEventListener('click', async (e) => {
    const t = e.target.closest('.btn-add-to-calendar,.btn-cal-google,.btn-cal-outlook,.btn-cal-m2m');
    if (!t) return;

    const card = t.closest('.vcard');
    const payload = card?.dataset?.event ? JSON.parse(card.dataset.event) : null;

    try {
      if (t.matches('.btn-add-to-calendar,.btn-cal-google')) {
        if (!(await ensureGoogleSession())) {
          safePopup('/api/googleCalendar/google/start','gcal-auth');
          return;
        }
        await addToGoogleCalendar(payload);
      } else if (t.classList.contains('btn-cal-outlook')) {
        const ics = toOutlookIcs(payload);
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=`${payload?.title||'event'}.ics`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      } else if (t.classList.contains('btn-cal-m2m')) {
        launchMeetToMatch(payload);
      }
    } catch (err) {
      console.error('[calendar] action failed', err);
      window.dispatchEvent(new CustomEvent('toast', { detail:{ type:'error', text:'Calendar action failed' } }));
    }
  }, { capture:false });
}

// auto-wire
document.addEventListener('DOMContentLoaded', () => wireCalendarButtons(document));
