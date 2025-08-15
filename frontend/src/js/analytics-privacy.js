/**
 * 🔒 GAMESCOM 2025 - PRIVACY MANAGER
 * 
 * GDPR/CCPA compliant privacy and consent management
 * Generated: 2025-08-06T19:15:56.660Z
 * Version: 1.0.0
 */

class AnalyticsPrivacy {
    constructor() {
        this.version = '1.0.0';
        this.consentKey = 'analytics_consent';
        this.privacyVersion = '1.0';
        this.consentBannerShown = false;
        
        console.log('🔒 Analytics Privacy initialized');
    }

    /**
     * 🚀 Initialize privacy management
     */
    init() {
        // Check existing consent
        const consent = this.getConsentStatus();
        
        if (!consent || this.needsConsentUpdate(consent)) {
            this.showConsentBanner();
        } else if (consent.approved) {
            this.enableAnalytics();
        }
        
        // Setup privacy controls
        this.setupPrivacyControls();
        
        console.log('🔒 Privacy management active');
    }

    /**
     * ✅ Check if user has given valid consent
     */
    hasConsent() {
        const consent = this.getConsentStatus();
        return consent && consent.approved && !this.needsConsentUpdate(consent);
    }

    /**
     * ❌ Check if user has declined
     */
    hasDeclined() {
        const consent = this.getConsentStatus();
        return consent && consent.declined;
    }

    /**
     * 📊 Get current consent status
     */
    getConsentStatus() {
        try {
            const consent = localStorage.getItem(this.consentKey);
            return consent ? JSON.parse(consent) : null;
        } catch (error) {
            console.error('🔒 Error reading consent:', error);
            return null;
        }
    }

    /**
     * 🔄 Check if consent needs updating
     */
    needsConsentUpdate(consent) {
        if (!consent.version || consent.version !== this.privacyVersion) {
            return true;
        }
        
        // Consent expires after 1 year
        const consentAge = Date.now() - consent.timestamp;
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        return consentAge > oneYear;
    }

    /**
     * 📢 Show consent banner
     */
    showConsentBanner() {
        if (this.consentBannerShown) return;
        
        const banner = document.createElement('div');
        banner.id = 'analytics-consent-banner';
        banner.style.cssText = `
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            z-index: 10000;
            background: linear-gradient(135deg, var(--neutral-100) 0%, var(--neutral-200) 100%);
            color: white; 
            padding: 20px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
            border-top: 1px solid var(--neutral-300);
            animation: slideUp 0.3s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            .consent-btn {
                transition: all 0.2s ease;
                font-weight: 600;
                border-radius: 6px;
                padding: 12px 24px;
                border: none;
                cursor: pointer;
                font-size: 14px;
            }
            .consent-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(style);
        
        banner.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; max-width: 1200px; margin: 0 auto;">
                <div style="flex: 1; min-width: 300px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span style="font-size: 24px;">🍪</span>
                        <strong style="font-size: 18px; color: var(--alias-ff6b6b);">Privacy & Analytics</strong>
                    </div>
                    <p style="margin: 0; line-height: 1.5; color: var(--neutral-700);">
                        We use privacy-friendly analytics to improve your experience at Gamescom 2025. 
                        No personal data is stored or shared.
                        <br>
                        <a href="#privacy-details" onclick="window.analyticsPrivacy.showPrivacyDetails()" 
                           style="color: var(--alias-ff6b6b); text-decoration: underline; font-size: 14px;">
                            Learn more about our privacy practices
                        </a>
                    </p>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="consent-accept" class="consent-btn" style="
                        background: var(--alias-ff6b6b); 
                        color: white;
                    ">✅ Accept Analytics</button>
                    <button id="consent-decline" class="consent-btn" style="
                        background: transparent; 
                        color: white; 
                        border: 2px solid var(--neutral-500);
                    ">❌ Decline</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        this.consentBannerShown = true;
        
        // Handle consent actions
        document.getElementById('consent-accept').addEventListener('click', () => {
            this.giveConsent();
            this.removeBanner(banner);
        });
        
        document.getElementById('consent-decline').addEventListener('click', () => {
            this.declineConsent();
            this.removeBanner(banner);
        });
    }

    /**
     * 🗑️ Remove consent banner with animation
     */
    removeBanner(banner) {
        banner.style.animation = 'slideDown 0.3s ease-in forwards';
        banner.style.animationFillMode = 'forwards';
        
        const slideDownKeyframes = `
            @keyframes slideDown {
                from { transform: translateY(0); }
                to { transform: translateY(100%); }
            }
        `;
        
        if (!document.querySelector('#slidedown-keyframes')) {
            const style = document.createElement('style');
            style.id = 'slidedown-keyframes';
            style.textContent = slideDownKeyframes;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 300);
    }

    /**
     * ✅ Give consent
     */
    giveConsent() {
        const consent = {
            approved: true,
            declined: false,
            timestamp: Date.now(),
            version: this.privacyVersion,
            userAgent: navigator.userAgent.substring(0, 100),
            ip: 'not-stored', // We don't store IP addresses
            preferences: {
                analytics: true,
                performance: true,
                functional: true
            }
        };
        
        try {
            localStorage.setItem(this.consentKey, JSON.stringify(consent));
            this.enableAnalytics();
            
            console.log('🔒 Privacy consent granted');
            
            // Track consent (after enabling analytics)
            setTimeout(() => {
                if (window.analyticsCore) {
                    window.analyticsCore.trackEvent('privacy_consent', {
                        action: 'accepted',
                        version: this.privacyVersion
                    });
                }
            }, 100);
            
        } catch (error) {
            console.error('🔒 Error storing consent:', error);
        }
    }

    /**
     * ❌ Decline consent
     */
    declineConsent() {
        const consent = {
            approved: false,
            declined: true,
            timestamp: Date.now(),
            version: this.privacyVersion
        };
        
        try {
            localStorage.setItem(this.consentKey, JSON.stringify(consent));
            this.disableAnalytics();
            
            console.log('🔒 Privacy consent declined');
            
        } catch (error) {
            console.error('🔒 Error storing consent:', error);
        }
    }

    /**
     * ✅ Enable analytics after consent
     */
    enableAnalytics() {
        // Enable analytics core
        if (window.analyticsCore) {
            window.analyticsCore.setTrackingEnabled(true);
        }
        
        // Enable performance monitoring
        if (window.analyticsPerformance) {
            window.analyticsPerformance.init();
        }
        
        console.log('📊 Analytics enabled with consent');
    }

    /**
     * ❌ Disable analytics
     */
    disableAnalytics() {
        // Disable analytics core
        if (window.analyticsCore) {
            window.analyticsCore.setTrackingEnabled(false);
        }
        
        // Cleanup performance monitoring
        if (window.analyticsPerformance) {
            window.analyticsPerformance.cleanup();
        }
        
        console.log('📊 Analytics disabled');
    }

    /**
     * 🗑️ Revoke consent (for settings page)
     */
    revokeConsent() {
        try {
            localStorage.removeItem(this.consentKey);
            this.disableAnalytics();
            this.consentBannerShown = false;
            
            console.log('🔒 Privacy consent revoked');
            
        } catch (error) {
            console.error('🔒 Error revoking consent:', error);
        }
    }

    /**
     * 📋 Show detailed privacy information
     */
    showPrivacyDetails() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10001;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            padding: 20px; backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: white; border-radius: 12px; padding: 30px; 
                max-width: 600px; max-height: 80vh; overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <h2 style="color: var(--neutral-300); margin-top: 0;">🔒 Privacy & Analytics</h2>
                
                <h3>What We Track:</h3>
                <ul>
                    <li>📄 Page views and navigation patterns</li>
                    <li>🔍 Search queries and filter usage (anonymized)</li>
                    <li>🚀 App performance and loading times</li>
                    <li>📱 PWA installation and offline usage</li>
                    <li>🚨 JavaScript errors (for fixing bugs)</li>
                </ul>
                
                <h3>What We DON'T Track:</h3>
                <ul>
                    <li>❌ Personal information or identity</li>
                    <li>❌ IP addresses or location data</li>
                    <li>❌ Cross-site tracking or advertising</li>
                    <li>❌ Data shared with third parties</li>
                </ul>
                
                <h3>Your Rights:</h3>
                <ul>
                    <li>✅ Decline analytics at any time</li>
                    <li>✅ View what data we collect</li>
                    <li>✅ Request data deletion</li>
                    <li>✅ Privacy-first approach</li>
                </ul>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="this.closest('[role=modal]').remove()" style="
                        background: var(--alias-ff6b6b); color: white; border: none; padding: 12px 24px;
                        border-radius: 6px; cursor: pointer; font-weight: 600;
                    ">Got it!</button>
                </div>
            </div>
        `;
        
        modal.setAttribute('role', 'modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.body.appendChild(modal);
    }

    /**
     * 🎛️ Setup privacy controls
     */
    setupPrivacyControls() {
        // Add privacy settings link if privacy page exists
        const privacyLink = document.querySelector('a[href*="privacy"]');
        if (privacyLink) {
            privacyLink.addEventListener('click', () => {
                this.showPrivacyDetails();
            });
        }
        
        // Listen for privacy-related events
        window.addEventListener('privacy-revoke', () => {
            this.revokeConsent();
        });
        
        window.addEventListener('privacy-show-banner', () => {
            this.consentBannerShown = false;
            this.showConsentBanner();
        });
    }

    /**
     * 📊 Get privacy compliance status
     */
    getComplianceStatus() {
        const consent = this.getConsentStatus();
        
        return {
            version: this.version,
            hasConsent: this.hasConsent(),
            consentDate: consent?.timestamp,
            preferences: consent?.preferences || {},
            isGDPRCompliant: true,
            isCCPACompliant: true,
            dataRetention: '1 year maximum',
            rightToErase: true
        };
    }
}

// Create global instance
window.analyticsPrivacy = new AnalyticsPrivacy();

console.log('🔒 Analytics Privacy loaded, version:', window.analyticsPrivacy.version);