/**
 * PEOPLE CONTROLLER
 * Professional networking discovery for nearby professionals
 */

import { Store } from '../store.js?v=b022';

export function PeopleController(section){
  const list = section.querySelector('#people-list');
  const tabs = section.querySelectorAll('.tab');

  tabs.forEach(t=> t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('is-active'));
    t.classList.add('is-active');
    const tab = t.dataset.tab;
    render(tab);
  }));

  function render(tab){
    if (tab==='nearby'){
      list.innerHTML = `<div class="card">Privacy-first. Reveal appears when thresholds met via Hotspots.</div>`;
    } else if (tab==='matches'){
      list.innerHTML = `<div class="card">Matches appear when your intent intersects with others' consent.</div>`;
    } else {
      const hist = Store.get().network.history || [];
      list.innerHTML = hist.map(h=>`
        <div class="conference-item">
          <div class="conference-badge">${h.badge||'EV'}</div>
          <div class="conference-details">
            <div class="conference-name">${h.name}</div>
            <div class="conference-stats">${h.connections||0} connections, ${h.events||0} events</div>
          </div>
        </div>
      `).join('') || `<div class="card">No history yet.</div>`;
    }
  }

  section.addEventListener('route:enter', ()=> render('nearby'));
}

// Legacy class-based controller for backward compatibility
export default class PeopleControllerLegacy {
  constructor(context) {
    this.context = context;
    this.subscriptions = [];
    this.initialized = false;
    this.currentTab = 'nearby';
  }

  async init() {
    if (this.initialized) return;

    try {
      // Show current view
      this.showCurrentView();
      
      // Load initial data
      await this.loadData();
      
      // Render interface
      this.render();
      
      // Set up subscriptions
      this.setupSubscriptions();
      
      // Initialize animations
      motion.initializeView('people');
      
      this.initialized = true;
    } catch (error) {
      console.error('People controller initialization error:', error);
      store.actions.showError('Failed to load people');
    }
  }

  async loadData() {
    // Start proximity tracking if not already enabled
    if (!store.get('proximity.enabled')) {
      await proximity.requestPermission();
    }
    
    // Load nearby professionals
    await this.loadNearbyProfessionals();
    
    // Load opportunity matches
    await this.loadOpportunityMatches();
    
    // Load alumni connections
    await this.loadAlumniConnections();
  }

  async loadNearbyProfessionals() {
    try {
      const location = await proximity.getCurrentLocation();
      const nearby = await api.getNearbyProfessionals(location);
      store.actions.updateProximity({ professionals: nearby });
    } catch (error) {
      console.warn('Failed to load nearby professionals:', error);
    }
  }

  async loadOpportunityMatches() {
    try {
      const matches = await api.getOpportunities({ type: 'matches' });
      store.set('opportunities.matches', matches);
    } catch (error) {
      console.warn('Failed to load opportunity matches:', error);
    }
  }

  async loadAlumniConnections() {
    try {
      const alumni = await api.getAlumniConnections();
      store.set('network.alumni', alumni);
    } catch (error) {
      console.warn('Failed to load alumni:', error);
    }
  }

  showCurrentView() {
    // Show people section, hide others
    document.querySelectorAll('[data-route]').forEach(section => {
      section.hidden = section.dataset.route !== 'people';
    });
  }

  render() {
    const peopleList = document.getElementById('people-list');
    if (!peopleList) return;

    // Render based on current tab
    switch (this.currentTab) {
      case 'nearby':
        this.renderNearbyPeople(peopleList);
        break;
      case 'matches':
        this.renderMatches(peopleList);
        break;
      case 'alumni':
        this.renderAlumni(peopleList);
        break;
    }
  }

  renderNearbyPeople(container) {
    const nearby = store.get('proximity.professionals') || [];
    
    if (nearby.length === 0) {
      container.innerHTML = templates.emptyState({
        icon: '📍',
        title: 'No one nearby',
        subtitle: 'Enable location to find professionals around you',
        action: 'Enable Location',
        actionHandler: 'proximity.enable'
      });
      return;
    }

    container.innerHTML = nearby.map(person => 
      templates.profileCard({
        ...person,
        distance: person.distance,
        isNearby: true
      })
    ).join('');

    // Add proximity animations
    motion.proximityPulse(container.querySelectorAll('.profile-card'));
  }

  renderMatches(container) {
    const matches = store.get('opportunities.matches') || [];
    
    if (matches.length === 0) {
      container.innerHTML = templates.emptyState({
        icon: '🎯',
        title: 'No matches yet',
        subtitle: 'Complete your profile to find better matches',
        action: 'Update Profile',
        actionHandler: 'profile.edit'
      });
      return;
    }

    container.innerHTML = matches.map(match => 
      templates.opportunityMatch({
        ...match,
        isMatch: true
      })
    ).join('');
  }

  renderAlumni(container) {
    const alumni = store.get('network.alumni') || [];
    
    if (alumni.length === 0) {
      container.innerHTML = templates.emptyState({
        icon: '🎓',
        title: 'No alumni connections',
        subtitle: 'Connect with people from past conferences',
        action: 'Browse Alumni',
        actionHandler: 'alumni.browse'
      });
      return;
    }

    container.innerHTML = alumni.map(person => 
      templates.profileCard({
        ...person,
        isAlumni: true
      })
    ).join('');
  }

  setupSubscriptions() {
    // Update when proximity data changes
    this.subscriptions.push(
      store.subscribe('proximity.professionals', () => {
        if (this.currentTab === 'nearby') {
          this.render();
        }
      })
    );

    // Update when matches change
    this.subscriptions.push(
      store.subscribe('opportunities.matches', () => {
        if (this.currentTab === 'matches') {
          this.render();
        }
      })
    );

    // Handle tab changes
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Handle profile interactions
    document.addEventListener('click', (e) => {
      const profileCard = e.target.closest('[data-profile-id]');
      if (profileCard) {
        this.handleProfileInteraction(profileCard.dataset.profileId, e);
      }
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab UI
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.tab === tabName);
    });
    
    // Re-render content
    this.render();
    
    // Update page title
    const titles = {
      nearby: 'People Nearby',
      matches: 'Opportunity Matches', 
      alumni: 'Alumni Network'
    };
    
    document.getElementById('page-title').textContent = titles[tabName] || 'People';
  }

  async handleProfileInteraction(profileId, event) {
    event.preventDefault();
    
    const actionType = event.target.dataset.action;
    
    switch (actionType) {
      case 'connect':
        await this.sendConnectionRequest(profileId);
        break;
      case 'message':
        this.openMessageThread(profileId);
        break;
      case 'view':
        this.viewProfile(profileId);
        break;
      default:
        this.viewProfile(profileId);
    }
  }

  async sendConnectionRequest(profileId) {
    try {
      await api.sendConnectionRequest(profileId);
      store.actions.showNotification('Connection request sent! 🤝');
      
      // Update UI to reflect sent state
      const card = document.querySelector(`[data-profile-id="${profileId}"]`);
      if (card) {
        const button = card.querySelector('[data-action="connect"]');
        if (button) {
          button.textContent = 'Sent';
          button.disabled = true;
        }
      }
    } catch (error) {
      store.actions.showError('Failed to send connection request');
    }
  }

  openMessageThread(profileId) {
    store.actions.openModal({
      type: 'message',
      data: { profileId }
    });
  }

  viewProfile(profileId) {
    store.actions.openModal({
      type: 'profile',
      data: { profileId }
    });
  }

  destroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    // Stop proximity tracking if no other views need it
    if (this.currentTab === 'nearby') {
      proximity.stopTracking();
    }
    
    this.initialized = false;
  }
}