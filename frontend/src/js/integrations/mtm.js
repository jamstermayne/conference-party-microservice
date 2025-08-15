// Minimal, framework-free hooks for MTM + Google mirror.
// Expects: getIdToken.sync() available; toast(msg) optional (falls back to alert).

const mtm = (() => {
  const els = {
    card:          () => document.getElementById('mtm-card'),
    status:        () => document.getElementById('mtm-status-badge'),
    ics:           () => document.getElementById('mtm-ics'),
    connect:       () => document.getElementById('mtm-connect'),
    syncNow:       () => document.getElementById('mtm-sync-now'),
    lastSync:      () => document.getElementById('mtm-last-sync'),
    mirrorToggle:  () => document.getElementById('mtm-mirror-toggle'),
    calId:         () => document.getElementById('mtm-cal-id'),
    saveMirror:    () => document.getElementById('mtm-save-mirror'),
    hint:          () => document.getElementById('mtm-hint'),
  };

  const api = async (path, opts={}) => {
    // Get the ID token from window.Auth
    let token = '';
    try {
      if (window.Auth?.getIdToken) {
        token = await window.Auth.getIdToken();
      }
    } catch (e) {
      console.warn('[MTM] No auth token available');
    }
    
    return fetch(`/api/integrations/mtm${path}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {})
    });
  };

  const say = (m) => (window.toast ? window.toast(m) : alert(m));
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : '';

  async function loadStatus() {
    try {
      const r = await api('/status');
      const j = await r.json();

      // Expected shape:
      // { connected: boolean, lastSyncAt?: string, mirrorToGoogle?: boolean, googleCalendarId?: string }
      els.status().textContent = j.connected ? 'Connected' : 'Not connected';
      els.status().className   = `badge ${j.connected ? 'success' : 'warning'}`;

      els.lastSync().textContent = j.lastSyncAt ? `Last sync: ${fmtDate(j.lastSyncAt)}` : 'Not synced yet';

      els.mirrorToggle().checked = !!j.mirrorToGoogle;
      els.calId().value = j.googleCalendarId || 'primary';

      // UX: hide ICS input if already connected (still allow paste to rotate)
      els.ics().placeholder = j.connected ? '•••••• (connected — paste to rotate)' : els.ics().placeholder;
    } catch (e) {
      els.status().textContent = 'Error';
      els.status().className = 'badge error';
    }
  }

  async function onConnect() {
    const url = els.ics().value.trim();
    if (!/^https?:\/\/.+\.ics/.test(url)) return say('Enter a valid private ICS URL from MeetToMatch.');
    els.connect().disabled = true;
    try {
      const r = await api('/connect', { method: 'POST', body: { icsUrl: url } });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Failed');
      say('MeetToMatch connected. First sync will run now.');
      await onSyncNow();
      els.ics().value = '';
    } catch (e) {
      say(e.message || 'Failed to connect');
    } finally {
      els.connect().disabled = false;
      loadStatus();
    }
  }

  async function onSyncNow() {
    els.syncNow().disabled = true;
    try {
      const r = await api('/syncNow', { method: 'POST' });
      const j = await r.json();
      if (j.ok) {
        say(`Synced ${j.count ?? 0} events from MeetToMatch.`);
      } else {
        throw new Error(j.error || 'Sync failed');
      }
    } catch (e) {
      say(e.message || 'Sync failed');
    } finally {
      els.syncNow().disabled = false;
      loadStatus();
    }
  }

  async function onSaveMirror() {
    const enabled = !!els.mirrorToggle().checked;
    const calendarId = (els.calId().value || 'primary').trim();
    els.saveMirror().disabled = true;
    try {
      const r = await api('/mirror', { method: 'POST', body: { enabled, calendarId } });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'Failed');
      say(enabled ? `Mirroring to "${calendarId}" enabled.` : 'Mirroring disabled.');
    } catch (e) {
      say(e.message || 'Failed to save');
    } finally {
      els.saveMirror().disabled = false;
      loadStatus();
    }
  }

  function bind() {
    els.connect().addEventListener('click', onConnect);
    els.syncNow().addEventListener('click', onSyncNow);
    els.saveMirror().addEventListener('click', onSaveMirror);
  }

  async function init() {
    const card = els.card();
    if (!card) return;
    bind();
    await loadStatus();
  }

  return { init };
})();

export async function initMtmSettings() {
  return mtm.init();
}
