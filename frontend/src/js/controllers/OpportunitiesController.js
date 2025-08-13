/**
 * OPPORTUNITIES CONTROLLER
 * Manages job opportunities, collaborations, and professional matching
 */

import { BaseController } from './BaseController.js?v=b022';
import { Store } from '../store.js?v=b022';
import { api } from '../services/api.js?v=b022';

export class OpportunitiesController extends BaseController {
  constructor(element) {
    super(element, { name: 'opportunities' });
    
    this.state = {
      opportunities: [],
      filteredOpportunities: [],
      myOpportunities: [],
      appliedOpportunities: [],
      view: 'browse',
      filters: {
        search: '',
        type: 'all',
        skills: [],
        remote: false,
        experience: 'all'
      },
      selectedOpportunity: null,
      creating: false
    };
    
    this.searchDebounced = this.debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Initialize controller
   */
  async onInit() {
    await this.loadOpportunities();
    this.setupFilters();
    this.setupViewToggle();
    this.loadUserOpportunities();
  }

  /**
   * Load opportunities
   */
  async loadOpportunities() {
    this.setState({ loading: true });
    
    try {
      let opportunities = Store.get('opportunities.list') || [];
      
      // Try to fetch from API
      const response = await api.getOpportunities();
      if (response?.opportunities) {
        opportunities = response.opportunities;
        Store.patch('opportunities.list', opportunities);
      }
      
      // Add applied status
      const applied = Store.get('opportunities.applied') || [];
      opportunities = opportunities.map(opp => ({
        ...opp,
        applied: applied.includes(opp.id),
        matchScore: this.calculateMatchScore(opp)
      }));
      
      // Sort by match score
      opportunities.sort((a, b) => b.matchScore - a.matchScore);
      
      this.setState({
        opportunities,
        filteredOpportunities: opportunities,
        loading: false
      });
      
    } catch (error) {
      this.setState({ loading: false });
      this.handleError(error);
    }
  }

  /**
   * Load user's opportunities
   */
  loadUserOpportunities() {
    const myOpps = Store.get('opportunities.created') || [];
    const applied = Store.get('opportunities.applied') || [];
    
    this.setState({
      myOpportunities: myOpps,
      appliedOpportunities: applied
    });
  }

  /**
   * Calculate match score based on user profile
   */
  calculateMatchScore(opportunity) {
    const profile = Store.get('profile') || {};
    let score = 0;
    
    // Skills match
    if (profile.skills && opportunity.skills) {
      const matchingSkills = opportunity.skills.filter(skill =>
        profile.skills.includes(skill)
      );
      score += (matchingSkills.length / opportunity.skills.length) * 40;
    }
    
    // Persona match
    if (profile.persona === opportunity.targetPersona) {
      score += 30;
    }
    
    // Experience level
    if (profile.experience === opportunity.experience) {
      score += 20;
    }
    
    // Random factor for variety
    score += Math.random() * 10;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Setup filter handlers
   */
  setupFilters() {
    this.on('filter:search', ({ query }) => {
      this.setState({ filters: { ...this.state.filters, search: query } });
      this.searchDebounced(query);
    });
    
    this.on('filter:type', ({ type }) => {
      this.setState({ filters: { ...this.state.filters, type } });
      this.applyFilters();
    });
    
    this.on('filter:remote', ({ remote }) => {
      this.setState({ filters: { ...this.state.filters, remote } });
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
   * Filter by view
   */
  filterByView(view) {
    const { opportunities, myOpportunities } = this.state;
    
    switch (view) {
      case 'my':
        this.setState({ filteredOpportunities: myOpportunities });
        break;
      case 'applied':
        const appliedIds = this.state.appliedOpportunities;
        this.setState({
          filteredOpportunities: opportunities.filter(opp => 
            appliedIds.includes(opp.id)
          )
        });
        break;
      case 'matches':
        this.setState({
          filteredOpportunities: opportunities.filter(opp => 
            opp.matchScore > 60
          )
        });
        break;
      case 'browse':
      default:
        this.setState({ filteredOpportunities: opportunities });
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
    const { opportunities, filters, view } = this.state;
    let filtered = [...opportunities];
    
    // Apply view filter first
    if (view !== 'browse') {
      this.filterByView(view);
      filtered = this.state.filteredOpportunities;
    }
    
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.title?.toLowerCase().includes(search) ||
        opp.description?.toLowerCase().includes(search) ||
        opp.company?.toLowerCase().includes(search) ||
        opp.skills?.some(skill => skill.toLowerCase().includes(search))
      );
    }
    
    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(opp => opp.type === filters.type);
    }
    
    // Remote filter
    if (filters.remote) {
      filtered = filtered.filter(opp => opp.remote === true);
    }
    
    this.setState({ filteredOpportunities: filtered });
  }

  /**
   * Apply to opportunity
   */
  async applyToOpportunity(opportunityId) {
    const opportunity = this.state.opportunities.find(opp => opp.id === opportunityId);
    if (!opportunity) return;
    
    try {
      const profile = Store.get('profile');
      if (!profile.id) {
        this.notify('Complete your profile first', 'warning');
        this.emit('navigate', { route: '/me' });
        return;
      }
      
      await api.applyToOpportunity(opportunityId, profile.id);
      
      // Update applied list
      const applied = [...this.state.appliedOpportunities, opportunityId];
      Store.patch('opportunities.applied', applied);
      
      // Update opportunity state
      const opportunities = this.state.opportunities.map(opp =>
        opp.id === opportunityId ? { ...opp, applied: true } : opp
      );
      
      this.setState({
        opportunities,
        filteredOpportunities: this.state.filteredOpportunities.map(opp =>
          opp.id === opportunityId ? { ...opp, applied: true } : opp
        ),
        appliedOpportunities: applied
      });
      
      this.notify(`Applied to ${opportunity.title}!`, 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to apply', 'error');
    }
  }

  /**
   * Create new opportunity
   */
  async createOpportunity(data) {
    try {
      const profile = Store.get('profile');
      const opportunityData = {
        ...data,
        createdBy: profile.id,
        createdAt: Date.now(),
        id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      await api.createOpportunity(opportunityData);
      
      // Add to user's created opportunities
      const myOpps = [...this.state.myOpportunities, opportunityData];
      Store.patch('opportunities.created', myOpps);
      
      this.setState({
        myOpportunities: myOpps,
        creating: false
      });
      
      this.notify('Opportunity created!', 'success');
      
    } catch (error) {
      this.handleError(error);
      this.notify('Failed to create opportunity', 'error');
    }
  }

  /**
   * Action handlers
   */
  actionApply(e, target) {
    const opportunityId = target.dataset.opportunityId;
    this.applyToOpportunity(opportunityId);
  }

  actionViewDetails(e, target) {
    const opportunityId = target.dataset.opportunityId;
    const opportunity = this.state.opportunities.find(opp => opp.id === opportunityId);
    
    if (opportunity) {
      this.setState({ selectedOpportunity: opportunity });
      Store.actions.openModal({
        type: 'opportunity-details',
        data: opportunity
      });
    }
  }

  actionCreateOpportunity() {
    this.setState({ creating: true });
    Store.actions.openModal({
      type: 'create-opportunity',
      data: {
        onCreate: (data) => this.createOpportunity(data)
      }
    });
  }

  actionToggleView(e, target) {
    const view = target.dataset.view;
    this.setState({ view });
    this.filterByView(view);
  }

  actionSaveOpportunity(e, target) {
    const opportunityId = target.dataset.opportunityId;
    const saved = Store.get('opportunities.saved') || [];
    
    if (saved.includes(opportunityId)) {
      const updated = saved.filter(id => id !== opportunityId);
      Store.patch('opportunities.saved', updated);
      this.notify('Removed from saved', 'info');
    } else {
      Store.patch('opportunities.saved', [...saved, opportunityId]);
      this.notify('Saved for later!', 'success');
    }
    
    target.classList.toggle('saved');
  }

  /**
   * Template for rendering
   */
  template(data) {
    const { filteredOpportunities, view, loading, filters } = data;
    
    if (loading) {
      return '<div class="loading-state">Loading opportunities...</div>';
    }
    
    return `
      <div class="opportunities-controller">
        <div class="opportunities-header">
          <div class="search-section">
            <input 
              type="search"
              placeholder="Search opportunities..."
              value="${filters.search}"
              data-action="search"
              class="opportunities-search"
            />
          </div>
          
          <div class="view-tabs">
            <button 
              data-action="toggleView" 
              data-view="browse"
              class="${view === 'browse' ? 'active' : ''}"
            >Browse</button>
            <button 
              data-action="toggleView" 
              data-view="matches"
              class="${view === 'matches' ? 'active' : ''}"
            >Best Matches</button>
            <button 
              data-action="toggleView" 
              data-view="applied"
              class="${view === 'applied' ? 'active' : ''}"
            >Applied</button>
            <button 
              data-action="toggleView" 
              data-view="my"
              class="${view === 'my' ? 'active' : ''}"
            >My Posts</button>
          </div>
          
          <button data-action="createOpportunity" class="create-btn">
            + Post Opportunity
          </button>
        </div>
        
        <div class="filters-section">
          <select data-action="filterType" class="filter-select">
            <option value="all">All Types</option>
            <option value="job">Full-time Job</option>
            <option value="contract">Contract</option>
            <option value="collaboration">Collaboration</option>
            <option value="investment">Investment</option>
          </select>
          
          <label class="filter-checkbox">
            <input 
              type="checkbox" 
              data-action="filterRemote"
              ${filters.remote ? 'checked' : ''}
            />
            Remote OK
          </label>
        </div>
        
        <div class="opportunities-grid">
          ${filteredOpportunities.length ? 
            filteredOpportunities.map(opp => this.renderOpportunityCard(opp)).join('') :
            '<div class="empty-state">No opportunities found</div>'
          }
        </div>
      </div>
    `;
  }

  /**
   * Render opportunity card
   */
  renderOpportunityCard(opportunity) {
    const saved = (Store.get('opportunities.saved') || []).includes(opportunity.id);
    
    return `
      <div class="opportunity-card">
        <div class="card-header">
          <div class="opportunity-type ${opportunity.type}">${opportunity.type}</div>
          <button 
            data-action="saveOpportunity" 
            data-opportunity-id="${opportunity.id}"
            class="save-btn ${saved ? 'saved' : ''}"
          >
            ${saved ? '★' : '☆'}
          </button>
        </div>
        
        <div class="opportunity-main">
          <h3 class="opportunity-title">${opportunity.title}</h3>
          <p class="opportunity-company">${opportunity.company}</p>
          
          <div class="opportunity-meta">
            ${opportunity.remote ? '<span class="remote-badge">Remote</span>' : ''}
            ${opportunity.salary ? `<span class="salary">${opportunity.salary}</span>` : ''}
            ${opportunity.experience ? `<span class="experience">${opportunity.experience}</span>` : ''}
          </div>
          
          <p class="opportunity-description">
            ${opportunity.description.substring(0, 150)}...
          </p>
          
          ${opportunity.skills?.length ? `
            <div class="opportunity-skills">
              ${opportunity.skills.slice(0, 4).map(skill => 
                `<span class="skill-tag">${skill}</span>`
              ).join('')}
              ${opportunity.skills.length > 4 ? `<span class="more-skills">+${opportunity.skills.length - 4}</span>` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="card-footer">
          ${opportunity.matchScore ? `
            <div class="match-score">
              <span class="score ${this.getScoreClass(opportunity.matchScore)}">${opportunity.matchScore}% match</span>
            </div>
          ` : ''}
          
          <div class="opportunity-actions">
            ${opportunity.applied ? `
              <button class="applied-btn" disabled>Applied ✓</button>
            ` : `
              <button data-action="apply" data-opportunity-id="${opportunity.id}" class="apply-btn">
                Apply
              </button>
            `}
            
            <button data-action="viewDetails" data-opportunity-id="${opportunity.id}" class="details-btn">
              Details
            </button>
          </div>
        </div>
        
        <div class="opportunity-footer">
          <span class="posted-time">Posted ${this.timeAgo(opportunity.createdAt)}</span>
          ${opportunity.applicants ? `<span class="applicant-count">${opportunity.applicants} applicants</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get CSS class for match score
   */
  getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'low';
  }

  /**
   * Calculate time ago
   */
  timeAgo(timestamp) {
    if (!timestamp) return 'recently';
    
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'recently';
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
   * Store subscriptions
   */
  setupStoreSubscriptions() {
    this.subscribe('opportunities.list', (opportunities) => {
      if (opportunities) {
        this.loadOpportunities();
      }
    });
    
    this.subscribe('opportunities.created', (created) => {
      this.setState({ myOpportunities: created });
    });
    
    this.subscribe('opportunities.applied', (applied) => {
      this.setState({ appliedOpportunities: applied });
    });
  }
}

export default OpportunitiesController;