// Production App Bootstrap - Consolidated initialization
// Version: 2.0.0 - Cache Version: 1754872638
// FORCE CACHE CLEAR VERSION
import { Store, Events } from './state.js';
import Auth from './auth-enhanced.js';
import Invite from './invite-enhanced.js';
import { panelEnter, staggerChildren, microTapFeedback, initMotion } from './motion.js';
import './panel-reward-strip.js';
import './contacts.js';
import { initEmailSyncPrompt } from './emailSyncPrompt.js';
import './globalEmailSync.js';
import { renderEventCard, getSavedEventIds, eventActions } from './ui/eventCard.js';

// App Configuration
const CONFIG = {
  version: '2.0.0',
  cacheVersion: '1754872638',
  apiBase: '/api',
  googleClientId: '1234567890.apps.googleusercontent.com', // Replace with real
  linkedinClientId: '77chexyx9j5j8p', // Replace with real
  environment: detectEnvironment()
};

function detectEnvironment() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development';
  if (hostname.includes('staging')) return 'staging';
  return 'production';
}

// Initialize PWA install prompt
let deferredPrompt = null;
const isStandalone = () => 
  window.matchMedia('(display-mode: standalone)').matches || 
  window.navigator.standalone === true;

function initPWAInstall() {
  if (isStandalone()) {
    Store.patch('pwa.standalone', true);
    return;
  }
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    Store.patch('pwa.installable', true);
    
    // Show install prompt after delay
    setTimeout(() => showInstallPrompt(), 3000);
  });
  
  window.addEventListener('appinstalled', () => {
    Store.patch('pwa.installed', true);
    Events.emit('ui:toast', { type: 'success', message: 'App installed! 🎉' });
    hideInstallPrompt();
    
    // Bonus invites for install
    const currentInvites = Store.get('invites.left') || 10;
    Store.patch('invites.left', currentInvites + 2);
    Events.emit('ui:toast', { type: 'success', message: '+2 bonus invites!' });
  });
}

function showInstallPrompt() {
  const card = document.getElementById('install-card');
  if (card && deferredPrompt) {
    card.classList.add('visible');
  }
}

function hideInstallPrompt() {
  const card = document.getElementById('install-card');
  if (card) {
    card.classList.remove('visible');
  }
}

// Initialize router with hash-based navigation
function initRouter() {
  function parseRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, query] = hash.split('?');
    const parts = path.split('/').filter(Boolean);
    
    if (!parts.length) return { name: 'home', path: '/' };
    if (parts[0] === 'events') return { name: 'events', path: '/events' };
    if (parts[0] === 'people') return { name: 'people', path: '/people' };
    if (parts[0] === 'opportunities') return { name: 'opportunities', path: '/opportunities' };
    if (parts[0] === 'me') return { name: 'me', path: '/me' };
    if (parts[0] === 'onboarding') return { name: 'onboarding', path: '/onboarding' };
    if (parts[0] === 'invite' && parts[1]) return { name: 'invite', code: parts[1], path: `/invite/${parts[1]}` };
    
    return { name: 'unknown', path };
  }
  
  function route() {
    const routeInfo = parseRoute();
    Events.emit('route:change', routeInfo);
    updateNavigation(routeInfo);
  }
  
  function updateNavigation(routeInfo) {
    // Clear all active states
    document.querySelectorAll('.nav-item').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Map route names to data-route values
    const routeMap = {
      'home': 'parties',
      'events': 'parties', 
      'people': 'hotspots',
      'opportunities': 'opportunities',
      'calendar': 'calendar',
      'invites': 'invites',
      'me': 'me'
    };
    
    const routeName = routeMap[routeInfo.name] || routeInfo.name;
    const activeTab = document.querySelector(`[data-route="${routeName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }
  
  // Navigation handler
  Events.on('navigate', (path) => {
    const newHash = path.startsWith('#') ? path : '#' + path;
    window.location.hash = newHash;
  });
  
  window.addEventListener('hashchange', route);
  
  // CRITICAL: Add sidebar navigation click handlers
  function initSidebarNavigation() {
    document.querySelectorAll('.nav-item[data-route]').forEach(navItem => {
      navItem.addEventListener('click', (e) => {
        e.preventDefault();
        const routeName = navItem.dataset.route;
        
        // Map data-route to actual hash routes
        const hashMap = {
          'parties': '#/events',
          'hotspots': '#/people', 
          'opportunities': '#/opportunities',
          'calendar': '#/calendar',
          'invites': '#/invites',
          'me': '#/me'
        };
        
        const hash = hashMap[routeName] || `#/${routeName}`;
        window.location.hash = hash;
        
        console.log(`🧭 Navigation: ${routeName} -> ${hash}`);
      });
    });
    
    console.log('✅ Sidebar navigation handlers attached');
  }
  
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarNavigation);
  } else {
    initSidebarNavigation();
  }
  
  window.addEventListener('hashchange', route);
  route(); // Initial route
}

// Initialize UI feedback system
function initUIFeedback() {
  // Toast system
  Events.on('ui:toast', ({ message, type = 'info', duration = 3000 }) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  });
  
  // Loading states
  Events.on('ui:loading', ({ container, message = 'Loading...' }) => {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (el) {
      el.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${message}</p></div>`;
    }
  });
  
  // Empty states
  Events.on('ui:empty', ({ container, icon = '📭', title = 'No Content', message = 'Nothing here yet.' }) => {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (el) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${icon}</div>
          <h2 class="empty-state-title">${title}</h2>
          <p class="empty-state-message">${message}</p>
        </div>`;
    }
  });
}

// Initialize events controller
function initEventsController() {
  async function loadParties() {
    const container = document.querySelector('#event-list, #main-content');
    if (!container) return;
    
    Events.emit('ui:loading', { container, message: 'Loading parties...' });
    
    try {
      // Try API first, fallback to local data
      let events = [];
      try {
        const apiUrl = '/api/parties?conference=gamescom2025';
        console.log('🔄 [API DEBUG] Fetching parties from:', apiUrl);
        console.log('🔄 [API DEBUG] Full URL:', window.location.origin + apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          cache: 'no-cache', // Bypass service worker for debugging
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 [API DEBUG] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('📄 [API DEBUG] Raw response body:', responseText.substring(0, 500) + '...');
          
          try {
            events = JSON.parse(responseText);
            console.log('✅ [API DEBUG] Successfully parsed JSON:', {
              isArray: Array.isArray(events),
              length: events?.length,
              firstItem: events?.[0]
            });
          } catch (parseError) {
            console.error('❌ [API DEBUG] JSON parse error:', parseError);
            console.log('📄 [API DEBUG] Full response that failed to parse:', responseText);
            throw parseError;
          }
        } else {
          console.error('❌ [API DEBUG] API response not ok:', response.status, response.statusText);
          throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }
      } catch (e) {
        console.error('❌ [API DEBUG] API call failed, trying fallback:', e);
        console.log('🔄 [API DEBUG] Attempting fallback to local data...');
        
        const localResponse = await fetch('/data/parties.json', { cache: 'no-cache' });
        console.log('📥 [API DEBUG] Fallback response:', {
          status: localResponse.status,
          ok: localResponse.ok
        });
        
        if (localResponse.ok) {
          events = await localResponse.json();
          console.log('✅ [API DEBUG] Fallback data loaded:', events?.length, 'events');
        } else {
          console.error('❌ [API DEBUG] Fallback also failed');
          throw e;
        }
      }
      
      if (!events.length) {
        Events.emit('ui:empty', { 
          container, 
          icon: '🎉', 
          title: 'No Parties Yet',
          message: 'New parties will appear here as they\'re announced.'
        });
        return;
      }
      
      Store.set('events', events);
      renderEvents(events, container);
      
      // Track events viewed for contextual hints
      const currentViewed = Store.get('meta.eventsViewed') || 0;
      Store.set('meta.eventsViewed', currentViewed + 1);
      
      // Emit events loaded for reward strip
      Events.emit('events:loaded', { count: events.length });
      
    } catch (error) {
      console.error('Failed to load parties:', error);
      Events.emit('ui:empty', { 
        container, 
        icon: '❌', 
        title: 'Failed to Load',
        message: 'Unable to fetch party data. Please try again.'
      });
    }
  }
  
  function renderEvents(events, container) {
    const savedIds = getSavedEventIds();
    
    // Add event-grid class to container for proper styling
    container.className = (container.className || '') + ' event-grid';
    
    const html = events.map(event => {
      const saved = savedIds.includes(event.id || event.eventId);
      const badge = event.tier || event.category || event.priority || null;
      return renderEventCard(event, { saved, badge });
    }).join('');
    
    container.innerHTML = html;
    
    // Trigger motion effects
    panelEnter(container);
    staggerChildren(container, '.evcard');
    
    // Premium event card handlers
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      
      const eventId = btn.dataset.id; // Note: new cards use data-id, not data-event-id
      const action = btn.dataset.action;
      
      if (!eventId || !action) return;
      
      // Use the new event actions system
      switch (action) {
        case 'save':
          eventActions.toggleSave(eventId, events);
          break;
        case 'share':
          eventActions.share(eventId, events);
          break;
        case 'rsvp':
          eventActions.rsvp(eventId, events);
          break;
        case 'nav':
        case 'navigate':
          eventActions.navigate(eventId, events);
          break;
        case 'calendar':
          // Legacy support - export to calendar
          const event = events.find(e => (e.id || e.eventId) === eventId);
          if (event) exportEventToCalendar(event);
          break;
      }
    });
  }
  
  function toggleSaveEvent(event, btn) {
    const saved = Store.get('events.selected') || [];
    const exists = saved.some(e => e.id === event.id);
    
    if (exists) {
      Store.set('events.selected', saved.filter(e => e.id !== event.id));
      btn.textContent = 'Save';
      btn.className = 'btn btn-primary';
      Events.emit('ui:toast', { type: 'info', message: 'Event removed' });
    } else {
      const newSaved = [...saved, event];
      Store.set('events.selected', newSaved);
      btn.textContent = 'Saved';
      btn.className = 'btn btn-secondary';
      
      // Add success pulse animation
      btn.classList.add('success-pulse');
      btn.addEventListener('animationend', () => {
        btn.classList.remove('success-pulse');
      }, { once: true });
      
      Events.emit('ui:toast', { type: 'success', message: 'Event saved!' });
      Events.emit('event:saved', { event, saved: true });
      
      // Contextual calendar connect prompt after 2nd save
      if (newSaved.length === 2 && !Store.get('calendar.googleConnected')) {
        Events.emit('calendar:prompt');
      }
    }
  }
  
  // Render avatar groups for events
  function renderAvatars(attendees) {
    if (!attendees || !attendees.length) {
      return '<div class="avatar-group"><span class="avatar more">+?</span></div>';
    }
    
    const take = attendees.slice(0, 5);
    const extra = Math.max(0, attendees.length - take.length);
    const imgs = take.map(a => 
      `<span class="avatar" title="${escapeHtml(a.name || '')}">
        <img src="${escapeHtml(a.picture || '/assets/icons/icon-192.png')}" 
             alt="${escapeHtml(a.name || 'Attendee')}" 
             loading="lazy">
       </span>`
    ).join('');
    const more = extra ? `<span class="avatar more">+${extra}</span>` : '';
    
    return `<div class="avatar-group">${imgs}${more}</div>`;
  }
  
  function exportEventToCalendar(event) {
    const icsContent = generateICS([event]);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title || 'event'}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Events.emit('ui:toast', { type: 'success', message: 'Calendar file downloaded' });
  }
  
  function generateICS(events) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Velocity//Gamescom 2025//EN'
    ];
    
    events.forEach(event => {
      const uid = event.id || crypto.randomUUID();
      const start = formatICSDate(event.start || event.date);
      const end = formatICSDate(addHours(event.start || event.date, 3));
      
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}@conference-party-app.web.app`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeICS(event.title || event.name)}`,
        `LOCATION:${escapeICS(event.venue || event.location || '')}`,
        'END:VEVENT'
      );
    });
    
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }
  
  Events.on('route:change', (route) => {
    if (route.name === 'events') {
      loadParties();
    }
  });
}

// Initialize GPT-5 feature event handlers
function initGPTFeatureHandlers() {
  // Handle bonus invites unlocked event
  Events.on('invites:bonus', ({ added, remaining }) => {
    console.log('🎊 Bonus invites unlocked:', { added, remaining });
    
    // Update invite badges
    const badges = document.querySelectorAll('[data-role="invite-badge"], #invite-counter');
    badges.forEach(badge => {
      badge.textContent = remaining > 0 ? remaining : '';
      badge.style.display = remaining > 0 ? 'inline-block' : 'none';
      
      // Add celebration animation
      badge.classList.add('invite-counter-update');
      setTimeout(() => badge.classList.remove('invite-counter-update'), 500);
    });
    
    // Show contextual success message
    Events.emit('ui:toast', {
      type: 'success',
      message: `🎉 +${added} bonus invites unlocked!`,
      duration: 4000
    });
  });

  // Handle address book sync requests
  Events.on('addressBook:syncRequest', ({ source, inputEl }) => {
    console.log('📧 Address book sync requested from:', source);
    
    // Track the sync request source for analytics
    Events.emit('analytics:track', {
      event: 'address_book_sync_requested',
      source,
      timestamp: Date.now()
    });
  });

  // Handle contacts connected successfully
  Events.on('contacts:connected', ({ provider, contactCount }) => {
    console.log('✅ Contacts connected successfully:', { provider, contactCount });
    
    // Show success feedback
    Events.emit('ui:toast', {
      type: 'success',
      message: `${provider} contacts synced! Email autocomplete is now active.`,
      duration: 3000
    });
    
    // Update UI to reflect connected state
    const syncButtons = document.querySelectorAll('[data-action="sync-contacts"]');
    syncButtons.forEach(btn => {
      btn.textContent = '✓ Synced';
      btn.disabled = true;
      btn.classList.add('btn-success');
    });
  });

  // Handle contact sync success for reward strip
  Events.on('contacts:sync:success', ({ provider, contactCount, message }) => {
    console.log('📊 Contact sync success for reward strip:', { provider, contactCount });
    
    // This event is handled by panel-reward-strip.js automatically
    // Just log for debugging
  });

  // Handle calendar integration prompts
  Events.on('calendar:prompt', () => {
    console.log('📅 Calendar integration prompt triggered');
    
    // Show calendar sync suggestion after user saves events
    Events.emit('ui:toast', {
      type: 'info',
      message: '📅 Connect Google Calendar to sync saved events?',
      duration: 5000
    });
  });

  // Handle event saved for contextual prompts
  Events.on('event:saved', ({ event, saved }) => {
    console.log('🎉 Event saved:', { eventTitle: event.title, saved });
    
    // Trigger calendar prompt after second saved event
    const savedEvents = Store.get('events.selected') || [];
    if (savedEvents.length === 2 && !Store.get('calendar.googleConnected')) {
      setTimeout(() => Events.emit('calendar:prompt'), 1500);
    }
  });

  // Handle analytics tracking
  Events.on('analytics:track', (data) => {
    console.log('📈 Analytics event:', data);
    
    // In production, this would send to analytics service
    // For now, just log for debugging
    if (CONFIG.environment === 'development') {
      console.table(data);
    }
  });

  console.log('🔧 GPT-5 feature event handlers initialized');
}

// Utility functions
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeICS(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatEventTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatICSDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

// Main app initialization
export default function initApp() {
  console.log('🚀 Initializing Velocity App...');
  console.log('📦 Version:', CONFIG.version, 'Cache:', CONFIG.cacheVersion);
  console.log('🔄 FORCE CACHE CLEAR VERSION - All caches invalidated');
  
  // Initialize store
  Store.init();
  Store.set('config', CONFIG);
  
  // Initialize motion system first
  initMotion();
  
  // Initialize modules
  initRouter();
  initUIFeedback();
  initEventsController();
  initPWAInstall();
  
  // Initialize auth
  Auth.initAuth();
  
  // Initialize invites
  Invite.refreshInviteStats();
  
  // Initialize email sync prompt (after auth to check connection status)
  initEmailSyncPrompt();
  
  // Initialize GPT-5 feature event handlers
  initGPTFeatureHandlers();
  
  // Wire up navigation
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    
    e.preventDefault();
    const tabName = tab.dataset.tab;
    const routes = {
      now: '/',
      people: '/people',
      opportunities: '/opportunities', 
      events: '/events',
      me: '/me'
    };
    
    const route = routes[tabName];
    if (route) Events.emit('navigate', route);
  });
  
  // Wire up install button
  document.getElementById('install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      }
      deferredPrompt = null;
    }
  });
  
  document.getElementById('install-dismiss')?.addEventListener('click', hideInstallPrompt);
  
  // Global error handling
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (CONFIG.environment === 'production') {
      Events.emit('ui:toast', { type: 'error', message: 'Something went wrong' });
    }
  });
  
  console.log('✅ App initialized');
  Events.emit('app:ready');
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);