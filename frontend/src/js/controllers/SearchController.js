/**
 * SEARCH CONTROLLER
 * Manages global search functionality across events, people, and opportunities
 */

import { BaseController } from './BaseController.js?v=b023';
import { Store } from '../store.js?v=b023';
import { api } from '../services/api.js?v=b023';

export class SearchController extends BaseController {
  constructor(element) {
    super(element, { name: 'search' });
    
    this.state = {
      query: '',
      results: {
        events: [],
        people: [],
        opportunities: []
      },
      activeTab: 'all',
      loading: false,
      recentSearches: [],
      suggestions: []
    };
    
    this.searchDebounced = this.debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Initialize controller
   */
  async onInit() {
    this.loadRecentSearches();
    this.setupSearchHandlers();
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup search handlers
   */
  setupSearchHandlers() {
    this.on('search:focus', () => {
      this.focusSearchInput();
    });
    
    this.on('search:clear', () => {
      this.clearSearch();
    });
    
    this.on('search:submit', ({ query }) => {
      this.performSearch(query);
    });
    
    this.on('search:tab', ({ tab }) => {
      this.setState({ activeTab: tab });
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearchInput();
      }
      
      if (e.key === 'Escape' && this.isSearchActive()) {
        this.clearSearch();
      }
    });
  }

  /**
   * Load recent searches from store
   */
  loadRecentSearches() {
    const recent = Store.get('search.recent') || [];
    this.setState({ recentSearches: recent.slice(0, 5) });
  }

  /**
   * Save search to recent
   */
  saveToRecent(query) {
    if (!query || query.length < 2) return;
    
    let recent = Store.get('search.recent') || [];
    recent = recent.filter(q => q !== query);
    recent.unshift(query);
    recent = recent.slice(0, 10);
    
    Store.patch('search.recent', recent);
    this.setState({ recentSearches: recent.slice(0, 5) });
  }

  /**
   * Perform search across all data types
   */
  async performSearch(query) {
    if (!query || query.length < 2) {
      this.clearResults();
      return;
    }
    
    this.setState({ query, loading: true });
    this.saveToRecent(query);
    
    try {
      const results = await this.searchAllTypes(query);
      this.setState({
        results,
        loading: false
      });
      
      this.emit('search:complete', { query, results });
      
    } catch (error) {
      this.setState({ loading: false });
      this.handleError(error);
    }
  }

  /**
   * Search across all data types
   */
  async searchAllTypes(query) {
    const searchLower = query.toLowerCase();
    const results = {
      events: [],
      people: [],
      opportunities: []
    };
    
    // Search events
    const events = Store.get('events.list') || [];
    results.events = events.filter(event => 
      event.title?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower) ||
      event.host?.toLowerCase().includes(searchLower) ||
      event.venue?.toLowerCase().includes(searchLower)
    ).slice(0, 10);
    
    // Search people (from professional network)
    const people = Store.get('people.list') || [];
    results.people = people.filter(person => 
      person.name?.toLowerCase().includes(searchLower) ||
      person.company?.toLowerCase().includes(searchLower) ||
      person.role?.toLowerCase().includes(searchLower) ||
      person.skills?.some(skill => skill.toLowerCase().includes(searchLower))
    ).slice(0, 10);
    
    // Search opportunities
    const opportunities = Store.get('opportunities.list') || [];
    results.opportunities = opportunities.filter(opp => 
      opp.title?.toLowerCase().includes(searchLower) ||
      opp.description?.toLowerCase().includes(searchLower) ||
      opp.company?.toLowerCase().includes(searchLower) ||
      opp.skills?.some(skill => skill.toLowerCase().includes(searchLower))
    ).slice(0, 10);
    
    // Try API search if local results are limited
    if (results.events.length < 3) {
      try {
        const apiResults = await api.searchParties(query);
        if (apiResults?.parties) {
          results.events = [...results.events, ...apiResults.parties].slice(0, 10);
        }
      } catch (error) {
        console.warn('API search failed, using local results only');
      }
    }
    
    return results;
  }

  /**
   * Generate search suggestions
   */
  async generateSuggestions(query) {
    if (!query || query.length < 2) {
      this.setState({ suggestions: [] });
      return;
    }
    
    const suggestions = [];
    const searchLower = query.toLowerCase();
    
    // Get all searchable terms
    const events = Store.get('events.list') || [];
    const terms = new Set();
    
    events.forEach(event => {
      if (event.title?.toLowerCase().includes(searchLower)) {
        terms.add(event.title);
      }
      if (event.host?.toLowerCase().includes(searchLower)) {
        terms.add(event.host);
      }
      if (event.venue?.toLowerCase().includes(searchLower)) {
        terms.add(event.venue);
      }
    });
    
    suggestions.push(...Array.from(terms).slice(0, 5));
    this.setState({ suggestions });
  }

  /**
   * Clear search and results
   */
  clearSearch() {
    this.setState({
      query: '',
      results: {
        events: [],
        people: [],
        opportunities: []
      },
      suggestions: []
    });
    
    const input = this.$('.search-input');
    if (input) {
      input.value = '';
      input.blur();
    }
  }

  /**
   * Clear results only
   */
  clearResults() {
    this.setState({
      results: {
        events: [],
        people: [],
        opportunities: []
      }
    });
  }

  /**
   * Focus search input
   */
  focusSearchInput() {
    const input = this.$('.search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  /**
   * Check if search is active
   */
  isSearchActive() {
    const input = this.$('.search-input');
    return input && input === document.activeElement;
  }

  /**
   * Handle search input changes
   */
  onChange(name, value, input) {
    if (name === 'search') {
      this.setState({ query: value });
      this.searchDebounced(value);
      this.generateSuggestions(value);
    }
  }

  /**
   * Handle search form submission
   */
  onSubmit(data, form) {
    if (data.search) {
      this.performSearch(data.search);
    }
  }

  /**
   * Handle result selection
   */
  actionSelectResult(e, target) {
    const type = target.dataset.type;
    const id = target.dataset.id;
    
    switch (type) {
      case 'event':
        this.emit('navigate', { route: `/events/${id}` });
        break;
      case 'person':
        this.emit('navigate', { route: `/people/${id}` });
        break;
      case 'opportunity':
        this.emit('navigate', { route: `/opportunities/${id}` });
        break;
    }
    
    this.clearSearch();
  }

  /**
   * Handle recent search selection
   */
  actionSelectRecent(e, target) {
    const query = target.dataset.query;
    if (query) {
      const input = this.$('.search-input');
      if (input) {
        input.value = query;
      }
      this.performSearch(query);
    }
  }

  /**
   * Handle suggestion selection
   */
  actionSelectSuggestion(e, target) {
    const suggestion = target.dataset.suggestion;
    if (suggestion) {
      const input = this.$('.search-input');
      if (input) {
        input.value = suggestion;
      }
      this.performSearch(suggestion);
    }
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { query, results, activeTab, loading, recentSearches, suggestions } = data;
    const hasResults = Object.values(results).some(arr => arr.length > 0);
    
    return `
      <div class="search-controller">
        <form class="search-form" data-submit="onSubmit">
          <div class="search-input-wrapper">
            <input 
              type="search" 
              name="search"
              class="search-input"
              placeholder="Search everything... (⌘K)"
              value="${query}"
              autocomplete="off"
            />
            ${query ? `
              <button type="button" data-action="search:clear" class="clear-btn">
                ✕
              </button>
            ` : ''}
          </div>
          
          ${suggestions.length > 0 ? `
            <div class="search-suggestions">
              ${suggestions.map(s => `
                <button 
                  type="button"
                  data-action="selectSuggestion" 
                  data-suggestion="${s}"
                  class="suggestion-item"
                >
                  ${s}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </form>
        
        ${!query && recentSearches.length > 0 ? `
          <div class="recent-searches">
            <h4>Recent Searches</h4>
            <div class="recent-list">
              ${recentSearches.map(q => `
                <button 
                  data-action="selectRecent" 
                  data-query="${q}"
                  class="recent-item"
                >
                  ${q}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${loading ? `
          <div class="search-loading">Searching...</div>
        ` : ''}
        
        ${hasResults ? `
          <div class="search-results">
            ${this.renderTabs(activeTab, results)}
            ${this.renderResults(activeTab, results)}
          </div>
        ` : query && !loading ? `
          <div class="no-results">
            No results found for "${query}"
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render search tabs
   */
  renderTabs(activeTab, results) {
    const tabs = [
      { id: 'all', label: 'All', count: Object.values(results).flat().length },
      { id: 'events', label: 'Events', count: results.events.length },
      { id: 'people', label: 'People', count: results.people.length },
      { id: 'opportunities', label: 'Opportunities', count: results.opportunities.length }
    ];
    
    return `
      <div class="search-tabs">
        ${tabs.map(tab => `
          <button 
            data-action="search:tab" 
            data-tab="${tab.id}"
            class="tab-btn ${activeTab === tab.id ? 'active' : ''}"
          >
            ${tab.label} ${tab.count > 0 ? `(${tab.count})` : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render search results
   */
  renderResults(activeTab, results) {
    if (activeTab === 'all') {
      return `
        <div class="results-all">
          ${results.events.length > 0 ? `
            <div class="result-section">
              <h4>Events</h4>
              ${results.events.slice(0, 3).map(event => 
                this.renderEventResult(event)
              ).join('')}
            </div>
          ` : ''}
          
          ${results.people.length > 0 ? `
            <div class="result-section">
              <h4>People</h4>
              ${results.people.slice(0, 3).map(person => 
                this.renderPersonResult(person)
              ).join('')}
            </div>
          ` : ''}
          
          ${results.opportunities.length > 0 ? `
            <div class="result-section">
              <h4>Opportunities</h4>
              ${results.opportunities.slice(0, 3).map(opp => 
                this.renderOpportunityResult(opp)
              ).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
    
    switch (activeTab) {
      case 'events':
        return `
          <div class="results-events">
            ${results.events.map(event => this.renderEventResult(event)).join('')}
          </div>
        `;
      case 'people':
        return `
          <div class="results-people">
            ${results.people.map(person => this.renderPersonResult(person)).join('')}
          </div>
        `;
      case 'opportunities':
        return `
          <div class="results-opportunities">
            ${results.opportunities.map(opp => this.renderOpportunityResult(opp)).join('')}
          </div>
        `;
      default:
        return '';
    }
  }

  /**
   * Render event result
   */
  renderEventResult(event) {
    return `
      <div 
        class="result-item result-event"
        data-action="selectResult"
        data-type="event"
        data-id="${event.id}"
      >
        <div class="result-icon">📅</div>
        <div class="result-content">
          <h5>${this.highlightMatch(event.title, this.state.query)}</h5>
          <p>${event.venue || 'TBA'} • ${this.formatDate(event.date)}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render person result
   */
  renderPersonResult(person) {
    return `
      <div 
        class="result-item result-person"
        data-action="selectResult"
        data-type="person"
        data-id="${person.id}"
      >
        <div class="result-icon">👤</div>
        <div class="result-content">
          <h5>${this.highlightMatch(person.name, this.state.query)}</h5>
          <p>${person.role} at ${person.company}</p>
        </div>
      </div>
    `;
  }

  /**
   * Render opportunity result
   */
  renderOpportunityResult(opportunity) {
    return `
      <div 
        class="result-item result-opportunity"
        data-action="selectResult"
        data-type="opportunity"
        data-id="${opportunity.id}"
      >
        <div class="result-icon">💼</div>
        <div class="result-content">
          <h5>${this.highlightMatch(opportunity.title, this.state.query)}</h5>
          <p>${opportunity.company} • ${opportunity.type}</p>
        </div>
      </div>
    `;
  }

  /**
   * Highlight search match in text
   */
  highlightMatch(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    // Subscribe to relevant data updates
    this.subscribe('events.list', () => {
      if (this.state.query) {
        this.performSearch(this.state.query);
      }
    });
  }
}

export default SearchController;