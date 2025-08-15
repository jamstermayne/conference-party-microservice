// calendar-delegation.js - Global event delegation for Add to Calendar

// Simple toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// One-time global delegation setup
export function initCalendarDelegation() {
  document.addEventListener('click', handleCalendarClick);
}

function handleCalendarClick(e) {
  const btn = e.target.closest('[data-action="add-to-calendar"]');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const partyId = btn.dataset.id;
  const provider = btn.dataset.provider || 'google'; // default to Google

  // Get party data
  const partyData = getPartyData(partyId);
  if (!partyData) {
    console.error('Party data not found for ID:', partyId);
    return;
  }

  // Handle provider-specific actions
  if (provider === 'google') {
    return handleGoogleCalendar(partyData);
  }
  if (provider === 'outlook') {
    return handleOutlookCalendar(partyData);
  }
  if (provider === 'ics') {
    return handleICSDownload(partyData);
  }
}

function getPartyData(partyId) {
  // Check window.partiesCache first (set by mount-parties.js)
  if (window.partiesCache && window.partiesCache[partyId]) {
    return window.partiesCache[partyId];
  }

  // Try to get from DOM data attributes
  const card = document.querySelector(`[data-party-id="${partyId}"]`);
  if (card) {
    return {
      id: partyId,
      title: card.dataset.title || 'Event',
      start: card.dataset.start,
      end: card.dataset.end,
      venue: card.dataset.venue || '',
      description: card.dataset.description || ''
    };
  }

  // Fallback to localStorage cache
  const cached = localStorage.getItem('parties-cache');
  if (cached) {
    try {
      const parties = JSON.parse(cached);
      return parties.find(p => p.id === partyId);
    } catch (e) {
      console.error('Failed to parse parties cache:', e);
    }
  }

  return null;
}

async function handleGoogleCalendar(party) {
  // Open popup immediately on user gesture to avoid blockers
  const popup = window.open('/api/gcal/connect', 'gcal_connect',
    'width=520,height=640,noopener,noreferrer');
  
  if (!popup) { 
    alert('Please allow popups for Google sign-in'); 
    return; 
  }

  try {
    // Wait a bit for OAuth to complete (or implement proper polling)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // After OAuth completes, create the calendar event
    const res = await fetch('/api/googleCalendar/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        partyId: party.id,
        title: party.title,
        start: party.start,
        end: party.end,
        venue: party.venue,
        description: party.description
      })
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    // Show success message
    showToast('Event added to Google Calendar!', 'success');
  } catch (err) {
    console.error('Google Calendar add failed:', err);
    showToast('Failed to add event to calendar', 'error');
  } finally {
    try { popup.close(); } catch {}
  }
}

function formatGoogleDates(start, end) {
  // Convert to Google Calendar format (YYYYMMDDTHHmmSS/YYYYMMDDTHHmmSS)
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const format = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace('.000', '');
  };

  return `${format(startDate)}/${format(endDate)}`;
}

function handleOutlookCalendar(party) {
  // For Outlook, just download ICS file which Outlook can open
  handleICSDownload(party);
}

async function handleICSDownload(party) {
  try {
    // Fetch ICS from server endpoint
    const res = await fetch(`/api/calendar/ics?partyId=${encodeURIComponent(party.id)}`);
    
    if (!res.ok) { 
      console.error('ICS download failed'); 
      // Fallback to client-side generation
      downloadGeneratedICS(party);
      return; 
    }
    
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${party.title.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a); 
    a.click(); 
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (err) {
    console.error('ICS download error:', err);
    // Fallback to client-side generation
    downloadGeneratedICS(party);
  }
}

function downloadGeneratedICS(party) {
  // Client-side ICS generation as fallback
  const icsContent = generateICS(party);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${party.title.replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function generateICS(party) {
  const startDate = new Date(party.start);
  const endDate = party.end ? new Date(party.end) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
  
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace('.000', '');
  };

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${party.id}@conference-party-app`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${party.title}`,
    `DESCRIPTION:${party.description || ''}`,
    `LOCATION:${party.venue || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return ics;
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendarDelegation);
} else {
  initCalendarDelegation();
}