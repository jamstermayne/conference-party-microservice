/**
 * Smart Add to Calendar
 * Unified calendar integration with split button for multiple providers
 */

class SmartCalendar {
  constructor() {
    this.googleConnected = false;
    this.checkGoogleStatus();
  }

  async checkGoogleStatus() {
    try {
      const res = await fetch('/api/googleCalendar/status', {
        credentials: 'include'
      });
      const data = await res.json();
      this.googleConnected = data.connected || false;
    } catch (err) {
      this.googleConnected = false;
    }
  }

  async addToGoogleCalendar(event) {
    if (!this.googleConnected) {
      // Start OAuth flow
      const authUrl = '/api/googleCalendar/connect';
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkInterval);
              // Re-check status
              this.checkGoogleStatus().then(() => {
                if (this.googleConnected) {
                  // Now add the event
                  this.createGoogleEvent(event).then(resolve).catch(reject);
                } else {
                  reject(new Error('Authentication failed'));
                }
              });
            }
          } catch (e) {
            clearInterval(checkInterval);
            reject(e);
          }
        }, 500);
      });
    } else {
      return this.createGoogleEvent(event);
    }
  }

  async createGoogleEvent(event) {
    const res = await fetch('/api/googleCalendar/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        summary: event.title,
        location: event.venue,
        description: event.description || '',
        start: { dateTime: event.start },
        end: { dateTime: event.end }
      })
    });
    
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  }

  generateICS(event) {
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Conference Party App//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@conference-party-app.web.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.venue || ''}`,
      `DESCRIPTION:${event.description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return ics;
  }

  downloadICS(event) {
    const ics = this.generateICS(event);
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id || 'event'}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  addToOutlook(event) {
    // Generate ICS and offer download + mailto option
    this.downloadICS(event);
    
    // Also offer mailto option for Outlook
    const subject = encodeURIComponent(event.title);
    const body = encodeURIComponent(`Event: ${event.title}\nWhen: ${event.start} - ${event.end}\nWhere: ${event.venue || 'TBA'}\n\n${event.description || ''}`);
    const mailto = `mailto:?subject=${subject}&body=${body}`;
    
    // Small delay to avoid popup blocker
    setTimeout(() => {
      window.open(mailto, '_blank');
    }, 500);
  }

  openMeetToMatch(event) {
    // Open Meet to Match login in new tab
    const mtmUrl = 'https://meettomatch.com/login';
    window.open(mtmUrl, '_blank');
  }

  createSplitButton(event) {
    const container = document.createElement('div');
    container.className = 'calendar-split-button';
    container.innerHTML = `
      <button class="btn-primary" data-provider="google">
        <span class="icon">📅</span> Add to Calendar
      </button>
      <button class="btn-dropdown" aria-label="More options">▼</button>
      <div class="dropdown-menu" hidden>
        <button data-provider="google">
          <span class="icon">🔷</span> Google Calendar
        </button>
        <button data-provider="outlook">
          <span class="icon">📧</span> Outlook
        </button>
        <button data-provider="mtm">
          <span class="icon">🤝</span> Meet to Match
        </button>
      </div>
    `;

    // Handle main button click
    container.querySelector('.btn-primary').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await this.addToGoogleCalendar(event);
        this.showToast('Event added to Google Calendar!');
      } catch (err) {
        this.showToast('Failed to add event', 'error');
      }
    });

    // Handle dropdown toggle
    const dropdown = container.querySelector('.btn-dropdown');
    const menu = container.querySelector('.dropdown-menu');
    
    dropdown.addEventListener('click', (e) => {
      e.preventDefault();
      menu.hidden = !menu.hidden;
    });

    // Handle menu items
    menu.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      
      e.preventDefault();
      menu.hidden = true;
      
      const provider = btn.dataset.provider;
      try {
        switch (provider) {
          case 'google':
            await this.addToGoogleCalendar(event);
            this.showToast('Event added to Google Calendar!');
            break;
          case 'outlook':
            this.addToOutlook(event);
            this.showToast('Event exported for Outlook');
            break;
          case 'mtm':
            this.openMeetToMatch(event);
            break;
        }
      } catch (err) {
        this.showToast(`Failed to add to ${provider}`, 'error');
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.hidden = true;
      }
    });

    return container;
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#dc3545' : '#28a745'};
      color: white;
      border-radius: 4px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize and expose globally
window.SmartCalendar = new SmartCalendar();

// Auto-enhance existing calendar buttons
document.addEventListener('DOMContentLoaded', () => {
  // Replace existing calendar buttons with smart buttons
  document.querySelectorAll('[data-action="add-to-calendar"]').forEach(btn => {
    const eventData = {
      id: btn.dataset.id,
      title: btn.closest('.vcard')?.querySelector('.vcard__title')?.textContent,
      venue: btn.closest('.vcard')?.querySelector('[data-action="open-map"]')?.textContent,
      start: btn.closest('.vcard')?.dataset.startIso,
      end: btn.closest('.vcard')?.dataset.endIso,
      description: btn.closest('.vcard')?.querySelector('.vcard__desc')?.textContent
    };
    
    if (eventData.title && eventData.start) {
      const smartButton = window.SmartCalendar.createSplitButton(eventData);
      btn.replaceWith(smartButton);
    }
  });
});

// Add required styles
const style = document.createElement('style');
style.textContent = `
  .calendar-split-button {
    display: inline-flex;
    position: relative;
  }
  
  .calendar-split-button .btn-primary {
    border-radius: 4px 0 0 4px;
    border-right: 1px solid rgba(255,255,255,0.2);
  }
  
  .calendar-split-button .btn-dropdown {
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
    background: linear-gradient(180deg, #8c7aff 0%, #5b47ff 100%);
    color: white;
    border: none;
    cursor: pointer;
  }
  
  .calendar-split-button .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 1000;
    min-width: 180px;
  }
  
  .calendar-split-button .dropdown-menu button {
    display: block;
    width: 100%;
    padding: 10px 16px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
  }
  
  .calendar-split-button .dropdown-menu button:hover {
    background: #f5f5f5;
  }
  
  @keyframes slideIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);