/**
 * 🚀 PROFESSIONAL OPPORTUNITY TOGGLE SYSTEM
 * LinkedIn-killer feature with explicit consent-based networking
 * Solves spam problem through ON/OFF visibility control
 */

class OpportunityToggleManager {
    constructor() {
        // Opportunity types by persona
        this.opportunityTypes = {
            developer: {
                looking: [
                    { id: 'job_full_time', label: 'Full-time Job', icon: '💼' },
                    { id: 'job_contract', label: 'Contract Work', icon: '📋' },
                    { id: 'freelance', label: 'Freelance Projects', icon: '🎯' },
                    { id: 'cofounder', label: 'Co-founder Opportunity', icon: '🤝' },
                    { id: 'technical_advice', label: 'Technical Mentoring', icon: '🧠' },
                    { id: 'collaboration', label: 'Project Collaboration', icon: '⚡' }
                ],
                offering: [
                    { id: 'development_services', label: 'Development Services', icon: '⚙️' },
                    { id: 'technical_consulting', label: 'Technical Consulting', icon: '💡' },
                    { id: 'code_review', label: 'Code Review', icon: '🔍' },
                    { id: 'mentoring', label: 'Junior Developer Mentoring', icon: '👨‍🏫' },
                    { id: 'open_source', label: 'Open Source Collaboration', icon: '🌟' }
                ]
            },
            publishing: {
                looking: [
                    { id: 'games_to_publish', label: 'Games to Publish', icon: '🎮' },
                    { id: 'marketing_partners', label: 'Marketing Partners', icon: '📢' },
                    { id: 'distribution_channels', label: 'Distribution Channels', icon: '🌐' },
                    { id: 'funding_opportunities', label: 'Funding Sources', icon: '💰' },
                    { id: 'localization', label: 'Localization Services', icon: '🌍' }
                ],
                offering: [
                    { id: 'publishing_deal', label: 'Publishing Deal', icon: '📋' },
                    { id: 'marketing_expertise', label: 'Marketing Expertise', icon: '📈' },
                    { id: 'platform_access', label: 'Platform Access', icon: '🎯' },
                    { id: 'funding', label: 'Development Funding', icon: '💵' },
                    { id: 'community_building', label: 'Community Building', icon: '👥' }
                ]
            },
            investor: {
                looking: [
                    { id: 'startups_seed', label: 'Seed Stage Startups', icon: '🌱' },
                    { id: 'startups_series_a', label: 'Series A Companies', icon: '📈' },
                    { id: 'due_diligence', label: 'Due Diligence Partners', icon: '🔍' },
                    { id: 'deal_flow', label: 'Deal Flow Sources', icon: '🎯' },
                    { id: 'co_investors', label: 'Co-investment Partners', icon: '🤝' }
                ],
                offering: [
                    { id: 'seed_funding', label: 'Seed Funding', icon: '💰' },
                    { id: 'series_a_funding', label: 'Series A Funding', icon: '💵' },
                    { id: 'strategic_advice', label: 'Strategic Advice', icon: '🧠' },
                    { id: 'network_access', label: 'Network Access', icon: '🌐' },
                    { id: 'board_position', label: 'Board Advisory', icon: '👔' }
                ]
            },
            service: {
                looking: [
                    { id: 'new_clients', label: 'New Clients', icon: '🎯' },
                    { id: 'partnerships', label: 'Strategic Partnerships', icon: '🤝' },
                    { id: 'subcontractors', label: 'Subcontractors', icon: '👥' },
                    { id: 'referral_partners', label: 'Referral Partners', icon: '🔄' },
                    { id: 'expansion', label: 'Market Expansion', icon: '🌍' }
                ],
                offering: [
                    { id: 'qa_services', label: 'QA & Testing Services', icon: '🔍' },
                    { id: 'localization', label: 'Localization Services', icon: '🌐' },
                    { id: 'audio_services', label: 'Audio & Music Services', icon: '🎵' },
                    { id: 'legal_services', label: 'Legal Services', icon: '⚖️' },
                    { id: 'marketing_services', label: 'Marketing Services', icon: '📢' },
                    { id: 'development_services', label: 'Development Services', icon: '⚙️' }
                ]
            }
        };
        
        // User state
        this.toggleState = this.loadToggleState();
        this.messageHistory = this.loadMessageHistory();
        this.blockedUsers = this.loadBlockedUsers();
        
        // Anti-spam settings
        this.DAILY_MESSAGE_LIMIT = 10;
        this.COOLDOWN_HOURS = 24;
        this.AUTO_EXPIRE_HOURS = 168; // 7 days post-conference
        
        // Current matches cache
        this.matchesCache = new Map();
        this.cacheExpiry = 300000; // 5 minutes
        
        this.init();
    }

    async init() {
        try {
            // Create UI components
            this.createToggleButton();
            this.createOpportunityModal();
            this.createMatchingInterface();
            this.createMessageModal();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check auto-expiry
            this.checkAutoExpiry();
            
            // Start update intervals
            this.startUpdateIntervals();
            
            console.log('✅ Opportunity Toggle Manager initialized');
            
        } catch (error) {
            console.error('❌ Opportunity Toggle Manager initialization failed:', error);
        }
    }

    /**
     * Load user toggle state
     */
    loadToggleState() {
        try {
            const stored = localStorage.getItem('gamescom_opportunity_toggle');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load toggle state:', error);
        }
        
        // Default state - OFF for privacy
        return {
            enabled: false,
            lookingFor: [],
            offering: [],
            enabledAt: null,
            expiresAt: null,
            lastUpdated: null,
            bio: '',
            contact: {
                method: 'platform', // 'platform', 'email', 'linkedin'
                value: ''
            }
        };
    }

    saveToggleState() {
        this.toggleState.lastUpdated = Date.now();
        localStorage.setItem('gamescom_opportunity_toggle', JSON.stringify(this.toggleState));
    }

    loadMessageHistory() {
        try {
            const stored = localStorage.getItem('gamescom_message_history');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveMessageHistory() {
        localStorage.setItem('gamescom_message_history', JSON.stringify(this.messageHistory));
    }

    loadBlockedUsers() {
        try {
            const stored = localStorage.getItem('gamescom_blocked_users');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveBlockedUsers() {
        localStorage.setItem('gamescom_blocked_users', JSON.stringify(this.blockedUsers));
    }

    /**
     * Create toggle button in navigation
     */
    createToggleButton() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'opportunityToggle';
        toggleBtn.className = `opportunity-toggle ${this.toggleState.enabled ? 'active' : 'inactive'}`;
        toggleBtn.innerHTML = `
            <span class="toggle-icon">${this.toggleState.enabled ? '🟢' : '⚫'}</span>
            <span class="toggle-text">Open</span>
            ${this.toggleState.enabled ? '<span class="toggle-badge">ON</span>' : ''}
        `;
        
        // Insert before proximity toggle
        const proximityToggle = document.getElementById('proximityToggle');
        if (proximityToggle) {
            navActions.insertBefore(toggleBtn, proximityToggle);
        } else {
            navActions.appendChild(toggleBtn);
        }
    }

    /**
     * Create opportunity setup modal
     */
    createOpportunityModal() {
        const modal = document.createElement('div');
        modal.id = 'opportunityModal';
        modal.className = 'opportunity-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="opportunity-modal-overlay">
                <div class="opportunity-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">🚀 Professional Opportunities</h2>
                        <button class="modal-close" id="closeOpportunityModal">&times;</button>
                    </div>
                    
                    <div class="opportunity-notice">
                        <div class="notice-icon">${this.toggleState.enabled ? '🟢' : '🔒'}</div>
                        <div class="notice-text">
                            <strong>${this.toggleState.enabled ? 'You\'re Open to Opportunities' : 'You\'re Hidden from Opportunity Seekers'}</strong>
                            <p>${this.toggleState.enabled ? 'Other professionals can see and message you about relevant opportunities.' : 'Turn on to be visible to other professionals looking for partnerships.'}</p>
                        </div>
                    </div>
                    
                    <div class="main-toggle-section">
                        <div class="toggle-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="mainToggle" ${this.toggleState.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <div class="toggle-labels">
                                <h3>Looking for Opportunities</h3>
                                <p>Make yourself discoverable to other professionals</p>
                            </div>
                        </div>
                        
                        ${this.toggleState.enabled ? `
                            <div class="expiry-info">
                                <span class="expiry-label">Auto-expires:</span>
                                <span class="expiry-time">${this.getExpiryText()}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="opportunity-setup ${this.toggleState.enabled ? 'visible' : 'hidden'}" id="opportunitySetup">
                        ${this.renderOpportunitySetup()}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancelOpportunity">Cancel</button>
                        <button class="btn btn-primary" id="saveOpportunity">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    renderOpportunitySetup() {
        const persona = this.getUserPersona();
        const opportunities = this.opportunityTypes[persona] || this.opportunityTypes.developer;
        
        return `
            <div class="persona-info">
                <div class="persona-badge">
                    ${this.getPersonaIcon(persona)} ${this.getPersonaLabel(persona)}
                </div>
                <p class="persona-desc">Customize your opportunities based on your professional role</p>
            </div>
            
            <div class="opportunity-sections">
                <div class="opportunity-section">
                    <h4 class="section-title">🔍 Looking For</h4>
                    <div class="opportunity-grid">
                        ${opportunities.looking.map(opp => `
                            <label class="opportunity-chip">
                                <input type="checkbox" name="lookingFor" value="${opp.id}" 
                                       ${this.toggleState.lookingFor.includes(opp.id) ? 'checked' : ''}>
                                <span class="chip-content">
                                    <span class="chip-icon">${opp.icon}</span>
                                    <span class="chip-label">${opp.label}</span>
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="opportunity-section">
                    <h4 class="section-title">💼 Offering</h4>
                    <div class="opportunity-grid">
                        ${opportunities.offering.map(opp => `
                            <label class="opportunity-chip">
                                <input type="checkbox" name="offering" value="${opp.id}" 
                                       ${this.toggleState.offering.includes(opp.id) ? 'checked' : ''}>
                                <span class="chip-content">
                                    <span class="chip-icon">${opp.icon}</span>
                                    <span class="chip-label">${opp.label}</span>
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="bio-section">
                <h4 class="section-title">📝 Professional Bio</h4>
                <textarea id="opportunityBio" class="bio-textarea" placeholder="Brief description of your background and what you're looking for..." maxlength="500">${this.toggleState.bio}</textarea>
                <div class="bio-counter">
                    <span id="bioCount">${this.toggleState.bio.length}</span>/500
                </div>
            </div>
            
            <div class="contact-section">
                <h4 class="section-title">📞 Contact Preference</h4>
                <div class="contact-options">
                    <label class="contact-option">
                        <input type="radio" name="contactMethod" value="platform" 
                               ${this.toggleState.contact.method === 'platform' ? 'checked' : ''}>
                        <span>📱 Platform Messages (Recommended)</span>
                    </label>
                    <label class="contact-option">
                        <input type="radio" name="contactMethod" value="email" 
                               ${this.toggleState.contact.method === 'email' ? 'checked' : ''}>
                        <span>📧 Email</span>
                    </label>
                    <label class="contact-option">
                        <input type="radio" name="contactMethod" value="linkedin" 
                               ${this.toggleState.contact.method === 'linkedin' ? 'checked' : ''}>
                        <span>💼 LinkedIn</span>
                    </label>
                </div>
                
                <div class="contact-input ${this.toggleState.contact.method !== 'platform' ? 'visible' : 'hidden'}" id="contactInput">
                    <input type="text" id="contactValue" placeholder="${this.getContactPlaceholder()}" 
                           value="${this.toggleState.contact.value}">
                </div>
            </div>
        `;
    }

    /**
     * Create matching interface
     */
    createMatchingInterface() {
        const container = document.createElement('div');
        container.id = 'matchingInterface';
        container.className = 'matching-interface';
        container.style.display = 'none';
        container.innerHTML = `
            <div class="matching-header">
                <h2 class="matching-title">🎯 Professional Opportunities</h2>
                <button class="matching-close" id="closeMatching">&times;</button>
            </div>
            
            <div class="matching-filters">
                <div class="filter-section">
                    <h3>Show me:</h3>
                    <div class="filter-chips">
                        <button class="filter-chip active" data-filter="all">All Professionals</button>
                        <button class="filter-chip" data-filter="developer">👨‍💻 Developers</button>
                        <button class="filter-chip" data-filter="publishing">📢 Publishers</button>
                        <button class="filter-chip" data-filter="investor">💼 Investors</button>
                        <button class="filter-chip" data-filter="service">🛠️ Service Providers</button>
                    </div>
                </div>
                
                <div class="filter-section">
                    <h3>Looking for:</h3>
                    <div class="opportunity-filters" id="opportunityFilters">
                        <!-- Dynamically populated based on persona filter -->
                    </div>
                </div>
            </div>
            
            <div class="matching-content">
                <div class="hot-leads-section">
                    <h3 class="section-title">🔥 Hot Leads</h3>
                    <p class="section-subtitle">Recently active professionals in your area</p>
                    <div class="hot-leads-list" id="hotLeadsList">
                        <!-- Populated dynamically -->
                    </div>
                </div>
                
                <div class="all-matches-section">
                    <h3 class="section-title">💼 All Available Professionals</h3>
                    <div class="matches-list" id="matchesList">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
    }

    /**
     * Create message modal
     */
    createMessageModal() {
        const modal = document.createElement('div');
        modal.id = 'messageModal';
        modal.className = 'message-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="message-modal-overlay">
                <div class="message-modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">📩 Send Professional Message</h3>
                        <button class="modal-close" id="closeMessageModal">&times;</button>
                    </div>
                    
                    <div class="recipient-info" id="recipientInfo">
                        <!-- Populated dynamically -->
                    </div>
                    
                    <div class="message-compose">
                        <div class="message-templates">
                            <h4>Quick Templates:</h4>
                            <div class="template-chips">
                                <button class="template-chip" data-template="intro">👋 Introduction</button>
                                <button class="template-chip" data-template="collaboration">🤝 Collaboration</button>
                                <button class="template-chip" data-template="opportunity">💼 Opportunity</button>
                                <button class="template-chip" data-template="meeting">☕ Meeting Request</button>
                            </div>
                        </div>
                        
                        <textarea id="messageContent" class="message-textarea" placeholder="Write your professional message..." maxlength="1000"></textarea>
                        <div class="message-counter">
                            <span id="messageCount">0</span>/1000
                        </div>
                        
                        <div class="message-tips">
                            <h5>💡 Tips for effective messages:</h5>
                            <ul>
                                <li>Be specific about what you're looking for</li>
                                <li>Mention how you found their profile</li>
                                <li>Suggest a clear next step</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="cancelMessage">Cancel</button>
                        <button class="btn btn-primary" id="sendMessage">Send Message</button>
                    </div>
                    
                    <div class="daily-limit-info">
                        <span id="dailyLimitText">Messages sent today: ${this.getTodayMessageCount()}/${this.DAILY_MESSAGE_LIMIT}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#opportunityToggle')) {
                this.showOpportunityModal();
            }
        });
        
        // Modal controls
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeOpportunityModal' || e.target.id === 'cancelOpportunity') {
                this.hideOpportunityModal();
            }
            
            if (e.target.id === 'saveOpportunity') {
                this.saveOpportunitySettings();
            }
        });
        
        // Main toggle switch
        document.addEventListener('change', (e) => {
            if (e.target.id === 'mainToggle') {
                this.handleMainToggle(e.target.checked);
            }
        });
        
        // Contact method change
        document.addEventListener('change', (e) => {
            if (e.target.name === 'contactMethod') {
                this.handleContactMethodChange(e.target.value);
            }
        });
        
        // Bio character counter
        document.addEventListener('input', (e) => {
            if (e.target.id === 'opportunityBio') {
                document.getElementById('bioCount').textContent = e.target.value.length;
            }
            
            if (e.target.id === 'messageContent') {
                document.getElementById('messageCount').textContent = e.target.value.length;
            }
        });
        
        // Matching interface
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeMatching') {
                this.hideMatchingInterface();
            }
        });
        
        // Filter chips
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-chip')) {
                this.handleFilterChange(e.target.dataset.filter);
            }
        });
        
        // Message templates
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('template-chip')) {
                this.applyMessageTemplate(e.target.dataset.template);
            }
        });
        
        // Send message
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sendMessage') {
                this.sendProfessionalMessage();
            }
            
            if (e.target.id === 'closeMessageModal') {
                this.hideMessageModal();
            }
        });
        
        // Message button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-btn')) {
                const userId = e.target.dataset.userId;
                if (userId) {
                    this.showMessageModal(userId);
                }
            }
        });
    }

    /**
     * Handle main toggle switch
     */
    handleMainToggle(enabled) {
        const setup = document.getElementById('opportunitySetup');
        
        if (enabled) {
            setup.classList.remove('hidden');
            setup.classList.add('visible');
        } else {
            setup.classList.add('hidden');
            setup.classList.remove('visible');
        }
        
        // Update notice
        this.updateModalNotice(enabled);
    }

    updateModalNotice(enabled) {
        const notice = document.querySelector('.opportunity-notice');
        if (!notice) return;
        
        const icon = notice.querySelector('.notice-icon');
        const title = notice.querySelector('strong');
        const desc = notice.querySelector('p');
        
        if (enabled) {
            icon.textContent = '🟢';
            title.textContent = "You're Open to Opportunities";
            desc.textContent = "Other professionals can see and message you about relevant opportunities.";
            notice.classList.add('enabled');
        } else {
            icon.textContent = '🔒';
            title.textContent = "You're Hidden from Opportunity Seekers";
            desc.textContent = "Turn on to be visible to other professionals looking for partnerships.";
            notice.classList.remove('enabled');
        }
    }

    /**
     * Save opportunity settings
     */
    saveOpportunitySettings() {
        const mainToggle = document.getElementById('mainToggle').checked;
        
        this.toggleState.enabled = mainToggle;
        
        if (mainToggle) {
            // Save selected opportunities
            this.toggleState.lookingFor = Array.from(document.querySelectorAll('input[name="lookingFor"]:checked'))
                .map(input => input.value);
            
            this.toggleState.offering = Array.from(document.querySelectorAll('input[name="offering"]:checked'))
                .map(input => input.value);
            
            // Save bio
            this.toggleState.bio = document.getElementById('opportunityBio').value.trim();
            
            // Save contact info
            const contactMethod = document.querySelector('input[name="contactMethod"]:checked').value;
            this.toggleState.contact.method = contactMethod;
            this.toggleState.contact.value = contactMethod !== 'platform' ? 
                document.getElementById('contactValue').value.trim() : '';
            
            // Set timestamps
            this.toggleState.enabledAt = Date.now();
            this.toggleState.expiresAt = Date.now() + (this.AUTO_EXPIRE_HOURS * 60 * 60 * 1000);
        } else {
            // Clear timestamps when disabled
            this.toggleState.enabledAt = null;
            this.toggleState.expiresAt = null;
        }
        
        this.saveToggleState();
        this.updateToggleButton();
        this.hideOpportunityModal();
        
        // Show confirmation
        this.showToast(
            mainToggle ? '✅ You\'re now open to opportunities!' : '🔒 You\'re now hidden from opportunity seekers',
            mainToggle ? 'success' : 'info'
        );
        
        // Track the change
        this.trackToggleChange(mainToggle);
    }

    /**
     * Update toggle button appearance
     */
    updateToggleButton() {
        const button = document.getElementById('opportunityToggle');
        if (!button) return;
        
        const icon = button.querySelector('.toggle-icon');
        const badge = button.querySelector('.toggle-badge');
        
        if (this.toggleState.enabled) {
            button.className = 'opportunity-toggle active';
            icon.textContent = '🟢';
            
            if (!badge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'toggle-badge';
                newBadge.textContent = 'ON';
                button.appendChild(newBadge);
            }
        } else {
            button.className = 'opportunity-toggle inactive';
            icon.textContent = '⚫';
            
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Show opportunity modal
     */
    showOpportunityModal() {
        const modal = document.getElementById('opportunityModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideOpportunityModal() {
        const modal = document.getElementById('opportunityModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Show matching interface
     */
    async showMatchingInterface() {
        if (!this.toggleState.enabled) {
            this.showToast('Enable your opportunity toggle first to see other professionals', 'warning');
            this.showOpportunityModal();
            return;
        }
        
        const interface = document.getElementById('matchingInterface');
        if (interface) {
            interface.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Load initial matches
            await this.loadMatches();
            await this.loadHotLeads();
        }
    }

    hideMatchingInterface() {
        const interface = document.getElementById('matchingInterface');
        if (interface) {
            interface.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * Load professional matches
     */
    async loadMatches(filter = 'all') {
        // Generate mock matches for demo
        const matches = this.generateMockMatches(filter);
        
        const container = document.getElementById('matchesList');
        if (!container) return;
        
        if (matches.length === 0) {
            container.innerHTML = `
                <div class="empty-matches">
                    <span class="empty-icon">🔍</span>
                    <p>No professionals matching your criteria right now</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = matches.map(match => this.renderMatchCard(match)).join('');
    }

    /**
     * Load hot leads (recently active)
     */
    async loadHotLeads() {
        const hotLeads = this.generateMockMatches('all', true).slice(0, 3);
        
        const container = document.getElementById('hotLeadsList');
        if (!container) return;
        
        if (hotLeads.length === 0) {
            container.innerHTML = `
                <div class="empty-leads">
                    <span class="empty-icon">😴</span>
                    <p>No hot leads right now</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = hotLeads.map(lead => this.renderHotLeadCard(lead)).join('');
    }

    /**
     * Generate mock professional matches
     */
    generateMockMatches(filter = 'all', hotLeadsOnly = false) {
        const personas = filter === 'all' ? 
            ['developer', 'publishing', 'investor', 'service'] : 
            [filter];
        
        const mockUsers = [];
        const names = [
            'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Williams', 'David Kim',
            'Lisa Zhang', 'Tom Anderson', 'Maria Garcia', 'John Smith', 'Anna Kowalski'
        ];
        
        const companies = {
            developer: ['Indie Studio', 'Unity Technologies', 'Epic Games', 'Valve', 'CD Projekt'],
            publishing: ['Electronic Arts', 'Activision', 'Ubisoft', 'Take-Two', 'Sony Interactive'],
            investor: ['Andreessen Horowitz', 'Sequoia Capital', 'Index Ventures', 'Accel', 'Bessemer'],
            service: ['Keywords Studios', 'Globalization Partners', 'Audiokinetic', 'Wwise', 'Localization World']
        };
        
        personas.forEach(persona => {
            const personaOpportunities = this.opportunityTypes[persona];
            
            for (let i = 0; i < (hotLeadsOnly ? 2 : 5); i++) {
                const name = names[Math.floor(Math.random() * names.length)];
                const company = companies[persona][Math.floor(Math.random() * companies[persona].length)];
                
                // Generate random opportunities
                const lookingFor = personaOpportunities.looking
                    .filter(() => Math.random() > 0.6)
                    .slice(0, 3);
                
                const offering = personaOpportunities.offering
                    .filter(() => Math.random() > 0.6)
                    .slice(0, 2);
                
                const user = {
                    id: `${persona}_${i}_${Date.now()}`,
                    name,
                    persona,
                    company,
                    bio: this.generateMockBio(persona),
                    lookingFor,
                    offering,
                    enabledAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000, // Within last 24 hours
                    location: this.generateMockLocation(),
                    isHotLead: hotLeadsOnly || Math.random() > 0.7
                };
                
                mockUsers.push(user);
            }
        });
        
        return mockUsers.sort((a, b) => b.enabledAt - a.enabledAt);
    }

    generateMockBio(persona) {
        const bios = {
            developer: [
                'Senior Game Developer with 8 years experience in Unity and Unreal. Looking for exciting new projects.',
                'Indie developer specializing in narrative games. Open to co-founder opportunities.',
                'Technical lead seeking consulting opportunities in VR/AR development.'
            ],
            publishing: [
                'Publishing Director looking for innovative indie games to publish. Focus on narrative and puzzle games.',
                'Marketing specialist helping games reach new audiences. 15 years in gaming.',
                'Business development manager seeking strategic partnerships in mobile gaming.'
            ],
            investor: [
                'Seed investor focused on gaming startups. Portfolio includes 12 successful exits.',
                'Looking for Series A opportunities in gaming infrastructure and tools.',
                'Strategic advisor with deep gaming industry connections.'
            ],
            service: [
                'QA and localization services for indie and AA studios. 50+ games shipped.',
                'Audio production and music composition for games. Emmy-nominated composer.',
                'Legal services specializing in gaming contracts and IP protection.'
            ]
        };
        
        const personaBios = bios[persona] || bios.developer;
        return personaBios[Math.floor(Math.random() * personaBios.length)];
    }

    generateMockLocation() {
        const venues = [
            'Koelnmesse', 'Marriott Hotel', 'Dorint Hotel', 'Radisson Blu',
            'Belgian Quarter', 'Old Town', 'Conference Center'
        ];
        
        return venues[Math.floor(Math.random() * venues.length)];
    }

    /**
     * Render match card
     */
    renderMatchCard(match) {
        return `
            <div class="match-card ${match.isHotLead ? 'hot-lead' : ''}" data-user-id="${match.id}">
                <div class="match-header">
                    <div class="match-avatar">
                        ${this.getPersonaIcon(match.persona)}
                    </div>
                    <div class="match-info">
                        <h4 class="match-name">${match.name}</h4>
                        <p class="match-company">${match.company}</p>
                        <div class="match-persona">
                            ${this.getPersonaLabel(match.persona)}
                        </div>
                    </div>
                    <div class="match-actions">
                        ${match.isHotLead ? '<span class="hot-badge">🔥 Hot</span>' : ''}
                        <span class="match-time">${this.getRelativeTime(match.enabledAt)}</span>
                    </div>
                </div>
                
                <div class="match-bio">
                    <p>${match.bio}</p>
                </div>
                
                <div class="match-opportunities">
                    ${match.lookingFor.length > 0 ? `
                        <div class="opportunity-section">
                            <h5>🔍 Looking for:</h5>
                            <div class="opportunity-tags">
                                ${match.lookingFor.map(opp => `
                                    <span class="opportunity-tag">${opp.icon} ${opp.label}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${match.offering.length > 0 ? `
                        <div class="opportunity-section">
                            <h5>💼 Offering:</h5>
                            <div class="opportunity-tags">
                                ${match.offering.map(opp => `
                                    <span class="opportunity-tag offering">${opp.icon} ${opp.label}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="match-footer">
                    <div class="match-location">📍 ${match.location}</div>
                    <button class="btn btn-primary message-btn" data-user-id="${match.id}">
                        📩 Send Message
                    </button>
                </div>
            </div>
        `;
    }

    renderHotLeadCard(lead) {
        return `
            <div class="hot-lead-card" data-user-id="${lead.id}">
                <div class="hot-lead-header">
                    <div class="lead-avatar">
                        ${this.getPersonaIcon(lead.persona)}
                    </div>
                    <div class="lead-info">
                        <h4>${lead.name}</h4>
                        <p>${lead.company}</p>
                    </div>
                    <div class="hot-indicator">🔥</div>
                </div>
                
                <div class="lead-summary">
                    <p>${lead.bio.substring(0, 80)}...</p>
                </div>
                
                <button class="btn btn-sm btn-primary message-btn" data-user-id="${lead.id}">
                    Quick Message
                </button>
            </div>
        `;
    }

    /**
     * Handle contact method change
     */
    handleContactMethodChange(method) {
        const contactInput = document.getElementById('contactInput');
        const contactValue = document.getElementById('contactValue');
        
        if (method === 'platform') {
            contactInput.classList.add('hidden');
            contactInput.classList.remove('visible');
        } else {
            contactInput.classList.remove('hidden');
            contactInput.classList.add('visible');
            contactValue.placeholder = this.getContactPlaceholder();
        }
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(filter) {
        // Update active filter
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });
        
        // Update opportunity filters based on persona
        this.updateOpportunityFilters(filter);
        
        // Reload matches
        this.loadMatches(filter);
    }

    updateOpportunityFilters(persona) {
        const container = document.getElementById('opportunityFilters');
        if (!container || persona === 'all') {
            if (container) container.innerHTML = '';
            return;
        }
        
        const opportunities = this.opportunityTypes[persona];
        if (!opportunities) return;
        
        const allOpps = [...opportunities.looking, ...opportunities.offering];
        container.innerHTML = allOpps.map(opp => `
            <button class="filter-chip" data-opportunity="${opp.id}">
                ${opp.icon} ${opp.label}
            </button>
        `).join('');
    }

    /**
     * Apply message template
     */
    applyMessageTemplate(templateType) {
        const textarea = document.getElementById('messageContent');
        if (!textarea) return;
        
        const templates = {
            intro: "Hi! I saw your profile on the Gamescom network and would love to connect. I'm particularly interested in [mention specific opportunity]. Would you be open to a quick chat?",
            collaboration: "Hello! I noticed we might have some synergy for potential collaboration. I'm working on [your project/area] and think there could be mutual value. Would you like to discuss?",
            opportunity: "Hi! I have an opportunity that might interest you based on your profile. I'm looking for [specific need] and think your background could be a great fit. Are you available for a brief conversation?",
            meeting: "Hello! I'd love to meet in person at Gamescom to discuss potential opportunities. Are you available for coffee or a quick meeting? I'll be at [location/event] if that works."
        };
        
        textarea.value = templates[templateType] || '';
        document.getElementById('messageCount').textContent = textarea.value.length;
    }

    /**
     * Send professional message
     */
    async sendProfessionalMessage() {
        const messageContent = document.getElementById('messageContent');
        const recipientId = this.currentRecipient?.id;
        
        if (!messageContent || !recipientId) {
            this.showToast('Unable to send message. Please try again.', 'error');
            return;
        }
        
        const message = messageContent.value.trim();
        if (!message) {
            this.showToast('Please write a message before sending.', 'warning');
            return;
        }
        
        // Check daily limit
        if (this.getTodayMessageCount() >= this.DAILY_MESSAGE_LIMIT) {
            this.showToast('Daily message limit reached. Try again tomorrow.', 'warning');
            return;
        }
        
        // Check if user is blocked
        if (this.blockedUsers.includes(recipientId)) {
            this.showToast('Unable to send message to this user.', 'error');
            return;
        }
        
        try {
            // Record message
            const messageRecord = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                recipientId,
                recipientName: this.currentRecipient.name,
                content: message,
                timestamp: Date.now(),
                status: 'sent'
            };
            
            this.messageHistory.push(messageRecord);
            this.saveMessageHistory();
            
            // TODO: Send via backend when available
            console.log('Message sent:', messageRecord);
            
            // Close modal and show success
            this.hideMessageModal();
            this.showToast('✅ Message sent successfully!', 'success');
            
            // Track the message
            this.trackMessage(recipientId, message.length);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showToast('Failed to send message. Please try again.', 'error');
        }
    }

    /**
     * Show message modal
     */
    showMessageModal(userId) {
        const modal = document.getElementById('messageModal');
        if (!modal) return;
        
        // Find the user data
        this.currentRecipient = this.findUserById(userId);
        if (!this.currentRecipient) {
            this.showToast('User not found. Please try again.', 'error');
            return;
        }
        
        // Populate recipient info
        const recipientInfo = document.getElementById('recipientInfo');
        if (recipientInfo) {
            recipientInfo.innerHTML = `
                <div class="recipient-card">
                    <div class="recipient-avatar">
                        ${this.getPersonaIcon(this.currentRecipient.persona)}
                    </div>
                    <div class="recipient-details">
                        <h4 class="recipient-name">${this.currentRecipient.name}</h4>
                        <p class="recipient-company">${this.currentRecipient.company}</p>
                        <div class="recipient-persona">
                            ${this.getPersonaLabel(this.currentRecipient.persona)}
                        </div>
                    </div>
                    <div class="recipient-opportunities">
                        ${this.currentRecipient.lookingFor.length > 0 ? `
                            <div class="mini-opportunity-section">
                                <span class="mini-label">Looking for:</span>
                                ${this.currentRecipient.lookingFor.slice(0, 2).map(opp => `
                                    <span class="mini-tag">${opp.icon} ${opp.label}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Clear message content
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            messageContent.value = '';
            document.getElementById('messageCount').textContent = '0';
        }
        
        // Update daily limit display
        const dailyLimitText = document.getElementById('dailyLimitText');
        if (dailyLimitText) {
            const count = this.getTodayMessageCount();
            dailyLimitText.textContent = `Messages sent today: ${count}/${this.DAILY_MESSAGE_LIMIT}`;
            
            if (count >= this.DAILY_MESSAGE_LIMIT) {
                dailyLimitText.style.color = 'var(--danger)';
            }
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on message textarea
        setTimeout(() => messageContent?.focus(), 100);
    }

    hideMessageModal() {
        const modal = document.getElementById('messageModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.currentRecipient = null;
    }

    /**
     * Find user by ID in matches
     */
    findUserById(userId) {
        // In a real app, this would query the backend
        // For demo, we'll generate a mock user
        const personas = ['developer', 'publishing', 'investor', 'service'];
        const persona = personas[Math.floor(Math.random() * personas.length)];
        
        return {
            id: userId,
            name: 'Demo User',
            persona,
            company: 'Demo Company',
            lookingFor: this.opportunityTypes[persona].looking.slice(0, 2),
            offering: this.opportunityTypes[persona].offering.slice(0, 2)
        };
    }

    /**
     * Utility methods
     */
    getUserPersona() {
        return localStorage.getItem('gamescom_user_persona') || 'developer';
    }

    getPersonaIcon(persona) {
        const icons = {
            developer: '👨‍💻',
            publishing: '📢',
            investor: '💼',
            service: '🛠️'
        };
        return icons[persona] || '👤';
    }

    getPersonaLabel(persona) {
        const labels = {
            developer: 'Game Developer',
            publishing: 'Publisher/Marketing',
            investor: 'Investor/VC',
            service: 'Service Provider'
        };
        return labels[persona] || 'Professional';
    }

    getContactPlaceholder() {
        switch (this.toggleState.contact.method) {
            case 'email': return 'your@email.com';
            case 'linkedin': return 'linkedin.com/in/yourprofile';
            default: return '';
        }
    }

    getExpiryText() {
        if (!this.toggleState.expiresAt) return 'Never';
        
        const days = Math.ceil((this.toggleState.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
        return `${days} days`;
    }

    getRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        const hours = Math.floor(diff / (60 * 60 * 1000));
        
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    getTodayMessageCount() {
        const today = new Date().toDateString();
        return this.messageHistory.filter(msg => 
            new Date(msg.timestamp).toDateString() === today
        ).length;
    }

    checkAutoExpiry() {
        if (this.toggleState.enabled && this.toggleState.expiresAt) {
            if (Date.now() > this.toggleState.expiresAt) {
                this.toggleState.enabled = false;
                this.toggleState.enabledAt = null;
                this.toggleState.expiresAt = null;
                this.saveToggleState();
                this.updateToggleButton();
                
                this.showToast('⏰ Your opportunity toggle has automatically expired', 'info');
            }
        }
    }

    startUpdateIntervals() {
        // Check expiry every hour
        setInterval(() => this.checkAutoExpiry(), 60 * 60 * 1000);
        
        // Refresh matches every 5 minutes if interface is open
        setInterval(() => {
            const interface = document.getElementById('matchingInterface');
            if (interface && interface.style.display !== 'none') {
                this.loadMatches();
                this.loadHotLeads();
            }
        }, 5 * 60 * 1000);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `opportunity-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    trackToggleChange(enabled) {
        if (window.analytics) {
            window.analytics.track('opportunity_toggle_changed', {
                enabled,
                persona: this.getUserPersona(),
                looking_for_count: this.toggleState.lookingFor.length,
                offering_count: this.toggleState.offering.length
            });
        }
        
        console.log(`🎯 Opportunity toggle ${enabled ? 'enabled' : 'disabled'}`);
    }

    trackMessage(recipientId, messageLength) {
        if (window.analytics) {
            window.analytics.track('professional_message_sent', {
                recipient_persona: this.currentRecipient?.persona,
                sender_persona: this.getUserPersona(),
                message_length: messageLength,
                daily_count: this.getTodayMessageCount()
            });
        }
        
        console.log(`📩 Message sent to ${recipientId}`);
    }

    /**
     * Block/report functionality (anti-spam)
     */
    blockUser(userId) {
        if (!this.blockedUsers.includes(userId)) {
            this.blockedUsers.push(userId);
            this.saveBlockedUsers();
            this.showToast('User blocked successfully', 'success');
        }
    }

    reportUser(userId, reason) {
        // TODO: Send report to backend
        console.log(`User ${userId} reported for: ${reason}`);
        this.showToast('User reported. Thank you for helping keep our community safe.', 'success');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.opportunityToggleManager = new OpportunityToggleManager();
    
    // Add opportunities button to navigation
    setTimeout(() => {
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !document.getElementById('showOpportunitiesBtn')) {
            const btn = document.createElement('button');
            btn.id = 'showOpportunitiesBtn';
            btn.className = 'btn btn-secondary btn-sm';
            btn.innerHTML = '🎯 Find Opportunities';
            btn.onclick = () => window.opportunityToggleManager.showMatchingInterface();
            
            // Insert after the opportunity toggle
            const toggle = document.getElementById('opportunityToggle');
            if (toggle && toggle.nextSibling) {
                navActions.insertBefore(btn, toggle.nextSibling);
            } else {
                navActions.appendChild(btn);
            }
        }
    }, 1000);
});

// Export for external use
window.OpportunityToggleManager = OpportunityToggleManager;