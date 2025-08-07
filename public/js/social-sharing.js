/**
 * 🔗 REAL SOCIAL SHARING SYSTEM
 * Fixes broken native iOS sharing with custom professional modals
 * Includes viral referral code generation and tracking
 */

class SocialSharingManager {
    constructor() {
        this.isInitialized = false;
        this.referralSystem = null;
        this.currentEvent = null;
        this.init();
    }

    async init() {
        try {
            this.createSharingModal();
            this.setupEventListeners();
            
            // Wait for referral system to be available
            if (window.referralSystem) {
                this.referralSystem = window.referralSystem;
            } else {
                // Wait for it to load
                document.addEventListener('DOMContentLoaded', () => {
                    this.referralSystem = window.referralSystem;
                });
            }
            
            this.isInitialized = true;
            console.log('✅ Social Sharing Manager initialized');
        } catch (error) {
            console.error('❌ Social Sharing initialization failed:', error);
        }
    }

    /**
     * Create the custom sharing modal
     */
    createSharingModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('socialSharingModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'socialSharingModal';
        modal.className = 'social-modal';
        modal.innerHTML = `
            <div class="social-modal-overlay">
                <div class="social-modal-content">
                    <div class="social-modal-header">
                        <h3 class="social-modal-title">Share Event</h3>
                        <button class="social-modal-close" id="closeSocialModal">&times;</button>
                    </div>
                    
                    <div class="event-preview" id="eventPreview">
                        <!-- Event details will be populated here -->
                    </div>
                    
                    <div class="sharing-options">
                        <div class="sharing-section">
                            <h4>Share on Social Media</h4>
                            <div class="social-buttons">
                                <button class="social-btn whatsapp-btn" data-platform="whatsapp">
                                    <span class="social-icon">📱</span>
                                    <div class="social-text">
                                        <span class="social-name">WhatsApp</span>
                                        <span class="social-desc">Share with contacts</span>
                                    </div>
                                </button>
                                
                                <button class="social-btn linkedin-btn" data-platform="linkedin">
                                    <span class="social-icon">💼</span>
                                    <div class="social-text">
                                        <span class="social-name">LinkedIn</span>
                                        <span class="social-desc">Professional network</span>
                                    </div>
                                </button>
                                
                                <button class="social-btn twitter-btn" data-platform="twitter">
                                    <span class="social-icon">🐦</span>
                                    <div class="social-text">
                                        <span class="social-name">Twitter</span>
                                        <span class="social-desc">Share publicly</span>
                                    </div>
                                </button>
                                
                                <button class="social-btn telegram-btn" data-platform="telegram">
                                    <span class="social-icon">✈️</span>
                                    <div class="social-text">
                                        <span class="social-name">Telegram</span>
                                        <span class="social-desc">Instant messaging</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        <div class="sharing-section">
                            <h4>Direct Sharing</h4>
                            <div class="direct-actions">
                                <button class="action-btn copy-link-btn" id="copyLinkBtn">
                                    <span class="action-icon">📋</span>
                                    <span class="action-text">Copy Link</span>
                                </button>
                                
                                <button class="action-btn qr-code-btn" id="qrCodeBtn">
                                    <span class="action-icon">📱</span>
                                    <span class="action-text">QR Code</span>
                                </button>
                                
                                <button class="action-btn email-btn" id="emailBtn">
                                    <span class="action-icon">📧</span>
                                    <span class="action-text">Email</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="viral-info">
                        <div class="viral-badge">
                            <span class="viral-icon">🎯</span>
                            <span class="viral-text">Earn referral points when friends attend!</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeSocialModal' || e.target.classList.contains('social-modal-overlay')) {
                this.closeModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('socialSharingModal').style.display !== 'none') {
                this.closeModal();
            }
        });

        // Social platform buttons
        document.addEventListener('click', (e) => {
            const socialBtn = e.target.closest('.social-btn');
            if (socialBtn) {
                const platform = socialBtn.dataset.platform;
                this.shareToSocial(platform);
            }
        });

        // Direct action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('#copyLinkBtn')) {
                this.copyLink();
            } else if (e.target.closest('#qrCodeBtn')) {
                this.showQRCode();
            } else if (e.target.closest('#emailBtn')) {
                this.shareViaEmail();
            }
        });

        // Listen for share button clicks throughout the app
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-btn, .social-share-btn, [data-action="share"]')) {
                e.preventDefault();
                const eventId = e.target.closest('[data-event-id]')?.dataset.eventId;
                if (eventId) {
                    this.showShareModal(eventId);
                }
            }
        });
    }

    /**
     * Show the sharing modal for a specific event
     */
    async showShareModal(eventIdOrEvent) {
        try {
            // Handle both event ID and event object
            let event;
            if (typeof eventIdOrEvent === 'string') {
                event = this.findEventById(eventIdOrEvent);
            } else {
                event = eventIdOrEvent;
            }

            if (!event) {
                console.error('Event not found for sharing');
                return;
            }

            this.currentEvent = event;
            this.populateEventPreview(event);
            this.showModal();
            
        } catch (error) {
            console.error('Failed to show share modal:', error);
        }
    }

    /**
     * Find event by ID from available sources
     */
    findEventById(eventId) {
        // Try to get event from SearchManager
        if (window.searchManager && window.searchManager.events) {
            return window.searchManager.events.find(e => e.id === eventId);
        }
        
        // Try to get from main app
        if (window.app && window.app.events) {
            return window.app.events.find(e => e.id === eventId);
        }

        // Try to get from global events
        if (window.events) {
            return window.events.find(e => e.id === eventId);
        }

        return null;
    }

    /**
     * Populate event preview in modal
     */
    populateEventPreview(event) {
        const preview = document.getElementById('eventPreview');
        const eventName = event.name || event['Event Name'] || 'Unnamed Event';
        const eventDate = event.date || event['Date'] || '';
        const eventTime = event.startTime || event['Start Time'] || '';
        const eventVenue = event.venue || event['Address'] || '';
        const eventCategory = event.category || event['Category'] || '';

        preview.innerHTML = `
            <div class="event-card-preview">
                <div class="event-details">
                    <h4 class="event-name">${this.escapeHtml(eventName)}</h4>
                    <div class="event-meta">
                        ${eventDate ? `<span class="meta-item">📅 ${this.formatDate(eventDate)}</span>` : ''}
                        ${eventTime ? `<span class="meta-item">🕐 ${eventTime}</span>` : ''}
                        ${eventVenue ? `<span class="meta-item">📍 ${this.escapeHtml(eventVenue)}</span>` : ''}
                        ${eventCategory ? `<span class="meta-item">🏷️ ${eventCategory}</span>` : ''}
                    </div>
                </div>
                <div class="event-badge">
                    ${event.isUGC ? '<span class="ugc-badge">👥 Community</span>' : '<span class="official-badge">✅ Official</span>'}
                </div>
            </div>
        `;
    }

    /**
     * Share to specific social platform
     */
    async shareToSocial(platform) {
        if (!this.currentEvent) return;

        try {
            // Generate referral code
            const referralCode = await this.generateReferralCode(platform);
            const shareUrl = this.buildShareUrl(referralCode);
            const shareText = this.buildShareText(platform);

            // Track the share action
            this.trackShare(platform, referralCode);

            // Platform-specific sharing
            switch (platform) {
                case 'whatsapp':
                    this.shareToWhatsApp(shareText, shareUrl);
                    break;
                case 'linkedin':
                    this.shareToLinkedIn(shareText, shareUrl);
                    break;
                case 'twitter':
                    this.shareToTwitter(shareText, shareUrl);
                    break;
                case 'telegram':
                    this.shareToTelegram(shareText, shareUrl);
                    break;
                default:
                    console.warn('Unknown platform:', platform);
            }

            // Close modal after successful share
            setTimeout(() => this.closeModal(), 1000);

        } catch (error) {
            console.error('Share failed:', error);
            this.showNotification('❌ Share failed. Please try again.', 'error');
        }
    }

    /**
     * Generate referral code for tracking
     */
    async generateReferralCode(platform) {
        if (!this.referralSystem) {
            // Generate simple code without referral system
            return `gc25_${this.currentEvent.id}_${platform}_${Date.now()}`;
        }

        try {
            return await this.referralSystem.generateReferralCode(this.currentEvent.id, platform);
        } catch (error) {
            console.error('Referral code generation failed:', error);
            return `gc25_${this.currentEvent.id}_${platform}_${Date.now()}`;
        }
    }

    /**
     * Build shareable URL with referral code
     */
    buildShareUrl(referralCode) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/?event=${this.currentEvent.id}&ref=${referralCode}`;
    }

    /**
     * Build share text for different platforms
     */
    buildShareText(platform) {
        const eventName = this.currentEvent.name || this.currentEvent['Event Name'];
        const eventDate = this.currentEvent.date || this.currentEvent['Date'];
        const eventVenue = this.currentEvent.venue || this.currentEvent['Address'];

        const baseText = `🎮 ${eventName}\n📅 ${this.formatDate(eventDate)}\n📍 ${eventVenue}\n\nJoin me at Gamescom 2025!`;

        switch (platform) {
            case 'whatsapp':
                return `${baseText}\n\n*Professional Gaming Industry Networking*`;
            case 'linkedin':
                return `${baseText}\n\n#Gamescom2025 #GamingIndustry #NetworkingEvent`;
            case 'twitter':
                return `${baseText}\n\n#Gamescom2025 #Gaming`;
            case 'telegram':
                return baseText;
            default:
                return baseText;
        }
    }

    /**
     * Platform-specific sharing methods
     */
    shareToWhatsApp(text, url) {
        const message = encodeURIComponent(`${text}\n\n${url}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    shareToLinkedIn(text, url) {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        window.open(linkedInUrl, '_blank');
    }

    shareToTwitter(text, url) {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(tweetUrl, '_blank');
    }

    shareToTelegram(text, url) {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
    }

    /**
     * Copy link to clipboard
     */
    async copyLink() {
        try {
            const referralCode = await this.generateReferralCode('direct');
            const shareUrl = this.buildShareUrl(referralCode);
            
            await navigator.clipboard.writeText(shareUrl);
            this.showNotification('✅ Link copied to clipboard!', 'success');
            this.trackShare('copy', referralCode);
            
        } catch (error) {
            console.error('Copy failed:', error);
            this.showNotification('❌ Failed to copy link', 'error');
        }
    }

    /**
     * Show QR code for sharing
     */
    async showQRCode() {
        try {
            const referralCode = await this.generateReferralCode('qr');
            const shareUrl = this.buildShareUrl(referralCode);
            
            // Simple QR code generation using QR Server API
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;
            
            const qrModal = document.createElement('div');
            qrModal.className = 'qr-modal-overlay';
            qrModal.innerHTML = `
                <div class="qr-modal-content">
                    <div class="qr-header">
                        <h3>Scan to Share</h3>
                        <button class="qr-close">&times;</button>
                    </div>
                    <div class="qr-body">
                        <img src="${qrUrl}" alt="QR Code" class="qr-image" />
                        <p class="qr-text">Scan this QR code to share the event</p>
                    </div>
                </div>
            `;

            qrModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('qr-modal-overlay') || e.target.classList.contains('qr-close')) {
                    qrModal.remove();
                }
            });

            document.body.appendChild(qrModal);
            this.trackShare('qr', referralCode);
            
        } catch (error) {
            console.error('QR code failed:', error);
            this.showNotification('❌ Failed to generate QR code', 'error');
        }
    }

    /**
     * Share via email
     */
    async shareViaEmail() {
        try {
            const referralCode = await this.generateReferralCode('email');
            const shareUrl = this.buildShareUrl(referralCode);
            const shareText = this.buildShareText('email');
            
            const subject = encodeURIComponent(`Join me at ${this.currentEvent.name || this.currentEvent['Event Name']} - Gamescom 2025`);
            const body = encodeURIComponent(`${shareText}\n\nEvent Link: ${shareUrl}`);
            
            window.open(`mailto:?subject=${subject}&body=${body}`);
            this.trackShare('email', referralCode);
            
        } catch (error) {
            console.error('Email share failed:', error);
        }
    }

    /**
     * Track share action for analytics
     */
    async trackShare(platform, referralCode) {
        try {
            // Track in referral system if available
            if (this.referralSystem) {
                await this.referralSystem.trackReferralGeneration(referralCode, this.currentEvent.id, platform, this.getUserId());
            }

            // Track in analytics if available
            if (window.analytics) {
                window.analytics.track('event_shared', {
                    event_id: this.currentEvent.id,
                    platform,
                    referral_code: referralCode
                });
            }

            console.log(`📤 Shared ${this.currentEvent.name} via ${platform}`);
            
        } catch (error) {
            console.error('Share tracking failed:', error);
        }
    }

    /**
     * Modal management
     */
    showModal() {
        const modal = document.getElementById('socialSharingModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('socialSharingModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.currentEvent = null;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.share-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `share-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Utility methods
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            return dateString;
        }
    }

    getUserId() {
        // Get or create user ID for referral tracking
        let userId = localStorage.getItem('gamescom_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('gamescom_user_id', userId);
        }
        return userId;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.socialSharingManager = new SocialSharingManager();
});

// Expose globally for external access
window.SocialSharingManager = SocialSharingManager;