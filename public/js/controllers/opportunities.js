/**
 * OPPORTUNITIES CONTROLLER
 * Professional opportunity matching and management
 */

import { Store } from '../store.js';
import { Events } from '../events.js';
import { springTo } from '../ui/motion.js';
import * as Opp from '../services/opportunities.js';

export function OpportunitiesController(section){
  const toggleMount = section.querySelector('#intent-toggle');
  const inboundMount = section.querySelector('#inbound');
  const outboundMount = section.querySelector('#outbound');

  renderToggle();
  hydrateLists();

  Store.on(s => {
    updateToggleUI(s.intent);
  });

  Events.on('intent.toggle', ()=>{
    const intent = Store.get().intent;
    const next = { ...intent, on: !intent.on };
    Store.patch('intent', next);
    Opp.setIntent(next).catch(()=> Store.patch('intent', intent));
    updateToggleUI(next);
  });

  Events.on('opp.ignore', async ({el})=>{
    const id = el.dataset.id;
    await Opp.ignore(id);
    el.closest('.card').remove();
  });

  Events.on('opp.accept', async ({el})=>{
    const id = el.dataset.id;
    await Opp.accept(id);
    el.closest('.card').style.opacity = '0.6';
    el.textContent = 'Accepted';
    el.disabled = true;
  });

  function renderToggle(){
    const tpl = document.getElementById('tpl-toggle');
    toggleMount.replaceChildren(tpl.content.cloneNode(true));
    updateToggleUI(Store.get().intent);
    setupLiquidPhysics();
  }

  function updateToggleUI(intent){
    const switchEl = section.querySelector('.opportunity-switch');
    const ctx = section.querySelector('#opportunity-context');
    const tags = section.querySelector('#opportunity-tags');

    switchEl.classList.toggle('active', !!intent.on);
    const visibleCount = 47; // placeholder; replace with backend computed
    ctx.textContent = intent.on ? `Visible to ${visibleCount} relevant professionals nearby` : `You're invisible to opportunity seekers`;

    const tagList = intent.on ? (intent.tags?.length ? intent.tags : ['Funding','Publishing Partner','Hiring']) : [];
    tags.innerHTML = tagList.map(t => `<span class="opportunity-tag">${t}</span>`).join('');
    requestAnimationFrame(()=> tags.querySelectorAll('.opportunity-tag').forEach((el,i)=> {
      setTimeout(()=> el.classList.add('show'), i*50);
    }));
  }

  function setupLiquidPhysics(){
    const track = section.querySelector('.opportunity-switch');
    const handle = section.querySelector('.switch-handle');
    track.addEventListener('click', ()=>{
      const active = track.classList.contains('active');
      const to = active ? 0 : 44;
      springTo(handle, 'x', to, { stiffness:420, damping:30, threshold:.01 });
      // class toggle handled by updateToggleUI through store
    }, { passive:true });
  }

  async function hydrateLists(){
    const { inbound, outbound } = await Opp.list();
    Store.patch('inbound', inbound);
    Store.patch('outbound', outbound);
    inboundMount.innerHTML = inbound.map(card).join('');
    outboundMount.innerHTML = outbound.map(card).join('');
  }

  function card(it){
    return `
      <article class="card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="text-md" style="font-weight:700">${it.title}</div>
            <div class="text-sm" style="color:var(--text-secondary)">${it.context}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn" data-action="opp.ignore" data-id="${it.id}">Ignore</button>
            <button class="btn btn-primary" data-action="opp.accept" data-id="${it.id}">Accept</button>
          </div>
        </div>
      </article>
    `;
  }
}

// Legacy class-based controller for backward compatibility
export default class OpportunitiesControllerLegacy {
  constructor(context) {
    this.context = context;
    this.subscriptions = [];
    this.initialized = false;
    this.intentEnabled = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Show current view
      this.showCurrentView();
      
      // Load opportunities data
      await this.loadOpportunities();
      
      // Render interface
      this.render();
      
      // Set up subscriptions
      this.setupSubscriptions();
      
      // Initialize animations
      motion.initializeView('opportunities');
      
      this.initialized = true;
    } catch (error) {
      console.error('Opportunities controller initialization error:', error);
      store.actions.showError('Failed to load opportunities');
    }
  }

  async loadOpportunities() {
    try {
      // Load available opportunities
      const available = await api.getOpportunities();
      store.actions.setOpportunities(available);
      
      // Load user's applications
      const applications = await api.getOpportunityApplications();
      store.set('opportunities.applied', applications);
      
      // Load user's created opportunities
      const created = await api.getUserOpportunities();
      store.set('opportunities.created', created);
      
      // Get current intent status
      this.intentEnabled = store.get('user.opportunityIntent') || false;
      
    } catch (error) {
      console.warn('Failed to load opportunities:', error);
    }
  }

  showCurrentView() {
    // Show opportunities section, hide others
    document.querySelectorAll('[data-route]').forEach(section => {
      section.hidden = section.dataset.route !== 'opportunities';
    });
  }

  render() {
    this.renderIntentToggle();
    this.renderInboundOpportunities();
    this.renderOutboundOpportunities();
  }

  renderIntentToggle() {
    const container = document.getElementById('intent-toggle');
    if (!container) return;

    container.innerHTML = templates.intentToggle({
      enabled: this.intentEnabled,
      description: this.intentEnabled 
        ? 'You\'re open to new opportunities - great matches will find you!'
        : 'Enable opportunity matching to connect with relevant professionals'
    });
  }

  renderInboundOpportunities() {
    const container = document.getElementById('inbound');
    if (!container) return;

    const matches = store.getters.matchingOpportunities();
    
    if (!this.intentEnabled) {
      container.innerHTML = `
        <div class="intent-disabled">
          <h3>🔒 Opportunity Matching Disabled</h3>
          <p>Enable opportunity intent above to see personalized matches</p>
        </div>
      `;
      return;
    }

    if (matches.length === 0) {
      container.innerHTML = templates.emptyState({
        icon: '🎯',
        title: 'No matches yet',
        subtitle: 'We\'re finding opportunities that match your profile',
        action: null
      });
      return;
    }

    container.innerHTML = `
      <h3>🎯 Opportunities for You (${matches.length})</h3>
      <div class="opportunities-list">
        ${matches.map(opp => templates.opportunityCard({
          ...opp,
          type: 'inbound'
        })).join('')}
      </div>
    `;

    // Add entrance animations
    motion.animateList(container.querySelectorAll('.opportunity-card'));
  }

  renderOutboundOpportunities() {
    const container = document.getElementById('outbound');
    if (!container) return;

    const created = store.get('opportunities.created') || [];
    const applied = store.get('opportunities.applied') || [];

    container.innerHTML = `
      <div class="outbound-section">
        <div class="section-header">
          <h3>📤 Your Activity</h3>
          <button class="btn btn-primary" data-action="opportunity.create">
            Create Opportunity
          </button>
        </div>
        
        ${created.length > 0 ? `
          <div class="created-opportunities">
            <h4>Created by You (${created.length})</h4>
            <div class="opportunities-list">
              ${created.map(opp => templates.opportunityCard({
                ...opp,
                type: 'created',
                showStats: true
              })).join('')}
            </div>
          </div>
        ` : ''}
        
        ${applied.length > 0 ? `
          <div class="applied-opportunities">
            <h4>Applications Sent (${applied.length})</h4>
            <div class="opportunities-list">
              ${applied.map(app => templates.applicationCard(app)).join('')}
            </div>
          </div>
        ` : ''}
        
        ${created.length === 0 && applied.length === 0 ? `
          <div class="empty-outbound">
            <p>You haven't created any opportunities or sent applications yet.</p>
            <button class="btn btn-outline" data-action="opportunity.create">
              Create Your First Opportunity
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  setupSubscriptions() {
    // Update when opportunities change
    this.subscriptions.push(
      store.subscribe('opportunities', () => this.render())
    );

    // Handle intent toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="intent.toggle"]')) {
        this.toggleIntent();
      }
    });

    // Handle opportunity interactions
    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-opportunity-id]');
      if (!card) return;

      const opportunityId = card.dataset.opportunityId;
      const action = e.target.dataset.action;

      this.handleOpportunityAction(opportunityId, action, e);
    });

    // Handle create opportunity
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="opportunity.create"]')) {
        this.createOpportunity();
      }
    });
  }

  async toggleIntent() {
    this.intentEnabled = !this.intentEnabled;
    
    // Update in store
    store.set('user.opportunityIntent', this.intentEnabled);
    
    // Update UI
    this.renderIntentToggle();
    this.renderInboundOpportunities();
    
    // Animate toggle
    const toggle = document.querySelector('[data-action="intent.toggle"]');
    if (toggle) {
      motion.animate(toggle, {
        transform: ['scale(1)', 'scale(1.1)', 'scale(1)']
      }, { duration: 300 });
    }
    
    // Show notification
    const message = this.intentEnabled 
      ? '🎯 Opportunity matching enabled!'
      : '🔒 Opportunity matching disabled';
    
    store.actions.showNotification(message);
    
    try {
      // Sync with server
      await api.updateUserPreferences({
        opportunityIntent: this.intentEnabled
      });
    } catch (error) {
      console.warn('Failed to sync intent preference:', error);
    }
  }

  async handleOpportunityAction(opportunityId, action, event) {
    event.preventDefault();
    
    switch (action) {
      case 'apply':
        await this.applyToOpportunity(opportunityId);
        break;
      case 'view':
        this.viewOpportunity(opportunityId);
        break;
      case 'share':
        this.shareOpportunity(opportunityId);
        break;
      case 'edit':
        this.editOpportunity(opportunityId);
        break;
      case 'delete':
        await this.deleteOpportunity(opportunityId);
        break;
    }
  }

  async applyToOpportunity(opportunityId) {
    try {
      // Show application modal
      store.actions.openModal({
        type: 'opportunityApplication',
        data: { opportunityId },
        onSubmit: async (applicationData) => {
          await api.applyToOpportunity(opportunityId, applicationData);
          store.actions.showNotification('Application sent! 🚀');
          await this.loadOpportunities(); // Refresh data
        }
      });
    } catch (error) {
      store.actions.showError('Failed to apply to opportunity');
    }
  }

  viewOpportunity(opportunityId) {
    const opportunity = store.get('opportunities.available')
      .find(o => o.id === opportunityId);
    
    if (opportunity) {
      store.actions.openModal({
        type: 'opportunityDetail',
        data: opportunity
      });
    }
  }

  shareOpportunity(opportunityId) {
    const opportunity = store.get('opportunities.available')
      .find(o => o.id === opportunityId);
    
    if (opportunity && navigator.share) {
      navigator.share({
        title: opportunity.title,
        text: opportunity.description,
        url: `${window.location.origin}/#/opportunities/${opportunityId}`
      });
    }
  }

  editOpportunity(opportunityId) {
    const opportunity = store.get('opportunities.created')
      .find(o => o.id === opportunityId);
    
    if (opportunity) {
      store.actions.openModal({
        type: 'opportunityEdit',
        data: opportunity
      });
    }
  }

  async deleteOpportunity(opportunityId) {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }
    
    try {
      await api.deleteOpportunity(opportunityId);
      store.actions.showNotification('Opportunity deleted');
      await this.loadOpportunities(); // Refresh data
    } catch (error) {
      store.actions.showError('Failed to delete opportunity');
    }
  }

  createOpportunity() {
    store.actions.openModal({
      type: 'opportunityCreate',
      onSubmit: async (opportunityData) => {
        try {
          await api.createOpportunity(opportunityData);
          store.actions.showNotification('Opportunity created! 🎉');
          await this.loadOpportunities(); // Refresh data
        } catch (error) {
          store.actions.showError('Failed to create opportunity');
        }
      }
    });
  }

  destroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
    
    this.initialized = false;
  }
}