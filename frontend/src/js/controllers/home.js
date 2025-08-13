/**
 * HOME CONTROLLER
 * Main dashboard view for Professional Intelligence Platform
 */

import { Store } from '../store.js?v=b022';
import { Events } from '../events.js?v=b022';
import { renderStatusCard, renderHotspots, renderEvents } from '../ui/homeViews.js?v=b022';
import { mountSignalField } from '../ui/canvasField.js?v=b022';
import * as Proximity from '../services/proximity.js?v=b022';
import * as API from '../services/api.js?v=b022';

export function HomeController(section){
  const statusMount = section.querySelector('#status-card');
  const hotspotsMount = section.querySelector('#hotspots');
  const canvas = section.querySelector('#signal-field');

  // Signal Field mount
  const field = mountSignalField(canvas, () => Store.get().hotspots);

  // Render loop (store subscription)
  const unsub = Store.on(s => {
    renderStatusCard(statusMount, s);
    renderHotspots(hotspotsMount, s.hotspots);
  });

  // First data fetch
  Proximity.fetchHotspots().then(hs => Store.patch('hotspots', hs)).then(()=> field.refresh());

  // Event handlers
  Events.on('intent.toggle', ()=>{
    const s=Store.get(); const on = !s.intent.on;
    Store.patch('intent', { ...s.intent, on });
    // (Optional: call backend)
    API.setIntent({ on, tags: s.intent.tags }).catch(()=> Store.patch('intent', s.intent));
  });

  Events.on('presence.edit', () => {
    // Simple demo: toggle level
    const s=Store.get();
    const level = s.presence.level === 'city' ? 'venue' : 'city';
    Store.patch('presence', { ...s.presence, level });
    API.setPresence(Store.get().presence).catch(()=> Store.patch('presence', s.presence));
  });

  Events.on('hotspot.reveal', async ({el})=>{
    const id = el.dataset.id;
    const list = await Proximity.reveal(id); // [{name, role, note}]
    openRevealSheet(list);
    if (navigator.vibrate) navigator.vibrate(10);
  });

  // Tonight events (optional initial fetch)
  API.listEvents({ when:'tonight' }).then(list => {
    Store.patch('events', list);
    const eventsSection = document.querySelector('[data-route="events"] #tonight');
    if (eventsSection) renderEvents(eventsSection, list);
  });

  section.addEventListener('route:enter', ()=> field.refresh());

  function openRevealSheet(list){
    const tpl = document.getElementById('tpl-reveal-sheet');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.querySelector('#reveal-list').innerHTML = list.map(it => `
      <div class="card"><div style="font-weight:700">${it.name}</div><div style="color:var(--text-secondary)">${it.role}</div></div>
    `).join('');
    document.body.appendChild(node);
    const close = ()=> node.remove();
    node.querySelector('[data-action="sheet.close"]').addEventListener('click', close, { once:true });
  }

  return ()=> unsub();
}

// Legacy class-based controller for backward compatibility
export default class HomeControllerLegacy {
  constructor(context) {
    this.context = context;
    this.subscriptions = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    // Show loading state
    store.actions.showLoading('Loading professional network...');
    
    try {
      // Check if user is onboarded
      if (!store.getters.isOnboarded()) {
        window.router.navigate('/onboarding');
        return;
      }
      
      // Load initial data in parallel
      await Promise.all([
        this.loadEvents(),
        this.loadOpportunities(),
        this.loadNearbyProfessionals()
      ]);
      
      // Render view
      this.render();
      
      // Set up subscriptions
      this.setupSubscriptions();
      
      // Initialize animations
      motion.initializeView('home');
      
      // Start proximity if enabled
      if (store.get('proximity.enabled')) {
        proximity.startTracking();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Home initialization error:', error);
      store.actions.showError('Failed to load dashboard');
    } finally {
      store.actions.hideLoading();
    }
  }

  async loadEvents() {
    try {
      const events = await api.getEvents();
      store.actions.setEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  async loadOpportunities() {
    try {
      const opps = await opportunities.getMatches();
      store.actions.setOpportunities(opps);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    }
  }

  async loadNearbyProfessionals() {
    if (!store.get('proximity.enabled')) return;
    
    try {
      const nearby = await proximity.getNearbyProfessionals();
      store.actions.updateProximity({ professionals: nearby });
    } catch (error) {
      console.error('Failed to load nearby professionals:', error);
    }
  }

  render() {
    const container = document.getElementById('main');
    if (!container) return;
    
    // Get current state
    const user = store.get('user');
    const events = store.get('events.filtered');
    const matches = store.getters.matchingOpportunities();
    const nearby = store.get('proximity.professionals');
    
    // Render home view
    container.innerHTML = homeViews.dashboard({
      user,
      events: events.slice(0, 6), // Show first 6 events
      opportunities: matches.slice(0, 3), // Show top 3 matches
      nearbyProfessionals: nearby.slice(0, 5), // Show 5 nearby
      stats: {
        connections: store.getters.connectionCount(),
        savedEvents: store.getters.savedEventsCount(),
        opportunities: matches.length,
        nearbyNow: nearby.length
      }
    });
    
    // Attach event listeners
    this.attachEventListeners();
  }

  setupSubscriptions() {
    // Re-render on relevant state changes
    this.subscriptions.push(
      store.subscribe('events.filtered', () => this.updateEventsList()),
      store.subscribe('opportunities.matches', () => this.updateOpportunities()),
      store.subscribe('proximity.professionals', () => this.updateNearbyList()),
      store.subscribe('user.level', () => this.updateUserLevel())
    );
  }

  attachEventListeners() {
    // Quick action buttons
    const viewAllEvents = document.getElementById('viewAllEvents');
    if (viewAllEvents) {
      viewAllEvents.addEventListener('click', () => {
        window.router.navigate('/events');
      });
    }
    
    const viewPeople = document.getElementById('viewPeople');
    if (viewPeople) {
      viewPeople.addEventListener('click', () => {
        window.router.navigate('/people');
      });
    }
    
    const viewOpportunities = document.getElementById('viewOpportunities');
    if (viewOpportunities) {
      viewOpportunities.addEventListener('click', () => {
        window.router.navigate('/opportunities');
      });
    }
    
    // Event cards
    document.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const eventId = card.dataset.eventId;
        if (eventId) {
          window.router.navigate(`/events/${eventId}`);
        }
      });
    });
    
    // Opportunity cards
    document.querySelectorAll('.opportunity-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const oppId = card.dataset.opportunityId;
        if (oppId) {
          this.handleOpportunityClick(oppId);
        }
      });
    });
    
    // Professional cards
    document.querySelectorAll('.professional-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const userId = card.dataset.userId;
        if (userId) {
          this.handleProfessionalClick(userId);
        }
      });
    });
    
    // Enable proximity button
    const enableProximity = document.getElementById('enableProximity');
    if (enableProximity) {
      enableProximity.addEventListener('click', async () => {
        await proximity.requestPermission();
        proximity.startTracking();
        this.updateNearbyList();
      });
    }
  }

  updateEventsList() {
    const eventsContainer = document.getElementById('eventsList');
    if (!eventsContainer) return;
    
    const events = store.get('events.filtered').slice(0, 6);
    eventsContainer.innerHTML = homeViews.eventsList(events);
    
    // Animate new items
    motion.animateList(eventsContainer.querySelectorAll('.event-card'));
  }

  updateOpportunities() {
    const oppsContainer = document.getElementById('opportunitiesList');
    if (!oppsContainer) return;
    
    const matches = store.getters.matchingOpportunities().slice(0, 3);
    oppsContainer.innerHTML = homeViews.opportunitiesList(matches);
    
    // Animate new items
    motion.animateList(oppsContainer.querySelectorAll('.opportunity-card'));
  }

  updateNearbyList() {
    const nearbyContainer = document.getElementById('nearbyList');
    if (!nearbyContainer) return;
    
    const nearby = store.get('proximity.professionals').slice(0, 5);
    nearbyContainer.innerHTML = homeViews.nearbyList(nearby);
    
    // Animate with proximity effect
    motion.proximityPulse(nearbyContainer.querySelectorAll('.professional-card'));
  }

  updateUserLevel() {
    const levelDisplay = document.getElementById('userLevel');
    if (!levelDisplay) return;
    
    const level = store.get('user.level');
    levelDisplay.innerHTML = homeViews.levelBadge(level);
    
    // Animate level change
    motion.levelUp(levelDisplay);
  }

  async handleOpportunityClick(opportunityId) {
    const opportunity = store.get('opportunities.available')
      .find(o => o.id === opportunityId);
    
    if (!opportunity) return;
    
    // Show opportunity modal
    store.actions.openModal({
      type: 'opportunity',
      data: opportunity,
      actions: {
        apply: async () => {
          await opportunities.apply(opportunityId);
          store.actions.showNotification('Application sent!');
          store.actions.closeModal();
        },
        dismiss: () => {
          store.actions.closeModal();
        }
      }
    });
  }

  async handleProfessionalClick(userId) {
    // Show professional profile modal
    const professional = store.get('proximity.professionals')
      .find(p => p.id === userId);
    
    if (!professional) return;
    
    store.actions.openModal({
      type: 'profile',
      data: professional,
      actions: {
        connect: async () => {
          await api.sendConnectionRequest(userId);
          store.actions.showNotification('Connection request sent!');
          store.actions.closeModal();
        },
        message: () => {
          window.router.navigate(`/messages/${userId}`);
          store.actions.closeModal();
        }
      }
    });
  }

  destroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    // Stop proximity tracking if only used on home
    if (store.get('proximity.enabled')) {
      proximity.stopTracking();
    }
    
    // Clean up animations
    motion.cleanup();
    
    this.initialized = false;
  }
}