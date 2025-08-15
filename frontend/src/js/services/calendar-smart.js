/**
 * Smart Calendar Service
 * Unified calendar integration with provider detection and optimal routing
 */

class SmartCalendar {
  constructor() {
    this.provider = null;
    this.gcalAvailable = false;
    this.outlookAvailable = false;
    this.detectProviders();
  }

  /**
   * Detect available calendar providers
   */
  async detectProviders() {
    // Check for Google Calendar availability
    this.gcalAvailable = !!(window.gapi && localStorage.getItem('gcal_token'));
    
    // Check for Outlook availability (could be extended)
    this.outlookAvailable = false;
    
    // Determine primary provider
    if (this.gcalAvailable) {
      this.provider = 'google';
    } else {
      this.provider = 'ics'; // fallback
    }
  }

  /**
   * Smart add to calendar with provider routing
   */
  async addToCalendar(event) {
    const { title, startTime, endTime, location, description } = event;
    
    // If Google Calendar is connected, use it
    if (this.provider === 'google' && this.gcalAvailable) {
      try {
        const GCal = await import('./gcal-backend.js?v=b030');
        return await GCal.default.createEvent({
          summary: title,
          location: location,
          description: description,
          start: { dateTime: startTime },
          end: { dateTime: endTime }
        });
      } catch (error) {
        console.warn('Google Calendar failed, falling back to ICS:', error);
        this.provider = 'ics';
      }
    }
    
    // Fallback to ICS download
    return this.downloadICS(event);
  }

  /**
   * Generate and download ICS file
   */
  downloadICS(event) {
    const { title, startTime, endTime, location, description } = event;
    
    // Format dates for ICS
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//velocity.ai//Gamescom 2025//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@velocity.ai`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startTime)}`,
      `DTEND:${formatDate(endTime)}`,
      `SUMMARY:${title}`,
      location ? `LOCATION:${location}` : '',
      description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');
    
    // Create and trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    
    return { success: true, method: 'ics' };
  }

  /**
   * Get calendar button with smart behavior
   */
  getButton(event, options = {}) {
    const btn = document.createElement('button');
    btn.className = options.className || 'vbtn primary';
    btn.dataset.eventId = event.id;
    
    // Smart button text based on provider
    if (this.gcalAvailable) {
      btn.textContent = options.text || 'Add to Google Calendar';
      btn.title = 'Click to add directly to your Google Calendar';
    } else {
      btn.textContent = options.text || 'Add to Calendar';
      btn.title = 'Click to download calendar event';
    }
    
    // Handle click
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const originalText = btn.textContent;
      btn.textContent = 'Adding...';
      btn.disabled = true;
      
      try {
        const result = await this.addToCalendar(event);
        
        if (result.success) {
          btn.textContent = '✓ Added';
          btn.classList.add('success');
          
          // Show success feedback
          if (result.method === 'google') {
            this.showToast('Added to Google Calendar');
          } else {
            this.showToast('Calendar event downloaded');
          }
        }
      } catch (error) {
        console.error('Failed to add to calendar:', error);
        btn.textContent = 'Failed';
        btn.classList.add('error');
        this.showToast('Failed to add event', 'error');
        
        // Reset after delay
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('error');
        }, 2000);
      }
    });
    
    return btn;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Add animation styles if not present
if (!document.querySelector('#calendar-smart-styles')) {
  const style = document.createElement('style');
  style.id = 'calendar-smart-styles';
  style.textContent = `
    @keyframes slideUp {
      from { transform: translate(-50%, 100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideDown {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, 100%); opacity: 0; }
    }
    .vbtn.success {
      background: linear-gradient(135deg, #27ae60, #2ecc71) !important;
    }
    .vbtn.error {
      background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
    }
  `;
  document.head.appendChild(style);
}

// Export singleton instance
export default new SmartCalendar();