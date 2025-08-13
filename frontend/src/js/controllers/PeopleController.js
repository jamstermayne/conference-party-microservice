/**
 * PEOPLE CONTROLLER
 * Manages professional network, connections, and people discovery
 */

import { BaseController } from './BaseController.js?v=b011';
import { Store } from '../store.js?v=b011';
import { api } from '../services/api.js?v=b011';
import * as Connections from '../services/connections.js?v=b011';
import { renderConnectionCard } from '../ui/connectionCard.js?v=b011';

export class PeopleController extends BaseController {
  constructor(element) {
    super(element, { name: 'people' });
    
    this.state = {
      people: [],
      filteredPeople: [],
      connections: [],
      pendingRequests: [],
      nearbyPeople: [],
      view: 'all',
      filters: {
        search: '',
        persona: 'all',
        skills: [],
        location: 'all',
        availability: 'all'
      },
      selectedPerson: null
    };
    
    this.searchDebounced = this.debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Initialize controller
   */
  async onInit() {
    await this.loadPeople();
    await this.loadConnections();
    this.setupFilters();
    this.setupViewToggle();
  }

  /**
   * Load people from network
   */
  async loadPeople() {
    this.setState({ loading: true });
    
    try {
      // Load from cache first
      let people = Store.get('people.list') || [];
      
      // Try to load from API
      const response = await api.getPeople();
      if (response?.people) {
        people = response.people;
        Store.patch('people.list', people);
      }
      
      // Add proximity data
      const nearby = Store.get('proximity.nearby') || [];
      people = people.map(person => ({
        ...person,
        isNearby: nearby.some(n => n.id === person.id)
      }));
      
      this.setState({
        people,
        filteredPeople: people,
        loading: false
      });
      
    } catch (error) {
      this.setState({ loading: false });
      this.handleError(error);
    }
  }

  /**
   * Load user connections
   */
  async loadConnections() {
    const connections = Store.get('connections') || [];
    const pending = Store.get('connections.pending') || [];
    
    this.setState({
      connections,
      pendingRequests: pending
    });
    
    // Sync with server
    try {
      const profileId = Store.get('profile.id');
      if (profileId) {
        const serverConnections = await api.getConnections(profileId);
        if (serverConnections) {
          Store.patch('connections', serverConnections);
          this.setState({ connections: serverConnections });
        }
      }
    } catch (error) {
      console.warn('Failed to sync connections');
    }
  }

  /**
   * Setup filter handlers
   */
  setupFilters() {
    this.on('filter:search', ({ query }) => {
      this.setState({ filters: { ...this.state.filters, search: query } });
      this.searchDebounced(query);
    });
    
    this.on('filter:persona', ({ persona }) => {
      this.setState({ filters: { ...this.state.filters, persona } });
      this.applyFilters();
    });
    
    this.on('filter:skills', ({ skills }) => {
      this.setState({ filters: { ...this.state.filters, skills } });
      this.applyFilters();
    });
  }

  /**
   * Setup view toggle
   */
  setupViewToggle() {
    this.on('view:toggle', ({ view }) => {
      this.setState({ view });
      this.filterByView(view);
    });
  }

  /**
   * Filter by view type
   */
  filterByView(view) {
    const { people, connections, pendingRequests } = this.state;
    
    switch (view) {
      case 'connections':
        const connectedIds = connections.map(c => c.id);
        this.setState({
          filteredPeople: people.filter(p => connectedIds.includes(p.id))
        });
        break;
        
      case 'pending':
        const pendingIds = pendingRequests.map(p => p.id);
        this.setState({
          filteredPeople: people.filter(p => pendingIds.includes(p.id))
        });
        break;
        
      case 'nearby':
        this.setState({
          filteredPeople: people.filter(p => p.isNearby)
        });
        break;
        
      case 'all':
      default:
        this.setState({ filteredPeople: people });
        break;
    }
  }

  /**
   * Perform search
   */
  performSearch(query) {
    this.applyFilters();
  }

  /**
   * Apply all filters
   */
  applyFilters() {
    const { people, filters, view } = this.state;
    let filtered = [...people];
    
    // Apply view filter first
    if (view !== 'all') {
      this.filterByView(view);
      filtered = this.state.filteredPeople;
    }
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(person =>
        person.name?.toLowerCase().includes(search) ||
        person.company?.toLowerCase().includes(search) ||
        person.role?.toLowerCase().includes(search) ||
        person.skills?.some(skill => skill.toLowerCase().includes(search))
      );
    }
    
    // Persona filter
    if (filters.persona !== 'all') {
      filtered = filtered.filter(person => 
        person.persona === filters.persona
      );
    }
    
    // Skills filter
    if (filters.skills.length > 0) {
      filtered = filtered.filter(person =>
        person.skills?.some(skill => 
          filters.skills.includes(skill)
        )
      );
    }
    
    this.setState({ filteredPeople: filtered });
  }

  /**
   * Connect with person
   */
  async connectWith(personId) {
    const person = this.state.people.find(p => p.id === personId);
    if (!person) return;
    
    try {
      const userId = Store.get('profile.id');
      const eventId = Store.get('currentEvent.id');
      const conferenceId = 'gamescom2025'; // Could be dynamic
      
      const result = await Connections.create({
        userId,
        connectionId: personId,
        eventId,
        conferenceId,
        tags: person.tags || []
      });
      
      // Update connections list
      const connections = [...this.state.connections, {
        id: personId,
        name: person.name,
        company: person.company,
        role: person.role,
        timestamp: Date.now(),
        status: 'connected',
        starred: false,
        notes: '',
        history: [{ type: 'connected', timestamp: Date.now() }]
      }];
      
      Store.patch('connections', connections);
      this.setState({ connections });
      
      this.notify(`Connected with ${person.name}! 🎉`, 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to create connection', 'error');
    }
  }

  /**
   * Accept connection request
   */
  async acceptConnection(personId) {
    try {
      await api.acceptConnection(personId);
      
      // Move from pending to connections
      const person = this.state.pendingRequests.find(p => p.id === personId);
      if (person) {
        const connections = [...this.state.connections, {
          ...person,
          status: 'connected',
          timestamp: Date.now()
        }];
        
        const pending = this.state.pendingRequests.filter(p => p.id !== personId);
        
        Store.patch('connections', connections);
        Store.patch('connections.pending', pending);
        
        this.setState({ connections, pendingRequests: pending });
        this.notify(`Connected with ${person.name}!`, 'success');
      }
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to accept connection', 'error');
    }
  }

  /**
   * View person profile
   */
  viewProfile(personId) {
    const person = this.state.people.find(p => p.id === personId);
    if (person) {
      this.setState({ selectedPerson: person });
      this.showPersonModal(person);
    }
  }

  /**
   * Show person details modal
   */
  showPersonModal(person) {
    Store.actions.openModal({
      type: 'person-profile',
      data: person
    });
  }

  /**
   * Connection card action handlers
   */
  actionConnConnect(e, target) {
    const card = target.closest('.connection-card');
    const personId = card.dataset.id;
    this.connectWith(personId);
  }

  async actionConnNoteOpen(e, target) {
    const card = target.closest('.connection-card');
    const notesSection = card.querySelector('.cc-notes');
    const input = card.querySelector('.cc-note-input');
    
    notesSection.hidden = false;
    input.focus();
  }

  async actionConnNoteSave(e, target) {
    const card = target.closest('.connection-card');
    const noteInput = card.querySelector('.cc-note-input');
    const personId = card.dataset.id;
    
    try {
      await Connections.addNote(personId, noteInput.value);
      
      // Update local state
      const connections = this.state.connections.map(conn =>
        conn.id === personId 
          ? { ...conn, notes: noteInput.value, updatedAt: Date.now() }
          : conn
      );
      
      Store.patch('connections', connections);
      this.setState({ connections });
      
      card.querySelector('.cc-notes').hidden = true;
      this.notify('Note saved', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to save note', 'error');
    }
  }

  async actionConnNoteCancel(e, target) {
    const card = target.closest('.connection-card');
    card.querySelector('.cc-notes').hidden = true;
    
    // Reset input to original value
    const personId = card.dataset.id;
    const connection = this.state.connections.find(c => c.id === personId);
    card.querySelector('.cc-note-input').value = connection?.notes || '';
  }

  async actionConnStarToggle(e, target) {
    const card = target.closest('.connection-card');
    const personId = card.dataset.id;
    const connection = this.state.connections.find(c => c.id === personId);
    const newStarred = !connection?.starred;
    
    try {
      await Connections.toggleStar(personId, newStarred);
      
      // Update local state
      const connections = this.state.connections.map(conn =>
        conn.id === personId 
          ? { ...conn, starred: newStarred }
          : conn
      );
      
      Store.patch('connections', connections);
      this.setState({ connections });
      
      target.textContent = newStarred ? '⭐ Starred' : '⭐ Star';
      this.notify(newStarred ? 'Connection starred' : 'Star removed', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to update star', 'error');
    }
  }

  async actionConnHistoryOpen(e, target) {
    const card = target.closest('.connection-card');
    const personId = card.dataset.id;
    
    try {
      const historyData = await Connections.history(personId);
      this.renderConnectionHistory(card, historyData);
      card.querySelector('.cc-history').hidden = false;
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to load history', 'error');
    }
  }

  actionConnHistoryClose(e, target) {
    const card = target.closest('.connection-card');
    card.querySelector('.cc-history').hidden = true;
  }

  /**
   * Legacy action handlers for backward compatibility
   */
  actionConnect(e, target) {
    const personId = target.dataset.personId;
    this.connectWith(personId);
  }

  actionAccept(e, target) {
    const personId = target.dataset.personId;
    this.acceptConnection(personId);
  }

  actionViewProfile(e, target) {
    const personId = target.dataset.personId;
    this.viewProfile(personId);
  }

  actionMessage(e, target) {
    const personId = target.dataset.personId;
    // TODO: Implement messaging
    this.notify('Messaging coming soon', 'info');
  }

  actionToggleView(e, target) {
    const view = target.dataset.view;
    this.setState({ view });
    this.filterByView(view);
  }

  /**
   * Render connection history in card
   */
  renderConnectionHistory(card, history) {
    const historyList = card.querySelector('.cc-history-list');
    historyList.innerHTML = '';
    
    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'cc-history-item';
      historyItem.innerHTML = `
        <div class="cc-history-dot"></div>
        <div class="cc-history-content">
          <div>${this.formatHistoryAction(item)}</div>
          <div class="cc-history-meta">
            ${this.formatDate(item.ts)}
            ${item.conference ? ` • ${item.conference}` : ''}
            ${item.event ? ` • ${item.event}` : ''}
          </div>
          ${item.note ? `<div class="cc-history-note">${item.note}</div>` : ''}
        </div>
      `;
      historyList.appendChild(historyItem);
    });
  }

  /**
   * Format history action for display
   */
  formatHistoryAction(item) {
    if (item.note) return '📝 Added note';
    if (item.event) return `🤝 Met at ${item.event}`;
    if (item.conference) return `📍 Connected at ${item.conference}`;
    return '🤝 Connected';
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { filteredPeople, view, loading, filters } = data;
    
    if (loading) {
      return '<div class="loading-state">Loading people...</div>';
    }
    
    return `
      <div class="people-controller">
        <div class="people-header">
          <div class="search-section">
            <input 
              type="search"
              placeholder="Search people..."
              value="${filters.search}"
              data-action="search"
              class="people-search"
            />
          </div>
          
          <div class="view-tabs">
            <button 
              data-action="toggleView" 
              data-view="all"
              class="${view === 'all' ? 'active' : ''}"
            >All People</button>
            <button 
              data-action="toggleView" 
              data-view="connections"
              class="${view === 'connections' ? 'active' : ''}"
            >Connections</button>
            <button 
              data-action="toggleView" 
              data-view="pending"
              class="${view === 'pending' ? 'active' : ''}"
            >Pending</button>
            <button 
              data-action="toggleView" 
              data-view="nearby"
              class="${view === 'nearby' ? 'active' : ''}"
            >Nearby</button>
          </div>
        </div>
        
        <div class="filters-section">
          <select data-action="filterPersona" class="filter-select">
            <option value="all">All Personas</option>
            <option value="developer">Developer</option>
            <option value="publisher">Publisher</option>
            <option value="investor">Investor</option>
            <option value="service">Service Provider</option>
          </select>
        </div>
        
        <div class="people-grid" id="people-grid">
        </div>
        
        ${filteredPeople.length === 0 ? '<div class="empty-state">No people found</div>' : ''}
      </div>
    `;
  }

  /**
   * After rendering, populate the people grid with connection cards
   */
  afterInit() {
    super.afterInit();
    this.populatePeopleGrid();
  }

  /**
   * Populate people grid with connection cards
   */
  populatePeopleGrid() {
    const grid = this.$('#people-grid');
    if (!grid) return;
    
    // Clear existing cards
    grid.innerHTML = '';
    
    // Add connection cards
    this.state.filteredPeople.forEach(person => {
      const cardElement = this.renderPersonCard(person);
      grid.appendChild(cardElement);
    });
  }

  /**
   * Override setState to refresh grid when people change
   */
  setState(updates) {
    super.setState(updates);
    
    // Refresh grid if people data changed
    if (updates.filteredPeople) {
      this.populatePeopleGrid();
    }
  }

  /**
   * Render person card using connection card utility
   */
  renderPersonCard(person) {
    // Transform person data to connection card format
    const cardData = {
      id: person.id,
      name: person.name,
      picture: person.avatar,
      domain: person.company,
      role: person.role,
      conferenceLabel: person.conference || 'Gamescom 2025',
      eventLabel: person.event,
      metAtLabel: person.metAt,
      connected: this.state.connections.some(c => c.id === person.id),
      starred: this.state.connections.find(c => c.id === person.id)?.starred,
      viewerId: Store.get('profile.id'),
      eventId: Store.get('currentEvent.id'),
      conferenceId: 'gamescom2025',
      tags: person.tags || []
    };
    
    // Use the standalone connection card renderer
    return renderConnectionCard(cardData);
  }

  /**
   * Fallback simple person card (for backward compatibility)
   */
  renderSimplePersonCard(person) {
    const isConnected = this.state.connections.some(c => c.id === person.id);
    const isPending = this.state.pendingRequests.some(p => p.id === person.id);
    
    return `
      <div class="person-card ${person.isNearby ? 'nearby' : ''}">
        <div class="person-header">
          <div class="person-avatar">
            ${person.avatar ? `<img src="${person.avatar}" alt="${person.name}" />` : 
              person.name.charAt(0)}
          </div>
          ${person.isNearby ? '<span class="nearby-indicator">📍</span>' : ''}
        </div>
        
        <div class="person-info">
          <h3 class="person-name">${person.name}</h3>
          <p class="person-role">${person.role || 'Professional'}</p>
          <p class="person-company">${person.company || ''}</p>
          
          ${person.persona ? `
            <span class="persona-badge ${person.persona}">${person.persona}</span>
          ` : ''}
          
          ${person.skills?.length ? `
            <div class="person-skills">
              ${person.skills.slice(0, 3).map(skill => 
                `<span class="skill-tag">${skill}</span>`
              ).join('')}
              ${person.skills.length > 3 ? `<span class="more-skills">+${person.skills.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="person-actions">
          ${isConnected ? `
            <button class="connected-btn" disabled>Connected ✓</button>
            <button data-action="message" data-person-id="${person.id}" class="message-btn">
              Message
            </button>
          ` : isPending ? `
            <button class="pending-btn" disabled>Request Sent</button>
          ` : `
            <button data-action="connect" data-person-id="${person.id}" class="connect-btn">
              Connect
            </button>
          `}
          
          <button data-action="viewProfile" data-person-id="${person.id}" class="view-btn">
            View Profile
          </button>
        </div>
        
        ${person.availability ? `
          <div class="availability ${person.availability}">
            ${person.availability === 'available' ? '🟢 Available' : 
              person.availability === 'busy' ? '🔴 Busy' : '🟡 Away'}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Handle input changes
   */
  onChange(name, value, input) {
    if (name === 'search') {
      this.setState({ filters: { ...this.state.filters, search: value } });
      this.searchDebounced(value);
    }
  }

  /**
   * Alumni integration - render connection history
   */
  renderAlumniHistory(hist, list) {
    // After computing hist list:
    if (hist.length){
      list.innerHTML = '';
      hist.forEach(item=>{
        const node = renderConnectionCard({
          id: item.userId,
          name: item.name,
          role: item.role,
          picture: item.picture,
          domain: item.domain,
          conferenceId: item.conferenceId,
          conferenceLabel: item.conference,
          eventId: item.eventId,
          eventLabel: item.event,
          metAtLabel: new Date(item.ts).toLocaleString(),
          tags: item.tags || [],
          viewerId: 'me',
          connected: item.connected,
          starred: item.starred
        });
        list.appendChild(node);
      });
    }
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('people.list', (people) => {
      if (people) {
        this.loadPeople();
      }
    });
    
    this.subscribe('connections', (connections) => {
      this.setState({ connections });
      this.applyFilters();
    });
    
    this.subscribe('proximity.nearby', (nearby) => {
      // Update people with nearby status
      const people = this.state.people.map(person => ({
        ...person,
        isNearby: nearby.some(n => n.id === person.id)
      }));
      
      this.setState({ people });
      this.applyFilters();
    });
  }
}

export default PeopleController;