/**
 * 🎮 GAMESCOM 2025 REFERRAL SYSTEM
 * World-class viral growth through trackable sharing links
 */

class ReferralSystem {
    constructor() {
        this.baseUrl = window.location.origin;
        this.apiBase = window.CONFIG?.apiBase || '';
        this.currentUser = null;
        this.referralStats = {
            totalShares: 0,
            clicks: 0,
            conversions: 0,
            topPlatform: null,
            topEvent: null
        };
        
        this.init();
    }
    
    init() {
        // Check if user arrived via referral link
        this.handleInboundReferral();
        
        // Initialize user session
        this.initUserSession();
        
        console.log('🎯 Referral System initialized');
    }
    
    /**
     * 🔄 STEP 1: Generate Unique Referral Code
     */
    async generateReferralCode(eventId, platform = 'direct') {
        try {
            const userId = this.getCurrentUserId();
            const timestamp = Date.now();
            
            // Create deterministic but unique referral code
            const eventSlug = eventId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const userHash = this.hashUserId(userId);
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            
            const referralCode = `gc25_${eventSlug}_${userHash}_${randomSuffix}`;
            
            // Store referral code with metadata
            await this.trackReferralGeneration(referralCode, eventId, platform, userId);
            
            console.log(`🎯 Generated referral code: ${referralCode}`);
            return referralCode;
            
        } catch (error) {
            console.error('Failed to generate referral code:', error);
            return null;
        }
    }
    
    /**
     * 📊 Track referral code generation
     */
    async trackReferralGeneration(referralCode, eventId, platform, userId) {
        const referralData = {
            referralCode,
            originalSharer: userId,
            eventId,
            platform,
            shareTimestamp: Date.now(),
            status: 'generated',
            
            // Professional context
            sharerProfile: await this.getUserProfile(userId),
            eventContext: await this.getEventContext(eventId)
        };
        
        // Store locally for quick access
        const localReferrals = this.getLocalReferrals();
        localReferrals[referralCode] = referralData;
        localStorage.setItem('gamescom_my_referrals', JSON.stringify(localReferrals));
        
        // Track in analytics
        this.trackAnalytics('referral_generated', {
            referralCode,
            eventId,
            platform,
            sharerType: referralData.sharerProfile?.type || 'anonymous'
        });
        
        // Send to backend for persistence
        await this.sendToBackend('/api/referral/generate', referralData);
    }
    
    /**
     * 🔗 STEP 2: Create Trackable Sharing URLs
     */
    createTrackableURL(eventId, referralCode) {
        const eventSlug = this.createEventSlug(eventId);
        return `${this.baseUrl}/?event=${eventId}&ref=${referralCode}`;
    }
    
    createEventSlug(eventId) {
        // Create SEO-friendly event slug
        const event = window.app?.events?.find(e => e.id === eventId);
        if (event && event.name) {
            return event.name
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);
        }
        return eventId;
    }
    
    /**
     * 📱 STEP 3: Enhanced Social Sharing with Referral Tracking
     */
    async generateShareContent(eventId, platform) {
        const event = window.app?.events?.find(e => e.id === eventId);
        if (!event) return null;
        
        // Generate unique referral code for this share
        const referralCode = await this.generateReferralCode(eventId, platform);
        if (!referralCode) return null;
        
        // Create trackable URL
        const trackableURL = this.createTrackableURL(eventId, referralCode);
        
        // Platform-specific content generation
        const shareContent = this.createPlatformContent(event, trackableURL, platform);
        
        // Track the share action
        await this.trackShare(referralCode, platform, eventId);
        
        return { ...shareContent, referralCode, trackableURL };
    }
    
    createPlatformContent(event, url, platform) {
        const eventDate = this.formatDate(event.date);
        const eventTime = event.startTime || 'TBA';
        const venue = event.venue || 'TBA';
        
        const baseContent = {
            title: `🎮 ${event.name} - Gamescom 2025`,
            url: url
        };
        
        switch (platform) {
            case 'whatsapp':
                return {
                    ...baseContent,
                    message: `🎮 *Gamescom 2025 Party Alert!*\n🎉 ${event.name}\n📅 ${eventDate} at ${eventTime}\n📍 ${venue}\n\nJoin me at this amazing gaming event! 🚀\n\n${url}\n\n#Gamescom2025 #Gaming`
                };
                
            case 'twitter':
                return {
                    ...baseContent,
                    message: `🎮 Excited for "${event.name}" at #Gamescom2025!\n\n📅 ${eventDate} • 🕐 ${eventTime}\n📍 ${venue}\n\nWho's joining me? 🚀\n\n${url} #Gaming #Networking`
                };
                
            case 'linkedin':
                return {
                    ...baseContent,
                    message: `🎮 Professional Gaming Network Event: ${event.name}\n\nJoin fellow gaming industry professionals at this exclusive Gamescom 2025 networking opportunity.\n\n📅 ${eventDate} at ${eventTime}\n📍 ${venue}\n\nPerfect for developers, publishers, and gaming entrepreneurs looking to connect.\n\n${url}`
                };
                
            case 'email':
                return {
                    ...baseContent,
                    subject: `🎮 You're Invited: ${event.name} - Gamescom 2025`,
                    body: `Hi there!\n\nI thought you'd be interested in this gaming industry event at Gamescom 2025:\n\n🎉 ${event.name}\n📅 ${eventDate} at ${eventTime}\n📍 ${venue}\n\n${event.description || 'Join me and other gaming professionals for networking and great conversations!'}\n\nRSVP here: ${url}\n\nSee you there!\n\n#Gamescom2025 #Gaming #Networking`
                };
                
            default:
                return {
                    ...baseContent,
                    message: `🎮 Join me at "${event.name}" - ${eventDate} at ${eventTime} in ${venue}! ${url}`
                };
        }
    }
    
    /**
     * 📊 Track share actions
     */
    async trackShare(referralCode, platform, eventId) {
        const shareData = {
            referralCode,
            action: 'share',
            platform,
            eventId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            deviceType: this.getDeviceType()
        };
        
        // Update local referral stats
        this.updateLocalStats('shares', platform);
        
        // Track in analytics
        this.trackAnalytics('event_shared_with_referral', shareData);
        
        // Send to backend
        await this.sendToBackend('/api/referral/track', shareData);
        
        console.log(`📤 Tracked share: ${platform} for ${eventId}`);
    }
    
    /**
     * 🎯 STEP 4: Handle Inbound Referral Clicks
     */
    handleInboundReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        const eventId = urlParams.get('event');
        
        if (referralCode && eventId) {
            this.processReferralClick(referralCode, eventId);
        }
    }
    
    async processReferralClick(referralCode, eventId) {
        console.log(`🎯 Processing referral click: ${referralCode}`);
        
        // Store referral attribution for later conversion tracking
        const referralAttribution = {
            referralCode,
            eventId,
            clickTimestamp: Date.now(),
            originalURL: window.location.href,
            userAgent: navigator.userAgent
        };
        
        localStorage.setItem('gamescom_referral_attribution', JSON.stringify(referralAttribution));
        localStorage.setItem('gamescom_referral_timestamp', Date.now().toString());
        
        // Track the click
        await this.trackReferralClick(referralCode, eventId);
        
        // Show welcome notification
        this.showReferralWelcome(referralCode, eventId);
        
        // Clean the URL for better UX
        this.cleanURL();
        
        // Focus on the referred event
        this.highlightReferredEvent(eventId);
    }
    
    async trackReferralClick(referralCode, eventId) {
        const clickData = {
            referralCode,
            action: 'click',
            eventId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            deviceType: this.getDeviceType(),
            referrer: document.referrer
        };
        
        // Track in analytics
        this.trackAnalytics('referral_click', clickData);
        
        // Send to backend
        await this.sendToBackend('/api/referral/track', clickData);
        
        console.log(`👆 Tracked referral click: ${referralCode}`);
    }
    
    showReferralWelcome(referralCode, eventId) {
        const event = window.app?.events?.find(e => e.id === eventId);
        const eventName = event?.name || 'this event';
        
        const welcomeHTML = `
            <div class="referral-welcome">
                <div class="referral-welcome-content">
                    <div class="referral-icon">🎉</div>
                    <h3>You were invited by a friend!</h3>
                    <p>Welcome to the Gamescom 2025 community! Your friend thought you'd love <strong>${eventName}</strong>.</p>
                    <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">
                        Awesome, thanks!
                    </button>
                </div>
            </div>
        `;
        
        const welcomeEl = document.createElement('div');
        welcomeEl.innerHTML = welcomeHTML;
        document.body.appendChild(welcomeEl);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (welcomeEl.parentNode) {
                welcomeEl.remove();
            }
        }, 8000);
    }
    
    highlightReferredEvent(eventId) {
        // Scroll to and highlight the referred event
        setTimeout(() => {
            const eventCard = document.querySelector(`[data-event-id="${eventId}"]`);
            if (eventCard) {
                eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                eventCard.style.border = '3px solid var(--slack-color-primary)';
                eventCard.style.background = 'linear-gradient(135deg, var(--slack-color-primary), #36B37E)';
                eventCard.style.color = 'white';
                
                // Remove highlight after 5 seconds
                setTimeout(() => {
                    eventCard.style.border = '';
                    eventCard.style.background = '';
                    eventCard.style.color = '';
                }, 5000);
            }
        }, 1000);
    }
    
    cleanURL() {
        const cleanURL = window.location.pathname + window.location.hash;
        history.replaceState(null, '', cleanURL);
    }
    
    /**
     * 🏆 STEP 5: Conversion Tracking
     */
    async trackConversion(conversionType, additionalData = {}) {
        const referralAttribution = this.getReferralAttribution();
        
        if (!referralAttribution) {
            console.log('No referral attribution found');
            return;
        }
        
        const conversionData = {
            referralCode: referralAttribution.referralCode,
            action: 'conversion',
            conversionType, // 'signup', 'event_creation', 'share', 'calendar_add'
            timestamp: Date.now(),
            originalClickTimestamp: referralAttribution.clickTimestamp,
            timeTaken: Date.now() - referralAttribution.clickTimestamp,
            ...additionalData
        };
        
        // Track in analytics
        this.trackAnalytics('referral_conversion', conversionData);
        
        // Send to backend
        await this.sendToBackend('/api/referral/track', conversionData);
        
        console.log(`🏆 Tracked conversion: ${conversionType} for ${referralAttribution.referralCode}`);
        
        // Clear the attribution (one conversion per visit)
        localStorage.removeItem('gamescom_referral_attribution');
    }
    
    /**
     * 📈 Referral Analytics and Stats
     */
    async getUserReferralStats(userId = null) {
        userId = userId || this.getCurrentUserId();
        
        try {
            const response = await fetch(`${this.apiBase}/api/referral/stats/${userId}`);
            const stats = await response.json();
            
            this.referralStats = stats;
            return stats;
        } catch (error) {
            console.error('Failed to fetch referral stats:', error);
            return this.getLocalReferralStats();
        }
    }
    
    getLocalReferralStats() {
        const localStats = localStorage.getItem('gamescom_referral_stats');
        return localStats ? JSON.parse(localStats) : this.referralStats;
    }
    
    updateLocalStats(action, platform = null) {
        const stats = this.getLocalReferralStats();
        
        switch (action) {
            case 'shares':
                stats.totalShares++;
                if (platform) {
                    stats.platformShares = stats.platformShares || {};
                    stats.platformShares[platform] = (stats.platformShares[platform] || 0) + 1;
                    
                    // Update top platform
                    if (!stats.topPlatform || stats.platformShares[platform] > stats.platformShares[stats.topPlatform]) {
                        stats.topPlatform = platform;
                    }
                }
                break;
            case 'clicks':
                stats.clicks++;
                break;
            case 'conversions':
                stats.conversions++;
                break;
        }
        
        stats.conversionRate = stats.clicks > 0 ? ((stats.conversions / stats.clicks) * 100).toFixed(1) + '%' : '0%';
        
        localStorage.setItem('gamescom_referral_stats', JSON.stringify(stats));
        this.referralStats = stats;
    }
    
    /**
     * 🛠️ UTILITY METHODS
     */
    getCurrentUserId() {
        // Generate or retrieve persistent user ID
        let userId = localStorage.getItem('gamescom_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('gamescom_user_id', userId);
        }
        return userId;
    }
    
    hashUserId(userId) {
        // Simple hash for privacy (first 6 chars of user ID)
        return userId.replace('user_', '').substring(0, 6);
    }
    
    getReferralAttribution() {
        const attribution = localStorage.getItem('gamescom_referral_attribution');
        return attribution ? JSON.parse(attribution) : null;
    }
    
    getLocalReferrals() {
        const referrals = localStorage.getItem('gamescom_my_referrals');
        return referrals ? JSON.parse(referrals) : {};
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric'
        });
    }
    
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
            return 'mobile';
        } else if (/tablet|ipad/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    
    async getUserProfile(userId) {
        // Mock professional profile - in real implementation, fetch from auth system
        return {
            id: userId,
            type: 'gaming_professional', // 'developer', 'publisher', 'streamer', etc.
            verified: true,
            company: 'Gaming Industry Pro'
        };
    }
    
    async getEventContext(eventId) {
        const event = window.app?.events?.find(e => e.id === eventId);
        return {
            id: eventId,
            name: event?.name || 'Unknown Event',
            category: event?.category || 'networking',
            isUGC: event?.source === 'ugc'
        };
    }
    
    trackAnalytics(eventName, data) {
        // Integrate with existing analytics system
        if (window.analytics && typeof window.analytics.trackEvent === 'function') {
            window.analytics.trackEvent(eventName, data);
        }
        
        console.log(`📊 Analytics: ${eventName}`, data);
    }
    
    async sendToBackend(endpoint, data) {
        try {
            const response = await fetch(this.apiBase + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.warn(`Backend call failed: ${endpoint}`, response.status);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Backend error for ${endpoint}:`, error);
            return null;
        }
    }
}

// Initialize global referral system
window.referralSystem = new ReferralSystem();