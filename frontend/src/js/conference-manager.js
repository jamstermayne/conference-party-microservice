/**
 * 🏆 CROSS-CONFERENCE PERSISTENCE SYSTEM
 * Transforms single-event usage into permanent professional network
 * Creates competitive moat through network continuity and growth
 */

class ConferenceManager {
    constructor() {
        // Conference definitions
        this.conferences = {
            'gamescom-2025': {
                id: 'gamescom-2025',
                name: 'Gamescom 2025',
                shortName: 'Gamescom 25',
                type: 'consumer',
                location: 'Cologne, Germany',
                dates: {
                    start: '2025-08-20',
                    end: '2025-08-24'
                },
                focus: ['gaming', 'consumer', 'publishing'],
                estimatedAttendees: 370000,
                badge: '🎮',
                color: 'var(--alias-7c3aed)'
            },
            'gdc-2026': {
                id: 'gdc-2026',
                name: 'Game Developers Conference 2026',
                shortName: 'GDC 26',
                type: 'professional',
                location: 'San Francisco, USA',
                dates: {
                    start: '2026-03-16',
                    end: '2026-03-20'
                },
                focus: ['development', 'technical', 'business'],
                estimatedAttendees: 28000,
                badge: '🛠️',
                color: 'var(--success)'
            },
            'e3-2026': {
                id: 'e3-2026',
                name: 'E3 2026',
                shortName: 'E3 26',
                type: 'industry',
                location: 'Los Angeles, USA',
                dates: {
                    start: '2026-06-09',
                    end: '2026-06-11'
                },
                focus: ['publishing', 'media', 'consumer'],
                estimatedAttendees: 65000,
                badge: '🎯',
                color: 'var(--warning)'
            },
            'pax-west-2025': {
                id: 'pax-west-2025',
                name: 'PAX West 2025',
                shortName: 'PAX West 25',
                type: 'consumer',
                location: 'Seattle, USA',
                dates: {
                    start: '2025-08-29',
                    end: '2025-09-01'
                },
                focus: ['indie', 'community', 'consumer'],
                estimatedAttendees: 90000,
                badge: '🎪',
                color: 'var(--error)'
            }
        };
        
        // User data
        this.userProfile = this.loadUserProfile();
        this.attendanceHistory = this.loadAttendanceHistory();
        this.networkData = this.loadNetworkData();
        this.achievements = this.loadAchievements();
        
        // Current conference context
        this.currentConference = 'gamescom-2025'; // Default for demo
        
        // Network analytics
        this.networkAnalytics = this.loadNetworkAnalytics();
        
        this.init();
    }

    async init() {
        try {
            // Set up current conference context
            this.setupCurrentConference();
            
            // Create cross-conference UI
            this.createNetworkModal();
            this.createAchievementsDisplay();
            this.createConferenceSelector();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Update navigation with network info
            this.updateNavigationWithNetwork();
            
            // Check for network growth opportunities
            this.checkNetworkGrowth();
            
            console.log('✅ Conference Manager initialized');
            console.log(`📊 Network: ${this.getNetworkSize()} professionals across ${this.getConferenceCount()} conferences`);
            
        } catch (error) {
            console.error('❌ Conference Manager initialization failed:', error);
        }
    }

    /**
     * Load user profile data
     */
    loadUserProfile() {
        try {
            const stored = localStorage.getItem('gamescom_cross_conference_profile');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
        
        // Create initial profile from existing data
        const persona = localStorage.getItem('gamescom_user_persona') || 'developer';
        const onboardingData = localStorage.getItem('gamescom_onboarding_completed');
        
        let profile = {
            userId: this.getUserId(),
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            persona,
            conferenceCount: 1,
            totalConnections: 0,
            achievements: [],
            bio: '',
            skills: [],
            interests: [],
            socialLinks: {}
        };
        
        // Import from onboarding if available
        if (onboardingData) {
            try {
                const onboarding = JSON.parse(onboardingData);
                if (onboarding.profile) {
                    profile.bio = onboarding.profile.company || '';
                    profile.interests = onboarding.preferences?.interests || [];
                }
            } catch (e) {}
        }
        
        this.saveUserProfile(profile);
        return profile;
    }

    saveUserProfile(profile = null) {
        const dataToSave = profile || this.userProfile;
        dataToSave.lastActiveAt = Date.now();
        localStorage.setItem('gamescom_cross_conference_profile', JSON.stringify(dataToSave));
    }

    loadAttendanceHistory() {
        try {
            const stored = localStorage.getItem('gamescom_attendance_history');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load attendance history:', error);
        }
        
        // Initialize with current conference
        const history = [{
            conferenceId: this.currentConference,
            attendedAt: Date.now(),
            connectionsCount: 0,
            invitesUsed: 0,
            invitesRemaining: 10,
            hotspotVisits: 0,
            messagesExchanged: 0
        }];
        
        this.saveAttendanceHistory(history);
        return history;
    }

    saveAttendanceHistory(history = null) {
        const dataToSave = history || this.attendanceHistory;
        localStorage.setItem('gamescom_attendance_history', JSON.stringify(dataToSave));
    }

    loadNetworkData() {
        try {
            const stored = localStorage.getItem('gamescom_network_data');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load network data:', error);
        }
        
        return {
            connections: [],
            pendingConnections: [],
            blockedUsers: [],
            conferenceNetworks: {},
            lastSyncAt: Date.now()
        };
    }

    saveNetworkData() {
        this.networkData.lastSyncAt = Date.now();
        localStorage.setItem('gamescom_network_data', JSON.stringify(this.networkData));
    }

    loadAchievements() {
        try {
            const stored = localStorage.getItem('gamescom_achievements');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load achievements:', error);
        }
        
        // Award first conference achievement
        const achievements = [{
            id: 'first_conference',
            name: 'Conference Debut',
            description: 'Attended your first conference',
            badge: '🚀',
            unlockedAt: Date.now(),
            conferenceId: this.currentConference
        }];
        
        this.saveAchievements(achievements);
        return achievements;
    }

    saveAchievements(achievements = null) {
        const dataToSave = achievements || this.achievements;
        localStorage.setItem('gamescom_achievements', JSON.stringify(dataToSave));
    }

    loadNetworkAnalytics() {
        try {
            const stored = localStorage.getItem('gamescom_network_analytics');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load network analytics:', error);
        }
        
        return {
            totalConnections: 0,
            connectionsByConference: {},
            connectionsByPersona: {},
            growthByMonth: {},
            lastCalculatedAt: Date.now()
        };
    }

    saveNetworkAnalytics() {
        this.networkAnalytics.lastCalculatedAt = Date.now();
        localStorage.setItem('gamescom_network_analytics', JSON.stringify(this.networkAnalytics));
    }

    /**
     * Setup current conference context
     */
    setupCurrentConference() {
        // Determine current conference based on dates
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // For demo, we'll use Gamescom 2025 as current
        this.currentConference = 'gamescom-2025';
        
        // Check if this is a new conference for the user
        const hasAttended = this.attendanceHistory.some(att => att.conferenceId === this.currentConference);
        
        if (!hasAttended) {
            // New conference - reset invite pool and add to history
            this.addNewConferenceAttendance(this.currentConference);
        }
    }

    addNewConferenceAttendance(conferenceId) {
        const newAttendance = {
            conferenceId,
            attendedAt: Date.now(),
            connectionsCount: 0,
            invitesUsed: 0,
            invitesRemaining: 10, // Fresh invite pool
            hotspotVisits: 0,
            messagesExchanged: 0
        };
        
        this.attendanceHistory.push(newAttendance);
        this.saveAttendanceHistory();
        
        // Update user profile
        this.userProfile.conferenceCount = this.attendanceHistory.length;
        this.saveUserProfile();
        
        // Check for multi-conference achievements
        this.checkAchievements();
    }

    /**
     * Create network modal
     */
    createNetworkModal() {
        const modal = document.createElement('div');
        modal.id = 'networkModal';
        modal.className = 'network-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="network-modal-overlay">
                <div class="network-modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">🌐 Your Professional Network</h2>
                        <button class="modal-close" id="closeNetworkModal">&times;</button>
                    </div>
                    
                    <div class="network-stats-section">
                        <div class="network-overview">
                            <div class="overview-stat">
                                <div class="stat-value">${this.getNetworkSize()}</div>
                                <div class="stat-label">Total Connections</div>
                            </div>
                            <div class="overview-stat">
                                <div class="stat-value">${this.getConferenceCount()}</div>
                                <div class="stat-label">Conferences Attended</div>
                            </div>
                            <div class="overview-stat">
                                <div class="stat-value">${this.getNetworkGrowthPercentage()}%</div>
                                <div class="stat-label">Network Growth</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="network-tabs">
                        <button class="network-tab active" data-tab="conferences">Conference History</button>
                        <button class="network-tab" data-tab="connections">Connections</button>
                        <button class="network-tab" data-tab="alumni">Alumni Network</button>
                        <button class="network-tab" data-tab="insights">Insights</button>
                    </div>
                    
                    <div class="network-content">
                        <div class="tab-content active" id="conferencesTab">
                            ${this.renderConferenceHistory()}
                        </div>
                        <div class="tab-content" id="connectionsTab">
                            ${this.renderConnections()}
                        </div>
                        <div class="tab-content" id="alumniTab">
                            ${this.renderAlumniNetwork()}
                        </div>
                        <div class="tab-content" id="insightsTab">
                            ${this.renderNetworkInsights()}
                        </div>
                    </div>
                    
                    <div class="network-actions">
                        <button class="btn btn-primary" id="syncNetworkBtn">🔄 Sync Network</button>
                        <button class="btn btn-secondary" id="exportNetworkBtn">📤 Export Data</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    renderConferenceHistory() {
        if (this.attendanceHistory.length === 0) {
            return `
                <div class="empty-state">
                    <span class="empty-icon">🎪</span>
                    <p>No conference history yet</p>
                </div>
            `;
        }
        
        return `
            <div class="conference-timeline">
                ${this.attendanceHistory.reverse().map(attendance => {
                    const conf = this.conferences[attendance.conferenceId];
                    const isCurrent = attendance.conferenceId === this.currentConference;
                    
                    return `
                        <div class="conference-item ${isCurrent ? 'current' : ''}">
                            <div class="conference-badge" style="background: ${conf?.color || '#gray'}">
                                ${conf?.badge || '🎪'}
                            </div>
                            <div class="conference-details">
                                <h4 class="conference-name">
                                    ${conf?.name || 'Unknown Conference'}
                                    ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                                </h4>
                                <p class="conference-meta">
                                    ${conf?.location} • ${this.formatDate(attendance.attendedAt)}
                                </p>
                                <div class="conference-stats">
                                    <span class="stat-item">
                                        👥 ${attendance.connectionsCount} connections
                                    </span>
                                    <span class="stat-item">
                                        📨 ${attendance.messagesExchanged} messages
                                    </span>
                                    <span class="stat-item">
                                        🔥 ${attendance.hotspotVisits} hotspot visits
                                    </span>
                                </div>
                            </div>
                            <div class="conference-actions">
                                ${isCurrent ? 
                                    `<button class="btn btn-sm btn-primary">View Events</button>` :
                                    `<button class="btn btn-sm btn-secondary">View Alumni</button>`
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderConnections() {
        // Generate mock connections for demo
        const mockConnections = this.generateMockConnections();
        
        if (mockConnections.length === 0) {
            return `
                <div class="empty-state">
                    <span class="empty-icon">🤝</span>
                    <p>No connections yet. Start networking!</p>
                    <button class="btn btn-primary" onclick="window.opportunityToggleManager.showMatchingInterface()">
                        Find Opportunities
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="connections-filters">
                <button class="filter-btn active" data-filter="all">All (${mockConnections.length})</button>
                <button class="filter-btn" data-filter="current">Current Conference</button>
                <button class="filter-btn" data-filter="alumni">Alumni</button>
            </div>
            
            <div class="connections-list">
                ${mockConnections.map(connection => `
                    <div class="connection-item" data-conference="${connection.conferenceId}">
                        <div class="connection-avatar">
                            ${this.getPersonaIcon(connection.persona)}
                        </div>
                        <div class="connection-info">
                            <h5 class="connection-name">${connection.name}</h5>
                            <p class="connection-company">${connection.company}</p>
                            <div class="connection-meta">
                                <span class="connection-conference">
                                    ${this.conferences[connection.conferenceId]?.badge} 
                                    ${this.conferences[connection.conferenceId]?.shortName}
                                </span>
                                <span class="connection-date">${this.getRelativeTime(connection.connectedAt)}</span>
                            </div>
                        </div>
                        <div class="connection-actions">
                            <button class="btn btn-sm btn-outline">💬 Message</button>
                            <button class="btn btn-sm btn-ghost">👁️ View</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAlumniNetwork() {
        const alumniData = this.generateAlumniData();
        
        return `
            <div class="alumni-header">
                <h3>Conference Alumni Network</h3>
                <p>Connect with professionals from your past conferences</p>
            </div>
            
            <div class="alumni-stats">
                <div class="alumni-stat">
                    <div class="stat-value">${alumniData.totalAlumni}</div>
                    <div class="stat-label">Total Alumni</div>
                </div>
                <div class="alumni-stat">
                    <div class="stat-value">${alumniData.activeAlumni}</div>
                    <div class="stat-label">Currently Active</div>
                </div>
                <div class="alumni-stat">
                    <div class="stat-value">${alumniData.crossConferenceConnections}</div>
                    <div class="stat-label">Cross-Conference</div>
                </div>
            </div>
            
            <div class="alumni-conferences">
                ${Object.entries(alumniData.byConference).map(([confId, data]) => {
                    const conf = this.conferences[confId];
                    return `
                        <div class="alumni-conference-item">
                            <div class="alumni-conference-header">
                                <span class="conference-badge" style="background: ${conf?.color}">
                                    ${conf?.badge}
                                </span>
                                <h4>${conf?.shortName}</h4>
                                <span class="alumni-count">${data.count} alumni</span>
                            </div>
                            <div class="alumni-preview">
                                ${data.preview.map(alumni => `
                                    <div class="alumni-preview-item">
                                        <span class="alumni-avatar">${this.getPersonaIcon(alumni.persona)}</span>
                                        <span class="alumni-name">${alumni.name}</span>
                                        ${alumni.isActive ? '<span class="active-indicator">🟢</span>' : ''}
                                    </div>
                                `).join('')}
                            </div>
                            <button class="btn btn-sm btn-outline alumni-view-btn" data-conference="${confId}">
                                View All ${data.count} Alumni
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="alumni-recommendations">
                <h4>🎯 Recommended Reconnections</h4>
                <p>Alumni who might be relevant for your current opportunities</p>
                <div class="recommendation-list">
                    ${alumniData.recommendations.map(rec => `
                        <div class="recommendation-item">
                            <div class="rec-avatar">${this.getPersonaIcon(rec.persona)}</div>
                            <div class="rec-info">
                                <h5>${rec.name}</h5>
                                <p>${rec.company}</p>
                                <div class="rec-reason">${rec.reason}</div>
                            </div>
                            <button class="btn btn-sm btn-primary">Reconnect</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderNetworkInsights() {
        const insights = this.generateNetworkInsights();
        
        return `
            <div class="insights-overview">
                <h3>Network Analytics</h3>
                <p>Understand your professional network growth and composition</p>
            </div>
            
            <div class="insights-grid">
                <div class="insight-card">
                    <h4>📈 Growth Trajectory</h4>
                    <div class="growth-chart">
                        <div class="growth-stat">
                            <span class="growth-value">+${insights.growth.percentageIncrease}%</span>
                            <span class="growth-label">Since last conference</span>
                        </div>
                        <div class="growth-timeline">
                            ${insights.growth.timeline.map(point => `
                                <div class="timeline-point">
                                    <div class="point-marker"></div>
                                    <div class="point-label">${point.conference}</div>
                                    <div class="point-value">${point.connections}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="insight-card">
                    <h4>👥 Network Composition</h4>
                    <div class="composition-chart">
                        ${Object.entries(insights.composition.byPersona).map(([persona, data]) => `
                            <div class="composition-item">
                                <span class="composition-icon">${this.getPersonaIcon(persona)}</span>
                                <span class="composition-label">${this.getPersonaLabel(persona)}</span>
                                <div class="composition-bar">
                                    <div class="bar-fill" style="width: ${data.percentage}%"></div>
                                </div>
                                <span class="composition-value">${data.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="insight-card">
                    <h4>🌍 Geographic Distribution</h4>
                    <div class="geo-distribution">
                        ${insights.geography.map(geo => `
                            <div class="geo-item">
                                <span class="geo-flag">${geo.flag}</span>
                                <span class="geo-location">${geo.location}</span>
                                <span class="geo-count">${geo.count} connections</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="insight-card">
                    <h4>⭐ Success Metrics</h4>
                    <div class="success-metrics">
                        <div class="metric-item">
                            <span class="metric-value">${insights.success.averageConnectionsPerConference}</span>
                            <span class="metric-label">Avg connections per conference</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${insights.success.responseRate}%</span>
                            <span class="metric-label">Message response rate</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-value">${insights.success.crossConferenceReconnections}</span>
                            <span class="metric-label">Cross-conference reconnections</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="insights-recommendations">
                <h4>💡 Network Growth Recommendations</h4>
                <div class="rec-list">
                    ${insights.recommendations.map(rec => `
                        <div class="insight-rec">
                            <span class="rec-icon">${rec.icon}</span>
                            <div class="rec-content">
                                <h5>${rec.title}</h5>
                                <p>${rec.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create achievements display
     */
    createAchievementsDisplay() {
        // Add achievements to profile or navigation
        const existingDisplay = document.getElementById('achievementsDisplay');
        if (existingDisplay) return;
        
        const display = document.createElement('div');
        display.id = 'achievementsDisplay';
        display.className = 'achievements-display';
        display.innerHTML = `
            <div class="achievements-header" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="achievements-icon">🏆</span>
                <span class="achievements-count">${this.achievements.length}</span>
                <span class="achievements-text">Achievements</span>
            </div>
            <div class="achievements-list">
                ${this.achievements.slice(0, 3).map(achievement => `
                    <div class="achievement-item">
                        <span class="achievement-badge">${achievement.badge}</span>
                        <div class="achievement-info">
                            <h5>${achievement.name}</h5>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add to nav or create floating element
        const nav = document.querySelector('.nav-actions');
        if (nav) {
            nav.appendChild(display);
        } else {
            document.body.appendChild(display);
        }
    }

    /**
     * Create conference selector
     */
    createConferenceSelector() {
        // Check if selector already exists
        const existingSelector = document.getElementById('conferenceSelector');
        if (existingSelector) return existingSelector;
        
        const selector = document.createElement('select');
        selector.id = 'conferenceSelector';
        selector.className = 'conference-selector';
        
        // Add default Gamescom 2025 option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'gamescom2025';
        defaultOption.textContent = 'Gamescom 2025';
        defaultOption.selected = true;
        selector.appendChild(defaultOption);
        
        // Add other conference options if needed in the future
        // For now, only Gamescom 2025 is available
        
        // Add change event listener
        selector.addEventListener('change', (e) => {
            console.log('Conference switched to:', e.target.value);
            // Conference switching logic would go here
        });
        
        return selector;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Network modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeNetworkModal') {
                this.hideNetworkModal();
            }
            
            if (e.target.id === 'showNetworkBtn' || e.target.closest('#showNetworkBtn')) {
                this.showNetworkModal();
            }
        });
        
        // Network tabs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('network-tab')) {
                this.switchNetworkTab(e.target.dataset.tab);
            }
        });
        
        // Sync network
        document.addEventListener('click', (e) => {
            if (e.target.id === 'syncNetworkBtn') {
                this.syncNetwork();
            }
        });
        
        // Export network
        document.addEventListener('click', (e) => {
            if (e.target.id === 'exportNetworkBtn') {
                this.exportNetworkData();
            }
        });
    }

    /**
     * Update navigation with network info
     */
    updateNavigationWithNetwork() {
        // Add network button to navigation
        const navActions = document.querySelector('.nav-actions');
        if (navActions && !document.getElementById('networkBtn')) {
            const networkBtn = document.createElement('button');
            networkBtn.id = 'networkBtn';
            networkBtn.className = 'network-nav-btn';
            networkBtn.innerHTML = `
                <span class="network-icon">🌐</span>
                <span class="network-count">${this.getNetworkSize()}</span>
            `;
            networkBtn.onclick = () => this.showNetworkModal();
            
            // Insert after opportunities
            const opportunityBtn = document.getElementById('showOpportunitiesBtn');
            if (opportunityBtn) {
                navActions.insertBefore(networkBtn, opportunityBtn.nextSibling);
            } else {
                navActions.appendChild(networkBtn);
            }
        }
    }

    /**
     * Show/hide network modal
     */
    showNetworkModal() {
        const modal = document.getElementById('networkModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideNetworkModal() {
        const modal = document.getElementById('networkModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    switchNetworkTab(tabName) {
        // Update active tab
        document.querySelectorAll('.network-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    /**
     * Network operations
     */
    async syncNetwork() {
        // Show syncing state
        const syncBtn = document.getElementById('syncNetworkBtn');
        if (syncBtn) {
            syncBtn.innerHTML = '⏳ Syncing...';
            syncBtn.disabled = true;
        }
        
        try {
            // Simulate network sync
            await this.delay(2000);
            
            // Update network data
            this.calculateNetworkAnalytics();
            this.checkAchievements();
            
            // Update UI
            this.updateNetworkDisplay();
            
            // Show success
            this.showToast('✅ Network synced successfully!', 'success');
            
        } catch (error) {
            console.error('Network sync failed:', error);
            this.showToast('❌ Network sync failed. Please try again.', 'error');
        } finally {
            if (syncBtn) {
                syncBtn.innerHTML = '🔄 Sync Network';
                syncBtn.disabled = false;
            }
        }
    }

    async exportNetworkData() {
        try {
            const exportData = {
                profile: this.userProfile,
                conferences: this.attendanceHistory,
                network: this.networkData,
                achievements: this.achievements,
                analytics: this.networkAnalytics,
                exportedAt: Date.now()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gamescom-network-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('📤 Network data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('❌ Export failed. Please try again.', 'error');
        }
    }

    /**
     * Achievement system
     */
    checkAchievements() {
        const newAchievements = [];
        
        // Conference count achievements
        const confCount = this.getConferenceCount();
        if (confCount >= 3 && !this.hasAchievement('conference_veteran')) {
            newAchievements.push({
                id: 'conference_veteran',
                name: 'Conference Veteran',
                description: 'Attended 3 or more conferences',
                badge: '🏅',
                unlockedAt: Date.now()
            });
        }
        
        // Network size achievements
        const networkSize = this.getNetworkSize();
        if (networkSize >= 10 && !this.hasAchievement('networker')) {
            newAchievements.push({
                id: 'networker',
                name: 'Super Networker',
                description: 'Connected with 10+ professionals',
                badge: '🤝',
                unlockedAt: Date.now()
            });
        }
        
        if (networkSize >= 50 && !this.hasAchievement('network_builder')) {
            newAchievements.push({
                id: 'network_builder',
                name: 'Network Builder',
                description: 'Built a network of 50+ connections',
                badge: '🌟',
                unlockedAt: Date.now()
            });
        }
        
        // Cross-conference achievements
        const crossConfConnections = this.getCrossConferenceConnections();
        if (crossConfConnections >= 5 && !this.hasAchievement('cross_conference_connector')) {
            newAchievements.push({
                id: 'cross_conference_connector',
                name: 'Cross-Conference Connector',
                description: 'Maintained connections across conferences',
                badge: '🔗',
                unlockedAt: Date.now()
            });
        }
        
        // Add new achievements
        if (newAchievements.length > 0) {
            this.achievements.push(...newAchievements);
            this.saveAchievements();
            
            // Show achievement notifications
            newAchievements.forEach(achievement => {
                setTimeout(() => {
                    this.showAchievementUnlocked(achievement);
                }, 1000);
            });
        }
    }

    hasAchievement(achievementId) {
        return this.achievements.some(a => a.id === achievementId);
    }

    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-unlock">
                <div class="unlock-badge">${achievement.badge}</div>
                <div class="unlock-content">
                    <h4>Achievement Unlocked!</h4>
                    <h5>${achievement.name}</h5>
                    <p>${achievement.description}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    /**
     * Data generation for demo
     */
    generateMockConnections() {
        const connections = [];
        const names = [
            'Alex Chen', 'Sarah Wilson', 'Mike Rodriguez', 'Emma Johnson', 'David Kim',
            'Lisa Zhang', 'Tom Anderson', 'Maria Garcia', 'John Smith', 'Anna Kowalski',
            'Chris Taylor', 'Jessica Brown', 'Ryan Lee', 'Sophie Davis', 'Mark Thompson'
        ];
        
        const companies = [
            'Unity Technologies', 'Epic Games', 'Valve Corporation', 'CD Projekt Red',
            'Activision Blizzard', 'Electronic Arts', 'Ubisoft', 'Take-Two Interactive',
            'Square Enix', 'Capcom', 'FromSoftware', 'Indie Studio Co', 'GameDev Inc'
        ];
        
        const personas = ['developer', 'publishing', 'investor', 'service'];
        const conferences = Object.keys(this.conferences);
        
        // Generate connections based on conference history
        this.attendanceHistory.forEach(attendance => {
            const connectionCount = Math.floor(Math.random() * 8) + 2; // 2-9 connections per conference
            
            for (let i = 0; i < connectionCount; i++) {
                const name = names[Math.floor(Math.random() * names.length)];
                const company = companies[Math.floor(Math.random() * companies.length)];
                const persona = personas[Math.floor(Math.random() * personas.length)];
                
                connections.push({
                    id: `conn_${attendance.conferenceId}_${i}`,
                    name,
                    company,
                    persona,
                    conferenceId: attendance.conferenceId,
                    connectedAt: attendance.attendedAt + Math.random() * 86400000, // Within conference dates
                    lastContactAt: Date.now() - Math.random() * 30 * 86400000, // Within last month
                    isActive: Math.random() > 0.3 // 70% active
                });
            }
        });
        
        return connections.slice(0, 25); // Limit for demo
    }

    generateAlumniData() {
        const totalAlumni = this.getNetworkSize() + Math.floor(Math.random() * 50) + 20;
        const activeAlumni = Math.floor(totalAlumni * 0.3);
        const crossConferenceConnections = Math.floor(totalAlumni * 0.15);
        
        const byConference = {};
        Object.keys(this.conferences).forEach(confId => {
            const count = Math.floor(Math.random() * 20) + 5;
            byConference[confId] = {
                count,
                preview: this.generateAlumniPreview(3)
            };
        });
        
        const recommendations = [
            {
                name: 'Alex Chen',
                company: 'Unity Technologies',
                persona: 'developer',
                reason: 'Both attended GDC 2025 and looking for technical collaboration'
            },
            {
                name: 'Sarah Martinez',
                company: 'Indie Publishing Co',
                persona: 'publishing',
                reason: 'Publisher from E3 2025, matches your current opportunities'
            },
            {
                name: 'David Kumar',
                company: 'GameDev Ventures',
                persona: 'investor',
                reason: 'Investor you met at Gamescom, now active again'
            }
        ];
        
        return {
            totalAlumni,
            activeAlumni,
            crossConferenceConnections,
            byConference,
            recommendations
        };
    }

    generateAlumniPreview(count) {
        const names = ['Alex C.', 'Sarah M.', 'Mike R.', 'Emma J.', 'David K.'];
        const personas = ['developer', 'publishing', 'investor', 'service'];
        
        return Array(count).fill().map((_, i) => ({
            name: names[i % names.length],
            persona: personas[Math.floor(Math.random() * personas.length)],
            isActive: Math.random() > 0.5
        }));
    }

    generateNetworkInsights() {
        const currentConnections = this.getNetworkSize();
        const lastConferenceConnections = Math.max(1, currentConnections - Math.floor(Math.random() * 10) - 5);
        const percentageIncrease = Math.floor(((currentConnections - lastConferenceConnections) / lastConferenceConnections) * 100);
        
        return {
            growth: {
                percentageIncrease: Math.max(0, percentageIncrease),
                timeline: [
                    { conference: 'GDC 25', connections: Math.floor(currentConnections * 0.3) },
                    { conference: 'E3 25', connections: Math.floor(currentConnections * 0.6) },
                    { conference: 'Gamescom 25', connections: currentConnections }
                ]
            },
            composition: {
                byPersona: {
                    developer: { count: Math.floor(currentConnections * 0.4), percentage: 40 },
                    publishing: { count: Math.floor(currentConnections * 0.3), percentage: 30 },
                    investor: { count: Math.floor(currentConnections * 0.2), percentage: 20 },
                    service: { count: Math.floor(currentConnections * 0.1), percentage: 10 }
                }
            },
            geography: [
                { flag: '🇺🇸', location: 'United States', count: Math.floor(currentConnections * 0.4) },
                { flag: '🇩🇪', location: 'Germany', count: Math.floor(currentConnections * 0.25) },
                { flag: '🇬🇧', location: 'United Kingdom', count: Math.floor(currentConnections * 0.15) },
                { flag: '🇨🇦', location: 'Canada', count: Math.floor(currentConnections * 0.1) },
                { flag: '🌍', location: 'Other', count: Math.floor(currentConnections * 0.1) }
            ],
            success: {
                averageConnectionsPerConference: Math.floor(currentConnections / this.getConferenceCount()),
                responseRate: Math.floor(Math.random() * 30) + 60, // 60-90%
                crossConferenceReconnections: Math.floor(currentConnections * 0.2)
            },
            recommendations: [
                {
                    icon: '🎯',
                    title: 'Target More Investors',
                    description: 'Only 20% of your network are investors. Consider attending more investor-focused events.'
                },
                {
                    icon: '🌍',
                    title: 'Expand Geographic Reach',
                    description: 'Most connections are US-based. Try international conferences for global opportunities.'
                },
                {
                    icon: '🔄',
                    title: 'Reconnect with Alumni',
                    description: 'You have 15 inactive connections. Send them a message to reactivate relationships.'
                }
            ]
        };
    }

    /**
     * Utility methods
     */
    getUserId() {
        return localStorage.getItem('gamescom_user_id') || 'anonymous';
    }

    getNetworkSize() {
        // For demo, calculate based on conference attendance
        return this.attendanceHistory.reduce((total, att) => total + (att.connectionsCount || Math.floor(Math.random() * 8) + 2), 0);
    }

    getConferenceCount() {
        return this.attendanceHistory.length;
    }

    getCrossConferenceConnections() {
        return Math.floor(this.getNetworkSize() * 0.3); // 30% maintain cross-conference connections
    }

    getNetworkGrowthPercentage() {
        if (this.getConferenceCount() <= 1) return 0;
        return Math.floor(Math.random() * 150) + 50; // 50-200% growth
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
            developer: 'Developer',
            publishing: 'Publisher',
            investor: 'Investor',
            service: 'Service Provider'
        };
        return labels[persona] || 'Professional';
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `conference-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    calculateNetworkAnalytics() {
        // Update analytics based on current data
        this.networkAnalytics.totalConnections = this.getNetworkSize();
        this.networkAnalytics.connectionsByConference = {};
        
        this.attendanceHistory.forEach(att => {
            this.networkAnalytics.connectionsByConference[att.conferenceId] = att.connectionsCount || 0;
        });
        
        this.saveNetworkAnalytics();
    }

    updateNetworkDisplay() {
        // Update network button count
        const networkBtn = document.getElementById('networkBtn');
        if (networkBtn) {
            const countEl = networkBtn.querySelector('.network-count');
            if (countEl) {
                countEl.textContent = this.getNetworkSize();
            }
        }
        
        // Update achievements display
        const achievementsCount = document.querySelector('.achievements-count');
        if (achievementsCount) {
            achievementsCount.textContent = this.achievements.length;
        }
    }

    checkNetworkGrowth() {
        // Check for opportunities to grow network at current conference
        const currentAttendance = this.attendanceHistory.find(att => att.conferenceId === this.currentConference);
        
        if (currentAttendance && currentAttendance.connectionsCount === 0) {
            // New to conference, show welcome message
            setTimeout(() => {
                this.showToast('👋 Welcome to your first day! Start networking to build your professional network.', 'info');
            }, 3000);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.conferenceManager = new ConferenceManager();
});

// Export for external use
window.ConferenceManager = ConferenceManager;