/**
 * 🎯 OPTIMIZED EXCLUSIVE INVITE SYSTEM
 * Uses centralized storage, event management, and caching
 * Each user gets 10 invite codes maximum - creating exclusivity
 */

class InviteManager {
    constructor() {
        this.MAX_INVITES = 10;
        this.inviteData = null;
        this.currentInviteModal = null;
        this.eventKeys = []; // Track event listeners
        this.init();
    }

    async init() {
        try {
            // Load invite data with caching
            this.inviteData = await this.loadInviteData();
            
            // Check for invite code in URL on page load
            this.handleInviteDeepLink();
            
            // Create invite UI components
            this.createInviteModal();
            this.addInviteButtonToNav();
            
            // Setup optimized event listeners
            this.setupEventListeners();
            
            // Initialize QR library if needed
            this.initQRLibrary();
            
            console.log('✅ Optimized Invite Manager initialized');
            console.log(`📊 User has ${this.getRemainingInvites()} invites remaining`);
            
        } catch (error) {
            console.error('❌ Invite Manager initialization failed:', error);
        }
    }

    /**
     * Load or initialize invite data with caching
     */
    async loadInviteData() {
        try {
            // Use cache manager for optimized storage
            return await window.Cache.get('invite.data', {
                loader: async () => {
                    const stored = window.StorageManager.get('onboarding.inviteData');
                    return stored || this.getDefaultInviteData();
                },
                ttl: 300000, // 5 minutes
                persist: true
            });
        } catch (error) {
            console.error('Failed to load invite data:', error);
            return this.getDefaultInviteData();
        }
    }
    
    getDefaultInviteData() {
        
        // Initialize with default data
        const userId = this.getUserId();
        const defaultData = {
            userId,
            invitesGenerated: [],
            invitesUsed: [],
            invitedBy: null,
            createdAt: new Date().toISOString()
        };
        
        this.saveInviteData(defaultData);
        return defaultData;
    }

    saveInviteData(data = null) {
        const dataToSave = data || this.inviteData;
        localStorage.setItem('gamescom_invite_data', JSON.stringify(dataToSave));
    }

    /**
     * Generate unique invite code
     */
    generateInviteCode() {
        const remaining = this.getRemainingInvites();
        
        if (remaining <= 0) {
            throw new Error('No invites remaining');
        }
        
        // Format: GC2025-XXXXX where X is alphanumeric
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'GC2025-';
        
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Check if code already exists (unlikely but safe)
        if (this.inviteData.invitesGenerated.some(inv => inv.code === code)) {
            return this.generateInviteCode(); // Recursive retry
        }
        
        // Record the new invite
        const inviteRecord = {
            code,
            generatedAt: new Date().toISOString(),
            usedBy: null,
            usedAt: null,
            shareMethod: null
        };
        
        this.inviteData.invitesGenerated.push(inviteRecord);
        this.saveInviteData();
        
        return code;
    }

    /**
     * Get number of remaining invites
     */
    getRemainingInvites() {
        const generated = this.inviteData.invitesGenerated.length;
        return Math.max(0, this.MAX_INVITES - generated);
    }

    /**
     * Get number of used invites
     */
    getUsedInvites() {
        return this.inviteData.invitesGenerated.filter(inv => inv.usedBy).length;
    }

    /**
     * Create the invite modal UI
     */
    createInviteModal() {
        // Remove existing modal if present
        const existing = document.getElementById('inviteModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'inviteModal';
        modal.className = 'invite-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="invite-modal-overlay">
                <div class="invite-modal-content">
                    <div class="invite-modal-header">
                        <div class="invite-header-main">
                            <h2 class="invite-title">🎯 Exclusive Invites</h2>
                            <button class="invite-close" id="closeInviteModal">&times;</button>
                        </div>
                        <p class="invite-subtitle">Share access to Gamescom 2025's premier networking platform</p>
                    </div>
                    
                    <div class="invite-stats">
                        <div class="stat-card remaining">
                            <div class="stat-value" id="remainingInvites">${this.getRemainingInvites()}</div>
                            <div class="stat-label">Invites Remaining</div>
                        </div>
                        <div class="stat-card used">
                            <div class="stat-value" id="usedInvites">${this.getUsedInvites()}</div>
                            <div class="stat-label">Friends Joined</div>
                        </div>
                        <div class="stat-card network">
                            <div class="stat-value" id="networkSize">${this.getNetworkSize()}</div>
                            <div class="stat-label">Network Size</div>
                        </div>
                    </div>
                    
                    <div class="invite-actions">
                        <button class="btn btn-primary btn-lg generate-invite-btn" id="generateInviteBtn">
                            ✨ Generate New Invite Code
                        </button>
                        
                        <div class="invite-code-display" id="inviteCodeDisplay" style="display: none;">
                            <div class="code-container">
                                <div class="code-label">Your Invite Code</div>
                                <div class="code-value" id="inviteCodeValue">GC2025-XXXXX</div>
                                <button class="copy-code-btn" id="copyInviteCode">📋 Copy</button>
                            </div>
                            
                            <div class="invite-link-container">
                                <input type="text" class="invite-link-input" id="inviteLinkInput" readonly>
                                <button class="copy-link-btn" id="copyInviteLink">Copy Link</button>
                            </div>
                            
                            <div class="share-methods">
                                <button class="share-method-btn" data-method="whatsapp">
                                    <span class="method-icon">💬</span>
                                    WhatsApp
                                </button>
                                <button class="share-method-btn" data-method="linkedin">
                                    <span class="method-icon">💼</span>
                                    LinkedIn
                                </button>
                                <button class="share-method-btn" data-method="email">
                                    <span class="method-icon">📧</span>
                                    Email
                                </button>
                                <button class="share-method-btn" data-method="qr" id="showQRBtn">
                                    <span class="method-icon">📱</span>
                                    QR Code
                                </button>
                            </div>
                            
                            <div class="qr-code-container" id="qrCodeContainer" style="display: none;">
                                <div class="qr-code" id="inviteQRCode"></div>
                                <p class="qr-text">Scan to accept invite</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="invite-history">
                        <h3 class="history-title">Your Invites</h3>
                        <div class="invite-list" id="inviteList">
                            ${this.renderInviteList()}
                        </div>
                    </div>
                    
                    <div class="invite-info">
                        <div class="info-card">
                            <span class="info-icon">🔒</span>
                            <div class="info-text">
                                <strong>Quality Network</strong>
                                <p>Each member gets only 10 invites, ensuring a curated professional community</p>
                            </div>
                        </div>
                        <div class="info-card">
                            <span class="info-icon">🌟</span>
                            <div class="info-text">
                                <strong>Exclusive Access</strong>
                                <p>Invitation-only platform for serious gaming industry professionals</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Render invite list HTML
     */
    renderInviteList() {
        if (this.inviteData.invitesGenerated.length === 0) {
            return `
                <div class="empty-invites">
                    <span class="empty-icon">📨</span>
                    <p>No invites generated yet</p>
                </div>
            `;
        }
        
        return this.inviteData.invitesGenerated.map(invite => `
            <div class="invite-item ${invite.usedBy ? 'used' : 'pending'}">
                <div class="invite-code">${invite.code}</div>
                <div class="invite-status">
                    ${invite.usedBy ? 
                        `<span class="status-badge success">✅ Accepted by ${this.maskUserId(invite.usedBy)}</span>` : 
                        `<span class="status-badge pending">⏳ Pending</span>`
                    }
                </div>
                <div class="invite-date">${this.formatDate(invite.generatedAt)}</div>
                ${!invite.usedBy ? `
                    <button class="resend-btn" data-code="${invite.code}">
                        📤 Resend
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Add invite button to navigation
     */
    addInviteButtonToNav() {
        // Check if button already exists
        if (document.getElementById('navInviteBtn')) return;
        
        // Find nav actions container
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;
        
        // Create invite button with badge
        const inviteBtn = document.createElement('button');
        inviteBtn.id = 'navInviteBtn';
        inviteBtn.className = 'nav-invite-btn';
        inviteBtn.innerHTML = `
            <span class="invite-icon">🎯</span>
            <span class="invite-text">Invites</span>
            <span class="invite-badge" id="inviteBadge">${this.getRemainingInvites()}</span>
        `;
        
        // Insert before theme toggle
        const themeToggle = navActions.querySelector('#themeToggle');
        if (themeToggle) {
            navActions.insertBefore(inviteBtn, themeToggle);
        } else {
            navActions.appendChild(inviteBtn);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Nav invite button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#navInviteBtn')) {
                this.showInviteModal();
            }
        });
        
        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeInviteModal' || 
                e.target.classList.contains('invite-modal-overlay')) {
                this.hideInviteModal();
            }
        });
        
        // Generate invite
        document.addEventListener('click', (e) => {
            if (e.target.closest('#generateInviteBtn')) {
                this.handleGenerateInvite();
            }
        });
        
        // Copy code
        document.addEventListener('click', (e) => {
            if (e.target.id === 'copyInviteCode') {
                const code = document.getElementById('inviteCodeValue').textContent;
                this.copyToClipboard(code);
            }
        });
        
        // Copy link
        document.addEventListener('click', (e) => {
            if (e.target.id === 'copyInviteLink') {
                const link = document.getElementById('inviteLinkInput').value;
                this.copyToClipboard(link);
            }
        });
        
        // Share methods
        document.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('.share-method-btn');
            if (shareBtn) {
                const method = shareBtn.dataset.method;
                this.handleShareInvite(method);
            }
        });
        
        // Resend invite
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('resend-btn')) {
                const code = e.target.dataset.code;
                this.resendInvite(code);
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentInviteModal) {
                this.hideInviteModal();
            }
        });
    }

    /**
     * Show invite modal
     */
    showInviteModal() {
        const modal = document.getElementById('inviteModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            this.currentInviteModal = modal;
            this.updateModalStats();
        }
    }

    /**
     * Hide invite modal
     */
    hideInviteModal() {
        const modal = document.getElementById('inviteModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            this.currentInviteModal = null;
            
            // Hide code display
            const codeDisplay = document.getElementById('inviteCodeDisplay');
            if (codeDisplay) codeDisplay.style.display = 'none';
        }
    }

    /**
     * Update modal statistics
     */
    updateModalStats() {
        const remaining = document.getElementById('remainingInvites');
        const used = document.getElementById('usedInvites');
        const network = document.getElementById('networkSize');
        const badge = document.getElementById('inviteBadge');
        
        if (remaining) remaining.textContent = this.getRemainingInvites();
        if (used) used.textContent = this.getUsedInvites();
        if (network) network.textContent = this.getNetworkSize();
        if (badge) badge.textContent = this.getRemainingInvites();
        
        // Update invite list
        const list = document.getElementById('inviteList');
        if (list) list.innerHTML = this.renderInviteList();
        
        // Disable generate button if no invites left
        const generateBtn = document.getElementById('generateInviteBtn');
        if (generateBtn) {
            if (this.getRemainingInvites() <= 0) {
                generateBtn.disabled = true;
                generateBtn.textContent = '🚫 No Invites Remaining';
            }
        }
    }

    /**
     * Handle generate invite button
     */
    async handleGenerateInvite() {
        try {
            const code = this.generateInviteCode();
            const link = this.buildInviteLink(code);
            
            // Display the code
            const codeDisplay = document.getElementById('inviteCodeDisplay');
            const codeValue = document.getElementById('inviteCodeValue');
            const linkInput = document.getElementById('inviteLinkInput');
            
            if (codeDisplay && codeValue && linkInput) {
                codeValue.textContent = code;
                linkInput.value = link;
                codeDisplay.style.display = 'block';
                
                // Generate QR code
                this.generateQRCode(link);
            }
            
            // Update stats
            this.updateModalStats();
            
            // Show success message
            this.showToast('✨ New invite code generated!', 'success');
            
            // Track generation
            this.trackInviteGeneration(code);
            
        } catch (error) {
            console.error('Failed to generate invite:', error);
            this.showToast('❌ ' + error.message, 'error');
        }
    }

    /**
     * Build invite link
     */
    buildInviteLink(code) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/invite/${code}`;
    }

    /**
     * Handle sharing invite
     */
    handleShareInvite(method) {
        const code = document.getElementById('inviteCodeValue')?.textContent;
        const link = document.getElementById('inviteLinkInput')?.value;
        
        if (!code || !link) return;
        
        const message = this.buildInviteMessage(code);
        
        switch (method) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(message + '\n\n' + link)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, '_blank');
                break;
            case 'email':
                const subject = 'Exclusive Invite to Gamescom 2025 Professional Network';
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + '\n\n' + link)}`);
                break;
            case 'qr':
                const qrContainer = document.getElementById('qrCodeContainer');
                if (qrContainer) {
                    qrContainer.style.display = qrContainer.style.display === 'none' ? 'block' : 'none';
                }
                break;
        }
        
        // Update share method for the invite
        const invite = this.inviteData.invitesGenerated.find(i => i.code === code);
        if (invite && !invite.shareMethod) {
            invite.shareMethod = method;
            this.saveInviteData();
        }
    }

    /**
     * Build invite message
     */
    buildInviteMessage(code) {
        const persona = localStorage.getItem('gamescom_user_persona') || 'professional';
        const personaText = {
            developer: 'fellow game developer',
            publishing: 'publishing professional',
            investor: 'investment partner',
            service: 'industry colleague',
            professional: 'gaming professional'
        };
        
        return `🎮 You're invited to join Gamescom 2025's exclusive professional network!

As a ${personaText[persona] || 'gaming professional'}, I'm sharing one of my limited invites with you.

🎯 Invite Code: ${code}

This invitation-only platform connects serious industry professionals for:
• Curated networking events
• VIP party access
• Strategic meetings
• Career opportunities

Each member gets only 10 invites, ensuring a quality network.

Join the elite gaming industry community at Gamescom 2025!`;
    }

    /**
     * Resend an existing invite
     */
    resendInvite(code) {
        const link = this.buildInviteLink(code);
        
        // Show code display with this code
        const codeDisplay = document.getElementById('inviteCodeDisplay');
        const codeValue = document.getElementById('inviteCodeValue');
        const linkInput = document.getElementById('inviteLinkInput');
        
        if (codeDisplay && codeValue && linkInput) {
            codeValue.textContent = code;
            linkInput.value = link;
            codeDisplay.style.display = 'block';
            
            // Generate QR code
            this.generateQRCode(link);
            
            // Scroll to display
            codeDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Handle deep link for invite codes
     */
    async handleInviteDeepLink() {
        // Check URL patterns: /invite/CODE or ?invite=CODE
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        let inviteCode = null;
        
        // Check path pattern
        if (path.startsWith('/invite/')) {
            inviteCode = path.replace('/invite/', '');
        }
        
        // Check query parameter
        if (!inviteCode && params.has('invite')) {
            inviteCode = params.get('invite');
        }
        
        if (inviteCode) {
            console.log(`🎯 Processing invite code: ${inviteCode}`);
            await this.acceptInvite(inviteCode);
        }
    }

    /**
     * Accept an invite code
     */
    async acceptInvite(code) {
        try {
            // Validate code format
            if (!code.match(/^GC2025-[A-Z0-9]{5}$/)) {
                throw new Error('Invalid invite code format');
            }
            
            // Check if user already has access
            const hasAccess = localStorage.getItem('gamescom_has_access');
            if (hasAccess) {
                this.showToast('✅ You already have access!', 'info');
                this.redirectToOnboarding();
                return;
            }
            
            // TODO: Validate with backend when available
            // For now, store locally
            const acceptData = {
                inviteCode: code,
                acceptedAt: new Date().toISOString(),
                acceptedBy: this.getUserId()
            };
            
            // Store acceptance
            localStorage.setItem('gamescom_invite_accepted', JSON.stringify(acceptData));
            localStorage.setItem('gamescom_has_access', 'true');
            this.inviteData.invitedBy = code;
            this.saveInviteData();
            
            // Show success and redirect
            this.showWelcomeModal(code);
            
            // Track acceptance
            this.trackInviteAcceptance(code);
            
        } catch (error) {
            console.error('Failed to accept invite:', error);
            this.showToast('❌ ' + error.message, 'error');
            
            // Redirect to request access page
            setTimeout(() => {
                window.location.href = '/request-access';
            }, 2000);
        }
    }

    /**
     * Show welcome modal after accepting invite
     */
    showWelcomeModal(code) {
        const modal = document.createElement('div');
        modal.className = 'welcome-modal-overlay';
        modal.innerHTML = `
            <div class="welcome-modal-content">
                <div class="welcome-animation">
                    <div class="confetti">🎉</div>
                    <div class="checkmark">✅</div>
                </div>
                <h1 class="welcome-title">Welcome to the Network!</h1>
                <p class="welcome-subtitle">You've been invited to join Gamescom 2025's exclusive professional community</p>
                
                <div class="invite-accepted-info">
                    <div class="accepted-code">
                        <span class="code-label">Invite Code Accepted:</span>
                        <span class="code-value">${code}</span>
                    </div>
                </div>
                
                <p class="welcome-message">
                    You now have access to curated networking events, VIP parties, and strategic meetings.
                    Plus, you can invite up to 10 trusted colleagues to grow your professional network.
                </p>
                
                <button class="btn btn-primary btn-lg" id="continueToOnboarding">
                    Continue to Setup →
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add click handler
        document.getElementById('continueToOnboarding').addEventListener('click', () => {
            modal.remove();
            this.redirectToOnboarding();
        });
    }

    /**
     * Redirect to onboarding
     */
    redirectToOnboarding() {
        // Clear the invite code from URL
        window.history.replaceState({}, document.title, '/');
        
        // Navigate to onboarding
        if (window.navigationManager) {
            window.navigationManager.navigateToPage('onboarding');
        } else {
            window.location.href = '/#onboarding';
        }
    }

    /**
     * Generate QR code for invite
     */
    generateQRCode(link) {
        const container = document.getElementById('inviteQRCode');
        if (!container) return;
        
        // Clear previous QR code
        container.innerHTML = '';
        
        // Use QR Server API as fallback
        const qrImg = document.createElement('img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
        qrImg.alt = 'Invite QR Code';
        container.appendChild(qrImg);
    }

    /**
     * Initialize QR library
     */
    initQRLibrary() {
        // QR library will be loaded on demand if needed
        // Using QR Server API as a simple solution
    }

    /**
     * Utility methods
     */
    getUserId() {
        let userId = localStorage.getItem('gamescom_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('gamescom_user_id', userId);
        }
        return userId;
    }

    getNetworkSize() {
        // Calculate network size based on used invites and connections
        const directInvites = this.getUsedInvites();
        const estimatedNetwork = directInvites * 3; // Assume each person brings 3 connections
        return Math.min(estimatedNetwork, 100); // Cap at 100 for display
    }

    maskUserId(userId) {
        // Mask user ID for privacy
        if (!userId) return 'Someone';
        return userId.substring(0, 8) + '***';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} min${mins !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
        
        // Default to date
        return date.toLocaleDateString();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('📋 Copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('❌ Failed to copy', 'error');
        });
    }

    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.invite-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `invite-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Tracking methods
     */
    trackInviteGeneration(code) {
        console.log(`📊 Invite generated: ${code}`);
        
        // Track with analytics if available
        if (window.analytics) {
            window.analytics.track('invite_generated', {
                code,
                remaining: this.getRemainingInvites(),
                total_generated: this.inviteData.invitesGenerated.length
            });
        }
    }

    trackInviteAcceptance(code) {
        console.log(`✅ Invite accepted: ${code}`);
        
        // Track with analytics if available
        if (window.analytics) {
            window.analytics.track('invite_accepted', {
                code,
                user_id: this.getUserId()
            });
        }
    }

    /**
     * API methods (ready for backend integration)
     */
    async validateInviteWithBackend(code) {
        // TODO: Implement when backend is ready
        // POST /api/invite/validate
        return true;
    }

    async recordInviteUsage(code, userId) {
        // TODO: Implement when backend is ready
        // POST /api/invite/use
        return true;
    }

    async syncInviteData() {
        // TODO: Implement when backend is ready
        // POST /api/invite/sync
        return true;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.inviteManager = new InviteManager();
});

// Export for external use
window.InviteManager = InviteManager;