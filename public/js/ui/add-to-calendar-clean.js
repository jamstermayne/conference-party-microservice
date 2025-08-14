// Clean Add to Calendar orchestrator
import { ensureConnected, createFromParty } from '../services/gcal-clean.js';
import { buildICS, downloadICS } from '../services/ics.js';
import { showProviderChooser } from './provider-chooser.js';

export async function handleAddToCalendar(party, { onSuccess, onError } = {}) {
  try {
    // 1) Try to use Google Calendar directly
    try {
      const connected = await ensureConnected();
      if (connected) {
        await createFromParty(party);
        onSuccess?.('google');
        return;
      }
    } catch (e) {
      // If popup blocked or user cancelled, offer alternatives
      if (e.message !== 'Popup blocked') throw e;
    }

    // 2) Show provider chooser if Google didn't work
    const choice = await showProviderChooser();
    if (choice === 'cancel') return;

    if (choice === 'google') {
      // Try again with explicit user action
      const connected = await ensureConnected();
      if (!connected) throw new Error('Connection failed');
      await createFromParty(party);
      onSuccess?.('google');
      return;
    }

    // 3) Outlook/ICS download
    if (choice === 'outlook') {
      const icsContent = buildICS(party);
      downloadICS(icsContent, `${party.slug || 'event'}.ics`);
      onSuccess?.('outlook');
    }
  } catch (err) {
    console.error('[add-to-calendar] failed', err);
    onError?.(err);
  }
}