// Smart Add to Calendar orchestrator
import { GCal } from '../services/gcal.js?v=b030';
import { buildICS, downloadICS } from '../services/ics.js?v=b030';
import { showProviderChooser } from './provider-chooser.js?v=b030';

export async function handleAddToCalendar(party, { onSuccess, onError } = {}) {
  try {
    // 1) If already connected to Google → create server-side and finish
    const st = await GCal.isConnected();
    if (st) {
      await GCal.createFromParty(party);
      onSuccess?.('google');
      return;
    }

    // 2) Not connected → ask user Google vs Outlook/ICS
    const choice = await showProviderChooser(); // 'google' | 'outlook' | 'cancel'
    if (choice === 'cancel') return;

    if (choice === 'google') {
      await startGoogleOAuthAndWait();              // popup; resolves when connected
      const st2 = await GCal.isConnected();
      if (!st2) throw new Error('auth_failed');
      await GCal.createFromParty(party);            // now create
      onSuccess?.('google');
      return;
    }

    // 3) Outlook/ICS: no auth → generate ICS and download
    const icsBlob = buildICS(party);
    downloadICS(icsBlob, (party.slug || 'event') + '.ics');

    // Optional deep-link (commented to avoid surprise new window):
    // window.open(outlookWebLink(party), '_blank', 'noopener');

    onSuccess?.('outlook');
  } catch (err) {
    console.error('[add-to-calendar] failed', err);
    onError?.(err);
  }
}

// Opens backend OAuth and waits (poll + postMessage)
function startGoogleOAuthAndWait() {
  return new Promise((resolve, reject) => {
    const w = window.open('/api/googleCalendar/google/start', 'oauth', 'width=520,height=640');
    if (!w) return reject(new Error('popup_blocked'));

    const iv = setInterval(async () => {
      try {
        const r = await GCal.isConnected();
        if (r) { clearInterval(iv); try { w.close(); } catch{}; resolve(); }
      } catch {}
    }, 1000);

    const onMsg = (ev) => {
      if (ev.data && (ev.data.type === 'gcal-auth' || ev.data.type === 'gcal:connected')) {
        clearInterval(iv);
        try { w.close(); } catch {}
        window.removeEventListener('message', onMsg);
        resolve();
      }
      if (ev.data && ev.data.type === 'gcal:error') {
        clearInterval(iv);
        try { w.close(); } catch {}
        window.removeEventListener('message', onMsg);
        reject(new Error(ev.data.error || 'auth_failed'));
      }
    };
    window.addEventListener('message', onMsg);
  });
}