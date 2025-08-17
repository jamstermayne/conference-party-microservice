/**
 * Party Search & Filter System
 * ============================
 * Intelligent search with instant results, filters, and suggestions
 */

import { fetchAll } from './parties-data.js';

class PartySearchEngine {
  constructor() {
    this.parties = [];
    this.filteredParties = [];
    this.filters = {
      search: '',
      date: '',
      venue: '',
      price: '', // 'free', 'paid', ''
      type: ''   // 'party', 'networking', 'conference', ''
    };
    this.recentSearches = this.loadRecentSearches();
    this.searchHistory = new Set();
    this.debounceTimeout = null;
    this.suggestions = [];
  }

  async initialize() {
    try {
      const data = await fetchAll();
      this.parties = data.list || [];
      this.filteredParties = [...this.parties];
      this.buildSearchIndex();
      return true;
    } catch (error) {
      console.error('Failed to load parties:', error);
      return false;
    }
  }

  buildSearchIndex() {
    // Build searchable content for each party
    this.parties.forEach(party => {
      party._searchContent = [
        party.title,
        party.venue,
        party.description,
        party.date,
        party.start,
        party.price
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Extract keywords for suggestions
      const words = party._searchContent.split(/\s+/).filter(word => word.length > 2);
      words.forEach(word => this.searchHistory.add(word));
    });
  }

  search(query = '', filters = {}) {
    // Clear previous debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    return new Promise((resolve) => {
      this.debounceTimeout = setTimeout(() => {
        const results = this.performSearch(query, filters);
        resolve(results);
      }, 150); // Debounce for 150ms
    });
  }

  performSearch(query = '', filters = {}) {
    this.filters = { ...this.filters, search: query, ...filters };
    
    let results = [...this.parties];

    // Text search
    if (query.trim()) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      results = results.filter(party => {
        return searchTerms.every(term => 
          party._searchContent.includes(term)
        );
      });
      
      // Save to recent searches
      this.addRecentSearch(query);
    }

    // Date filter
    if (filters.date) {
      results = results.filter(party => party.date === filters.date);
    }

    // Venue filter
    if (filters.venue) {
      results = results.filter(party => 
        party.venue.toLowerCase().includes(filters.venue.toLowerCase())
      );
    }

    // Price filter
    if (filters.price === 'free') {
      results = results.filter(party => 
        !party.price || party.price.toLowerCase().includes('free')
      );
    } else if (filters.price === 'paid') {
      results = results.filter(party => 
        party.price && !party.price.toLowerCase().includes('free')
      );
    }

    // Type filter (basic keyword matching)
    if (filters.type) {
      results = results.filter(party => 
        party._searchContent.includes(filters.type.toLowerCase())
      );
    }

    this.filteredParties = results;
    return {
      results: results,
      total: results.length,
      query: query,
      filters: { ...filters }
    };
  }

  getSuggestions(query) {
    if (!query || query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const suggestions = [];

    // Add venue suggestions
    const venues = [...new Set(this.parties.map(p => p.venue).filter(Boolean))];
    venues.forEach(venue => {
      if (venue.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'venue',
          text: venue,
          icon: '📍',
          detail: 'Venue'
        });
      }
    });

    // Add event title suggestions
    this.parties.forEach(party => {
      if (party.title.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'event',
          text: party.title,
          icon: '🎉',
          detail: party.venue || party.date
        });
      }
    });

    // Add recent search suggestions
    this.recentSearches.forEach(search => {
      if (search.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'recent',
          text: search,
          icon: '🕒',
          detail: 'Recent search'
        });
      }
    });

    // Limit and sort suggestions
    return suggestions.slice(0, 8);
  }

  getFilterStats() {
    const stats = {
      total: this.parties.length,
      dates: {},
      venues: {},
      prices: { free: 0, paid: 0 },
      types: {}
    };

    this.parties.forEach(party => {
      // Date stats
      if (party.date) {
        stats.dates[party.date] = (stats.dates[party.date] || 0) + 1;
      }

      // Venue stats
      if (party.venue) {
        stats.venues[party.venue] = (stats.venues[party.venue] || 0) + 1;
      }

      // Price stats
      if (!party.price || party.price.toLowerCase().includes('free')) {
        stats.prices.free++;
      } else {
        stats.prices.paid++;
      }
    });

    return stats;
  }

  addRecentSearch(query) {
    if (!query || query.length < 2) return;
    
    // Remove if already exists
    this.recentSearches = this.recentSearches.filter(s => s !== query);
    
    // Add to beginning
    this.recentSearches.unshift(query);
    
    // Keep only last 10
    if (this.recentSearches.length > 10) {
      this.recentSearches = this.recentSearches.slice(0, 10);
    }
    
    this.saveRecentSearches();
  }

  clearRecentSearches() {
    this.recentSearches = [];
    this.saveRecentSearches();
  }

  loadRecentSearches() {
    try {
      return JSON.parse(localStorage.getItem('party-recent-searches') || '[]');
    } catch {
      return [];
    }
  }

  saveRecentSearches() {
    localStorage.setItem('party-recent-searches', JSON.stringify(this.recentSearches));
  }

  getQuickFilters() {
    return [
      { id: 'today', label: 'Today', filter: { date: new Date().toISOString().split('T')[0] } },
      { id: 'tomorrow', label: 'Tomorrow', filter: { date: new Date(Date.now() + 86400000).toISOString().split('T')[0] } },
      { id: 'free', label: 'Free Events', filter: { price: 'free' } },
      { id: 'paid', label: 'Premium', filter: { price: 'paid' } },
      { id: 'networking', label: 'Networking', filter: { type: 'networking' } },
      { id: 'party', label: 'Parties', filter: { type: 'party' } }
    ];
  }
}

// UI Controller for Search Interface
class PartySearchUI {
  constructor(searchEngine) {
    this.searchEngine = searchEngine;
    this.container = null;
    this.searchInput = null;
    this.suggestionsContainer = null;
    this.filtersContainer = null;
    this.resultsContainer = null;
    this.isShowingSuggestions = false;
    this.currentSuggestionIndex = -1;
    this.onResultsChange = null;
  }

  render(container) {
    this.container = container;
    
    const stats = this.searchEngine.getFilterStats();
    const quickFilters = this.searchEngine.getQuickFilters();
    
    container.innerHTML = `
      <div class="party-search">
        <!-- Search Input -->
        <div class="search-input-group">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search parties, venues, or events..."
            autocomplete="off"
            aria-label="Search parties"
          >
          <svg class="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
          </svg>
          <div class="search-suggestions" style="display: none;"></div>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          ${quickFilters.map(filter => `
            <button class="quick-filter" data-filter="${filter.id}">
              ${filter.label}
            </button>
          `).join('')}
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips">
          <span class="filter-label">Filter by:</span>
          
          <button class="filter-chip" data-filter="price" data-value="free">
            <span class="filter-chip__icon">💰</span>
            Free
            <span class="filter-chip__count">${stats.prices.free}</span>
          </button>
          
          <button class="filter-chip" data-filter="price" data-value="paid">
            <span class="filter-chip__icon">💎</span>
            Premium
            <span class="filter-chip__count">${stats.prices.paid}</span>
          </button>
          
          ${Object.entries(stats.dates).slice(0, 4).map(([date, count]) => `
            <button class="filter-chip" data-filter="date" data-value="${date}">
              <span class="filter-chip__icon">📅</span>
              ${this.formatDate(date)}
              <span class="filter-chip__count">${count}</span>
            </button>
          `).join('')}
        </div>

        <!-- Search Summary -->
        <div class="search-summary">
          <span class="search-results-text">
            <span class="search-count">${stats.total}</span> parties found
          </span>
          <button class="search-clear" style="display: none;">Clear filters</button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.searchInput = container.querySelector('.search-input');
    this.suggestionsContainer = container.querySelector('.search-suggestions');
    this.filtersContainer = container.querySelector('.filter-chips');
    this.updateDisplay();
  }

  bindEvents() {
    const searchInput = this.container.querySelector('.search-input');
    const suggestionsContainer = this.container.querySelector('.search-suggestions');
    const clearButton = this.container.querySelector('.search-clear');

    // Search input events
    searchInput.addEventListener('input', (e) => {
      this.handleSearchInput(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });

    searchInput.addEventListener('focus', () => {
      this.showSuggestions();
    });

    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideSuggestions();
      }
    });

    // Filter chip events
    this.container.addEventListener('click', (e) => {
      const filterChip = e.target.closest('.filter-chip');
      const quickFilter = e.target.closest('.quick-filter');
      
      if (filterChip) {
        this.toggleFilter(filterChip);
      } else if (quickFilter) {
        this.applyQuickFilter(quickFilter.dataset.filter);
      } else if (e.target === clearButton) {
        this.clearAllFilters();
      }
    });

    // Suggestion click events
    suggestionsContainer.addEventListener('click', (e) => {
      const suggestion = e.target.closest('.search-suggestion');
      if (suggestion) {
        this.selectSuggestion(suggestion);
      }
    });
  }

  async handleSearchInput(query) {
    if (query.length >= 2) {
      this.showSuggestions();
      this.updateSuggestions(query);
    } else {
      this.hideSuggestions();
    }

    const results = await this.searchEngine.search(query);
    this.updateDisplay(results);
    
    if (this.onResultsChange) {
      this.onResultsChange(results);
    }
  }

  handleKeyNavigation(e) {
    if (!this.isShowingSuggestions) return;

    const suggestions = this.suggestionsContainer.querySelectorAll('.search-suggestion');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.currentSuggestionIndex = Math.min(
          this.currentSuggestionIndex + 1,
          suggestions.length - 1
        );
        this.highlightSuggestion();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        this.currentSuggestionIndex = Math.max(this.currentSuggestionIndex - 1, -1);
        this.highlightSuggestion();
        break;
        
      case 'Enter':
        e.preventDefault();
        if (this.currentSuggestionIndex >= 0) {
          this.selectSuggestion(suggestions[this.currentSuggestionIndex]);
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        this.searchInput.blur();
        break;
    }
  }

  showSuggestions() {
    this.isShowingSuggestions = true;
    this.suggestionsContainer.style.display = 'block';
    this.currentSuggestionIndex = -1;
  }

  hideSuggestions() {
    this.isShowingSuggestions = false;
    this.suggestionsContainer.style.display = 'none';
    this.currentSuggestionIndex = -1;
  }

  updateSuggestions(query) {
    const suggestions = this.searchEngine.getSuggestions(query);
    
    if (suggestions.length === 0) {
      this.suggestionsContainer.innerHTML = `
        <div class="search-suggestion">
          <span class="suggestion-icon">🔍</span>
          <div class="suggestion-content">
            <div class="suggestion-text">No suggestions found</div>
            <div class="suggestion-detail">Try a different search term</div>
          </div>
        </div>
      `;
      return;
    }

    this.suggestionsContainer.innerHTML = suggestions.map(suggestion => `
      <div class="search-suggestion" data-type="${suggestion.type}" data-text="${suggestion.text}">
        <span class="suggestion-icon">${suggestion.icon}</span>
        <div class="suggestion-content">
          <div class="suggestion-text">${this.highlightMatch(suggestion.text, query)}</div>
          <div class="suggestion-detail">${suggestion.detail}</div>
        </div>
      </div>
    `).join('');
  }

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="suggestion-match">$1</span>');
  }

  highlightSuggestion() {
    const suggestions = this.suggestionsContainer.querySelectorAll('.search-suggestion');
    suggestions.forEach((suggestion, index) => {
      suggestion.setAttribute('aria-selected', index === this.currentSuggestionIndex);
    });
  }

  selectSuggestion(suggestionElement) {
    const text = suggestionElement.dataset.text;
    const type = suggestionElement.dataset.type;
    
    this.searchInput.value = text;
    this.hideSuggestions();
    
    // Trigger search with the selected suggestion
    this.handleSearchInput(text);
  }

  async toggleFilter(filterChip) {
    const filterType = filterChip.dataset.filter;
    const filterValue = filterChip.dataset.value;
    const isActive = filterChip.classList.contains('active');
    
    if (isActive) {
      filterChip.classList.remove('active');
      filterChip.setAttribute('aria-pressed', 'false');
    } else {
      // Remove other active filters of same type
      this.container.querySelectorAll(`[data-filter="${filterType}"]`).forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      });
      
      filterChip.classList.add('active');
      filterChip.setAttribute('aria-pressed', 'true');
    }
    
    const filters = this.getActiveFilters();
    const query = this.searchInput.value;
    const results = await this.searchEngine.search(query, filters);
    this.updateDisplay(results);
    
    if (this.onResultsChange) {
      this.onResultsChange(results);
    }
  }

  async applyQuickFilter(filterId) {
    const quickFilters = this.searchEngine.getQuickFilters();
    const quickFilter = quickFilters.find(f => f.id === filterId);
    
    if (!quickFilter) return;
    
    // Clear existing filters and apply quick filter
    this.clearAllFilters(false);
    
    Object.entries(quickFilter.filter).forEach(([key, value]) => {
      const filterChip = this.container.querySelector(`[data-filter="${key}"][data-value="${value}"]`);
      if (filterChip) {
        filterChip.classList.add('active');
        filterChip.setAttribute('aria-pressed', 'true');
      }
    });
    
    const query = this.searchInput.value;
    const results = await this.searchEngine.search(query, quickFilter.filter);
    this.updateDisplay(results);
    
    if (this.onResultsChange) {
      this.onResultsChange(results);
    }
  }

  getActiveFilters() {
    const filters = {};
    this.container.querySelectorAll('.filter-chip.active').forEach(chip => {
      const filterType = chip.dataset.filter;
      const filterValue = chip.dataset.value;
      filters[filterType] = filterValue;
    });
    return filters;
  }

  async clearAllFilters(triggerSearch = true) {
    // Clear search input
    this.searchInput.value = '';
    
    // Clear all active filters
    this.container.querySelectorAll('.filter-chip.active').forEach(chip => {
      chip.classList.remove('active');
      chip.setAttribute('aria-pressed', 'false');
    });
    
    if (triggerSearch) {
      const results = await this.searchEngine.search('', {});
      this.updateDisplay(results);
      
      if (this.onResultsChange) {
        this.onResultsChange(results);
      }
    }
  }

  updateDisplay(results = null) {
    const searchSummary = this.container.querySelector('.search-summary');
    const clearButton = this.container.querySelector('.search-clear');
    const resultsText = this.container.querySelector('.search-results-text');
    const countElement = this.container.querySelector('.search-count');
    
    if (results) {
      countElement.textContent = results.total;
      resultsText.innerHTML = `<span class="search-count">${results.total}</span> ${results.total === 1 ? 'party' : 'parties'} found`;
      
      // Show clear button if filters are active
      const hasActiveFilters = this.container.querySelectorAll('.filter-chip.active').length > 0 || this.searchInput.value.trim();
      clearButton.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }

  onResults(callback) {
    this.onResultsChange = callback;
  }
}

// Export classes for use
export { PartySearchEngine, PartySearchUI };