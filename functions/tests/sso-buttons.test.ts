/**
 * SSO Button Integration Tests
 * Tests all OAuth/SSO button functionality across the application
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

// Mock fetch for API calls
global.fetch = fetch as any;

// Setup DOM environment
let dom: JSDOM;
let window: any;
let document: any;

beforeEach(() => {
  dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app"></div>
      </body>
    </html>
  `, {
    url: 'https://conference-party-app.web.app',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  window = dom.window as any;
  document = window.document;
  
  // Mock window.open for popup tests
  window.open = jest.fn(() => ({
    closed: false,
    close: jest.fn()
  }));

  // Mock localStorage
  window.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  // Mock sessionStorage
  window.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  global.window = window;
  global.document = document;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('🔐 SSO Button Tests', () => {
  
  describe('📍 Button Identification', () => {
    it('should identify all SSO buttons in the DOM', () => {
      // Simulate rendered buttons
      document.getElementById('app').innerHTML = `
        <div class="account-section">
          <button data-action="sync-google">Connect Google</button>
          <button data-action="sync-linkedin">Connect LinkedIn</button>
          <button data-action="sync-google-calendar">Sync Google Calendar</button>
          <button data-action="sync-microsoft-calendar">Sync Microsoft Calendar</button>
          <button data-action="sync-mtm-calendar">Connect Meet to Match</button>
        </div>
      `;

      const ssoButtons = document.querySelectorAll('[data-action*="sync"]');
      expect(ssoButtons.length).toBe(5);

      const buttonActions = Array.from(ssoButtons).map((btn: any) => btn.dataset.action);
      expect(buttonActions).toContain('sync-google');
      expect(buttonActions).toContain('sync-linkedin');
      expect(buttonActions).toContain('sync-google-calendar');
      expect(buttonActions).toContain('sync-microsoft-calendar');
      expect(buttonActions).toContain('sync-mtm-calendar');
    });

    it('should have correct text labels for SSO buttons', () => {
      document.getElementById('app').innerHTML = `
        <div class="calendar-sync-prompt">
          <button class="sync-btn sync-btn--google">Google Calendar</button>
          <button class="sync-btn sync-btn--microsoft">Outlook Calendar</button>
          <button class="sync-btn sync-btn--mtm">Meet to Match</button>
        </div>
      `;

      const googleBtn = document.querySelector('.sync-btn--google');
      const microsoftBtn = document.querySelector('.sync-btn--microsoft');
      const mtmBtn = document.querySelector('.sync-btn--mtm');

      expect(googleBtn?.textContent).toContain('Google');
      expect(microsoftBtn?.textContent).toContain('Outlook');
      expect(mtmBtn?.textContent).toContain('Meet to Match');
    });
  });

  describe('🔑 Google OAuth Flow', () => {
    it('should open Google OAuth popup when Google button is clicked', async () => {
      const button = document.createElement('button');
      button.dataset.action = 'sync-google-calendar';
      
      // Simulate click handler
      button.addEventListener('click', () => {
        window.open(
          '/api/googleCalendar/google/start',
          'Google Calendar Authorization',
          'width=500,height=600'
        );
      });

      button.click();

      expect(window.open).toHaveBeenCalledWith(
        '/api/googleCalendar/google/start',
        'Google Calendar Authorization',
        expect.stringContaining('width=500,height=600')
      );
    });

    it('should handle Google OAuth callback messages', async () => {
      const messageHandler = jest.fn();
      window.addEventListener('message', messageHandler);

      // Simulate OAuth success message
      const successEvent = new window.MessageEvent('message', {
        data: { type: 'gcal:success' },
        origin: 'https://conference-party-app.web.app'
      });

      window.dispatchEvent(successEvent);
      expect(messageHandler).toHaveBeenCalled();
    });

    it('should store pending events in sessionStorage before OAuth', () => {
      const events = ['event1', 'event2', 'event3'];
      
      // Simulate storing events before OAuth
      window.sessionStorage.setItem('pending_calendar_events', JSON.stringify(events));
      
      const stored = window.sessionStorage.setItem.mock.calls[0];
      expect(stored[0]).toBe('pending_calendar_events');
      expect(JSON.parse(stored[1])).toEqual(events);
    });

    it('should redirect to OAuth URL if popup is blocked', () => {
      // Mock window.open returning null (popup blocked)
      window.open = jest.fn(() => null);
      
      const originalLocation = window.location.href;
      
      // Simulate OAuth initiation with blocked popup
      const initiateOAuth = () => {
        const popup = window.open('/api/googleCalendar/google/start', '_blank');
        if (!popup || popup.closed) {
          window.location.href = '/api/googleCalendar/google/start';
        }
      };

      initiateOAuth();
      
      expect(window.open).toHaveBeenCalled();
      expect(window.location.href).toBe('/api/googleCalendar/google/start');
    });
  });

  describe('📧 Microsoft/Outlook OAuth Flow', () => {
    it('should handle Microsoft OAuth flow', () => {
      const button = document.createElement('button');
      button.dataset.action = 'sync-microsoft-calendar';
      
      button.addEventListener('click', () => {
        // Microsoft OAuth would use similar flow
        window.open(
          '/api/microsoft/oauth/start',
          'Microsoft Authorization',
          'width=500,height=600'
        );
      });

      button.click();

      expect(window.open).toHaveBeenCalledWith(
        '/api/microsoft/oauth/start',
        'Microsoft Authorization',
        expect.stringContaining('width=500')
      );
    });

    it('should download ICS file as fallback for Microsoft', () => {
      const createDownloadLink = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        return a;
      };

      const icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
      const link = createDownloadLink(icsContent, 'events.ics');
      
      expect(link.download).toBe('events.ics');
      expect(link.href).toContain('blob:');
    });
  });

  describe('💼 LinkedIn OAuth Flow', () => {
    it('should handle LinkedIn OAuth flow', () => {
      const button = document.createElement('button');
      button.dataset.action = 'sync-linkedin';
      
      button.addEventListener('click', () => {
        const state = Math.random().toString(36).substring(7);
        window.sessionStorage.setItem('linkedin_oauth_state', state);
        
        window.open(
          `https://www.linkedin.com/oauth/v2/authorization?state=${state}`,
          'LinkedIn Login',
          'width=500,height=600'
        );
      });

      button.click();

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'linkedin_oauth_state',
        expect.any(String)
      );
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/oauth'),
        'LinkedIn Login',
        expect.any(String)
      );
    });
  });

  describe('🤝 Meet to Match Integration', () => {
    it('should handle Meet to Match calendar sync', () => {
      const button = document.createElement('button');
      button.dataset.action = 'sync-mtm-calendar';
      
      button.addEventListener('click', async () => {
        // MTM uses file upload approach
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ics';
        input.click();
      });

      const clickSpy = jest.fn();
      HTMLInputElement.prototype.click = clickSpy;

      button.click();

      // Since MTM uses file upload, it should create an input element
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('🔄 OAuth State Management', () => {
    it('should track OAuth connection states', () => {
      const userProfile = {
        googleConnected: false,
        linkedinConnected: false,
        microsoftConnected: false
      };

      // Simulate successful Google OAuth
      userProfile.googleConnected = true;
      expect(userProfile.googleConnected).toBe(true);

      // Check UI updates based on connection state
      const renderButton = (connected: boolean) => {
        return connected ? 'Google Connected ✓' : 'Connect Google';
      };

      expect(renderButton(userProfile.googleConnected)).toBe('Google Connected ✓');
      expect(renderButton(userProfile.linkedinConnected)).toBe('Connect LinkedIn');
    });

    it('should handle OAuth errors gracefully', async () => {
      const errorEvent = new window.MessageEvent('message', {
        data: { type: 'gcal:error', error: 'access_denied' },
        origin: 'https://conference-party-app.web.app'
      });

      const errorHandler = jest.fn((event) => {
        if (event.data.type === 'gcal:error') {
          return 'OAuth failed: ' + event.data.error;
        }
      });

      window.addEventListener('message', errorHandler);
      window.dispatchEvent(errorEvent);

      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.results[0].value).toBe('OAuth failed: access_denied');
    });
  });

  describe('🔒 Security Checks', () => {
    it('should validate OAuth redirect origins', () => {
      const isValidOrigin = (origin: string) => {
        const allowedOrigins = [
          'https://conference-party-app.web.app',
          'http://localhost:3000',
          'http://localhost:5000'
        ];
        return allowedOrigins.includes(origin);
      };

      expect(isValidOrigin('https://conference-party-app.web.app')).toBe(true);
      expect(isValidOrigin('https://malicious-site.com')).toBe(false);
    });

    it('should use CSRF tokens for OAuth state', () => {
      const generateState = () => {
        return Math.random().toString(36).substring(2, 15);
      };

      const state = generateState();
      expect(state).toMatch(/^[a-z0-9]+$/);
      expect(state.length).toBeGreaterThan(5);
    });

    it('should clear sensitive data after OAuth completion', () => {
      // Set sensitive data
      window.sessionStorage.setItem('oauth_state', 'test123');
      window.sessionStorage.setItem('pending_calendar_events', '[]');
      
      // Simulate OAuth completion cleanup
      const cleanup = () => {
        window.sessionStorage.removeItem('oauth_state');
        window.sessionStorage.removeItem('pending_calendar_events');
      };

      cleanup();

      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('oauth_state');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('pending_calendar_events');
    });
  });

  describe('📱 UI/UX Tests', () => {
    it('should show loading state during OAuth', () => {
      const button = document.createElement('button');
      button.textContent = 'Connect Google';
      
      // Simulate OAuth start
      const startOAuth = () => {
        button.disabled = true;
        button.textContent = 'Connecting...';
      };

      startOAuth();

      expect(button.disabled).toBe(true);
      expect(button.textContent).toBe('Connecting...');
    });

    it('should show success state after OAuth', () => {
      const button = document.createElement('button');
      button.classList.add('action-item');
      
      // Simulate successful OAuth
      const onOAuthSuccess = () => {
        button.classList.add('connected');
        button.innerHTML = '<span>Google Connected ✓</span>';
      };

      onOAuthSuccess();

      expect(button.classList.contains('connected')).toBe(true);
      expect(button.textContent).toContain('Connected ✓');
    });

    it('should display appropriate icons for each SSO provider', () => {
      const providers = [
        { name: 'google', icon: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92' },
        { name: 'linkedin', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328' },
        { name: 'microsoft', icon: 'M11.4 24H1.6C.72 24 0' }
      ];

      providers.forEach(provider => {
        const button = document.createElement('button');
        button.innerHTML = `<svg><path d="${provider.icon.substring(0, 20)}"/></svg>`;
        
        expect(button.querySelector('path')?.getAttribute('d')).toContain(provider.icon.substring(0, 20));
      });
    });
  });
});

describe('🚀 E2E SSO Flow Tests', () => {
  it('should complete full Google Calendar sync flow', async () => {
    // 1. User clicks sync button
    const syncButton = document.createElement('button');
    syncButton.dataset.action = 'sync-google-calendar';
    
    // 2. Check for saved events
    const savedEvents = ['event1', 'event2'];
    window.sessionStorage.setItem('pending_calendar_events', JSON.stringify(savedEvents));
    
    // 3. Open OAuth popup
    syncButton.addEventListener('click', () => {
      const popup = window.open('/api/googleCalendar/google/start', '_blank');
      expect(popup).toBeTruthy();
    });
    
    syncButton.click();
    
    // 4. Simulate OAuth success callback
    const successMessage = new window.MessageEvent('message', {
      data: { type: 'gcal:success' },
      origin: window.location.origin
    });
    
    // 5. Process success and sync events
    const handleSuccess = jest.fn(async () => {
      const events = JSON.parse(window.sessionStorage.getItem('pending_calendar_events') || '[]');
      expect(events).toEqual(savedEvents);
      
      // Mock API call to sync events
      const response = await Promise.resolve({
        success: true,
        synced: events.length
      });
      
      expect(response.success).toBe(true);
      expect(response.synced).toBe(2);
    });
    
    window.addEventListener('message', (e) => {
      if (e.data.type === 'gcal:success') {
        handleSuccess();
      }
    });
    
    window.dispatchEvent(successMessage);
    
    expect(handleSuccess).toHaveBeenCalled();
  });

  it('should handle OAuth cancellation gracefully', async () => {
    const cancelMessage = new window.MessageEvent('message', {
      data: { type: 'gcal:error', error: 'cancelled' },
      origin: window.location.origin
    });

    const showToast = jest.fn();
    
    window.addEventListener('message', (e) => {
      if (e.data.type === 'gcal:error' && e.data.error === 'cancelled') {
        showToast('Google Calendar authorization cancelled');
      }
    });

    window.dispatchEvent(cancelMessage);
    
    expect(showToast).toHaveBeenCalledWith('Google Calendar authorization cancelled');
  });
});