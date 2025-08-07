// Gamescom Referral System Application
class GamescomReferralApp {
    constructor() {
        this.referralCode = null;
        this.userStats = {
            totalInvites: 0,
            successfulReferrals: 0,
            rewardPoints: 0,
            clicks: 0,
            conversions: 0
        };
        this.activityHistory = [];
        this.currentRank = null;
        
        // Referral settings
        this.baseURL = window.location.origin;
        this.shareMessages = {
            default: "🎮 Join me at Gamescom 2025! Discover the best gaming industry events, networking opportunities, and afterparties in Cologne.",
            linkedin: "Excited to share this resource for Gamescom 2025 networking! Perfect for connecting with gaming industry professionals.",
            twitter: "🎮 Gamescom 2025 party discovery is here! Find the best industry events and networking opportunities. #Gamescom2025 #Gaming",
            discord: "Hey gamers! Found this awesome directory for Gamescom 2025 events and parties. Check it out!",
            email: {
                subject: "Gamescom 2025 Event Directory - You're Invited!",
                body: "I wanted to share this amazing resource for Gamescom 2025. It's a comprehensive directory of gaming industry events, networking opportunities, and exclusive parties happening during the conference.\n\nYou can discover curated events, add them to your calendar, and even create your own community events. Perfect for anyone attending Gamescom this year!\n\nCheck it out here: {LINK}\n\nSee you at the events!"
            }
        };
    }

    async init() {
        console.log('🎉 Initializing Gamescom Referral System v2.0...');
        
        try {
            // Initialize theme
            this.initTheme();
            
            // Generate or load referral code
            await this.initReferralCode();
            
            // Load user stats
            await this.loadUserStats();
            
            // Setup UI
            this.setupUI();
            
            // Update displays
            this.updateStatsDisplay();
            this.updateTierProgress();
            this.loadActivityHistory();
            
            console.log(`✅ Referral system initialized with code: ${this.referralCode}`);
            
        } catch (error) {
            console.error('❌ Referral system initialization failed:', error);
            this.showError('Failed to initialize referral system');
        }
    }

    async initReferralCode() {
        // Check if user already has a referral code
        let storedCode = localStorage.getItem('referralCode');
        
        if (!storedCode) {
            // Generate new referral code
            storedCode = this.generateReferralCode();
            localStorage.setItem('referralCode', storedCode);
            
            // Track code generation
            this.trackReferralActivity('code_generated', {
                code: storedCode,
                timestamp: Date.now()
            });
        }
        
        this.referralCode = storedCode;
        document.getElementById('referralCode').textContent = storedCode;
    }

    generateReferralCode() {
        const adjectives = ['Gaming', 'Pro', 'Elite', 'Expert', 'Master', 'Champion', 'Ace', 'Prime'];
        const nouns = ['Player', 'Gamer', 'Builder', 'Creator', 'Leader', 'Network', 'Connect', 'Party'];
        
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const number = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        
        return `${adjective}${noun}${number}`.toUpperCase();
    }

    async loadUserStats() {
        try {
            // Load stats from localStorage or API
            const savedStats = localStorage.getItem('referralStats');
            if (savedStats) {
                this.userStats = { ...this.userStats, ...JSON.parse(savedStats) };
            }
            
            // In a real app, this would fetch from API
            // const response = await fetch(`${window.CONFIG.apiBase}/api/referral-stats`);
            // const stats = await response.json();
            // this.userStats = { ...this.userStats, ...stats };
            
        } catch (error) {
            console.warn('Could not load referral stats:', error);
        }
    }

    setupUI() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Generate invite button
        document.getElementById('generateInviteBtn').addEventListener('click', () => {
            this.generateInviteLink();
        });

        // Copy referral code
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyReferralCode();
        });

        // Redeem rewards
        document.getElementById('redeemRewardsBtn').addEventListener('click', () => {
            this.redeemRewards();
        });

        // History filter
        document.getElementById('historyFilter').addEventListener('change', (e) => {
            this.filterHistory(e.target.value);
        });

        // Export history
        document.getElementById('exportHistoryBtn').addEventListener('click', () => {
            this.exportHistory();
        });

        // Leaderboard tabs
        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchLeaderboardPeriod(e.target.dataset.period);
            });
        });

        // View full leaderboard
        document.getElementById('viewFullLeaderboard').addEventListener('click', () => {
            this.viewFullLeaderboard();
        });

        // Modal controls
        this.setupModalControls();
    }

    setupModalControls() {
        // QR Modal
        document.getElementById('closeQRModal').addEventListener('click', () => {
            this.closeModal('qrModal');
        });
        document.getElementById('downloadQR').addEventListener('click', () => {
            this.downloadQRCode();
        });
        document.getElementById('printQR').addEventListener('click', () => {
            this.printQRCode();
        });
        document.getElementById('shareQR').addEventListener('click', () => {
            this.shareQRCode();
        });

        // Embed Modal
        document.getElementById('closeEmbedModal').addEventListener('click', () => {
            this.closeModal('embedModal');
        });
        document.getElementById('copyEmbedCode').addEventListener('click', () => {
            this.copyEmbedCode();
        });
        document.getElementById('customizeWidget').addEventListener('click', () => {
            this.customizeWidget();
        });
    }

    generateInviteLink() {
        const link = `${this.baseURL}?ref=${this.referralCode}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(link).then(() => {
            this.showSuccess('Invite link copied to clipboard!');
            
            // Track link generation
            this.trackReferralActivity('link_generated', {
                method: 'manual_generation',
                timestamp: Date.now()
            });
            
            // Update stats
            this.userStats.totalInvites++;
            this.saveUserStats();
            this.updateStatsDisplay();
            
        }).catch(err => {
            console.error('Failed to copy link:', err);
            this.showError('Failed to copy link');
        });
    }

    copyReferralCode() {
        const fullLink = `${this.baseURL}?ref=${this.referralCode}`;
        
        navigator.clipboard.writeText(fullLink).then(() => {
            const btn = document.getElementById('copyCodeBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
            
            // Track copy action
            this.trackReferralActivity('code_copied', {
                method: 'clipboard',
                timestamp: Date.now()
            });
            
        }).catch(err => {
            console.error('Failed to copy code:', err);
            this.showError('Failed to copy referral code');
        });
    }

    // Social media sharing methods
    shareToLinkedIn() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const text = encodeURIComponent(this.shareMessages.linkedin);
        const shareURL = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${text}`;
        
        this.openShareWindow(shareURL, 'LinkedIn');
        this.trackShare('linkedin');
    }

    shareToTwitter() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const text = encodeURIComponent(`${this.shareMessages.twitter} ${url}`);
        const shareURL = `https://twitter.com/intent/tweet?text=${text}`;
        
        this.openShareWindow(shareURL, 'Twitter');
        this.trackShare('twitter');
    }

    shareToWhatsApp() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const text = encodeURIComponent(`${this.shareMessages.default}\n\n${url}`);
        const shareURL = `https://wa.me/?text=${text}`;
        
        this.openShareWindow(shareURL, 'WhatsApp');
        this.trackShare('whatsapp');
    }

    shareToDiscord() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const message = `${this.shareMessages.discord}\n\n${url}`;
        
        // Discord doesn't have a direct share URL, so copy to clipboard
        navigator.clipboard.writeText(message).then(() => {
            this.showSuccess('Discord message copied to clipboard!');
            this.trackShare('discord');
        });
    }

    shareViaEmail() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const subject = encodeURIComponent(this.shareMessages.email.subject);
        const body = encodeURIComponent(this.shareMessages.email.body.replace('{LINK}', url));
        const mailtoURL = `mailto:?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoURL;
        this.trackShare('email');
    }

    shareViaSMS() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const message = encodeURIComponent(`${this.shareMessages.default} ${url}`);
        const smsURL = `sms:?body=${message}`;
        
        window.location.href = smsURL;
        this.trackShare('sms');
    }

    shareToSlack() {
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const text = encodeURIComponent(this.shareMessages.linkedin); // Use professional message
        const shareURL = `https://slack.com/intl/en-us/help/articles/201330736-Add-web-bookmarks-to-Slack?text=${text}&url=${encodeURIComponent(url)}`;
        
        this.openShareWindow(shareURL, 'Slack');
        this.trackShare('slack');
    }

    generateQRCode() {
        this.showModal('qrModal');
        
        // Generate QR code (simplified implementation)
        // In a real app, you'd use a QR code library like qrcode.js
        const qrContainer = document.getElementById('qrCodeContainer');
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        
        // For demonstration, show a placeholder
        qrContainer.innerHTML = `
            <div class="qr-code-display">
                <div class="qr-mock">
                    <div class="qr-pattern">
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                        <div class="qr-square"></div>
                    </div>
                </div>
                <p class="qr-url">${url}</p>
            </div>
        `;
        
        this.trackReferralActivity('qr_generated', {
            method: 'modal',
            timestamp: Date.now()
        });
    }

    generateEmbedCode() {
        this.showModal('embedModal');
        
        const url = `${this.baseURL}?ref=${this.referralCode}`;
        const embedCode = `<iframe src="${this.baseURL}/widget?ref=${this.referralCode}" 
        width="300" height="200" 
        frameborder="0" 
        style="border-radius: 8px;">&lt;/iframe&gt;`;
        
        document.getElementById('embedCode').value = embedCode;
        
        this.trackReferralActivity('embed_generated', {
            method: 'modal',
            timestamp: Date.now()
        });
    }

    downloadInviteCard() {
        // Generate a business card-style invite
        // In a real app, this would generate a PDF or image
        const cardData = {
            name: 'Gamescom 2025 Party Discovery',
            code: this.referralCode,
            url: `${this.baseURL}?ref=${this.referralCode}`,
            message: 'Join me for the best gaming industry events!'
        };
        
        // For demo, just copy the card info
        const cardText = `🎮 ${cardData.name}\n\nReferral Code: ${cardData.code}\nLink: ${cardData.url}\n\n${cardData.message}`;
        
        navigator.clipboard.writeText(cardText).then(() => {
            this.showSuccess('Business card info copied to clipboard!');
            this.trackShare('business_card');
        });
    }

    openShareWindow(url, platform) {
        const popup = window.open(url, `share_${platform}`, 'width=600,height=400');
        
        // Check if popup was blocked
        if (!popup) {
            this.showError('Popup blocked. Please allow popups for sharing.');
            return;
        }
        
        // Focus the popup
        popup.focus();
    }

    trackShare(platform) {
        this.trackReferralActivity('link_shared', {
            platform: platform,
            timestamp: Date.now()
        });
        
        // Update stats
        this.userStats.totalInvites++;
        this.userStats.clicks++;
        this.saveUserStats();
        this.updateStatsDisplay();
    }

    trackReferralActivity(action, data = {}) {
        const activity = {
            id: Date.now().toString(),
            action: action,
            timestamp: Date.now(),
            ...data
        };
        
        this.activityHistory.unshift(activity);
        
        // Keep only last 100 activities
        if (this.activityHistory.length > 100) {
            this.activityHistory = this.activityHistory.slice(0, 100);
        }
        
        // Save to localStorage
        localStorage.setItem('referralActivity', JSON.stringify(this.activityHistory));
        
        // Update activity display
        this.updateActivityDisplay();
    }

    loadActivityHistory() {
        const saved = localStorage.getItem('referralActivity');
        if (saved) {
            this.activityHistory = JSON.parse(saved);
        }
        
        this.updateActivityDisplay();
    }

    updateActivityDisplay() {
        const container = document.getElementById('referralTimeline');
        
        if (this.activityHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-timeline">
                    <div class="empty-icon">📊</div>
                    <h3>No Activity Yet</h3>
                    <p>Start sharing your referral link to see activity here!</p>
                </div>
            `;
            return;
        }
        
        // Remove sample items
        container.querySelectorAll('.sample').forEach(item => item.remove());
        
        // Add real activity items
        const recentActivities = this.activityHistory.slice(0, 10); // Show last 10
        const activitiesHTML = recentActivities.map(activity => this.renderActivityItem(activity)).join('');
        
        container.innerHTML = activitiesHTML;
    }

    renderActivityItem(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        const actionText = this.getActionText(activity);
        const iconClass = this.getActionIcon(activity.action);
        
        return `
            <div class="timeline-item">
                <div class="timeline-dot ${iconClass}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-action">${actionText.action}</span>
                        <span class="timeline-time">${timeAgo}</span>
                    </div>
                    <div class="timeline-details">
                        ${actionText.details}
                    </div>
                </div>
            </div>
        `;
    }

    getActionText(activity) {
        const actions = {
            code_generated: {
                action: '🎯 Referral code generated',
                details: `Your unique code: ${activity.code || this.referralCode}`
            },
            link_generated: {
                action: '🔗 Invite link created',
                details: 'Manually generated and copied to clipboard'
            },
            code_copied: {
                action: '📋 Code copied',
                details: 'Referral link copied to clipboard'
            },
            link_shared: {
                action: '📤 Link shared',
                details: `Shared via ${activity.platform || 'unknown platform'} • <span class="platform-tag">${activity.platform || 'Social'}</span>`
            },
            qr_generated: {
                action: '📱 QR code generated',
                details: 'QR code created for offline sharing'
            },
            embed_generated: {
                action: '🔗 Embed code generated',
                details: 'Widget embed code created'
            },
            referral_success: {
                action: '✅ Friend joined',
                details: `${activity.friend || 'Someone'} joined via your link • <span class="reward-earned">+${activity.points || 50} points</span>`
            }
        };
        
        return actions[activity.action] || {
            action: '📊 Activity',
            details: 'Unknown activity'
        };
    }

    getActionIcon(action) {
        const iconClasses = {
            referral_success: 'success',
            code_generated: 'primary',
            link_shared: 'primary'
        };
        
        return iconClasses[action] || '';
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }

    updateStatsDisplay() {
        document.getElementById('totalInvites').textContent = this.userStats.totalInvites;
        document.getElementById('successfulReferrals').textContent = this.userStats.successfulReferrals;
        document.getElementById('rewardPoints').textContent = this.userStats.rewardPoints;
        document.getElementById('codeClicks').textContent = this.userStats.clicks;
        document.getElementById('codeConversions').textContent = this.userStats.conversions;
    }

    updateTierProgress() {
        const currentReferrals = this.userStats.successfulReferrals;
        const nextTierThreshold = 5; // First tier requirement
        const progress = Math.min((currentReferrals / nextTierThreshold) * 100, 100);
        
        document.getElementById('tierProgress').style.width = `${progress}%`;
        document.getElementById('tierProgressText').textContent = `${currentReferrals}/${nextTierThreshold}`;
        
        // Enable redeem button if user has enough points
        const redeemBtn = document.getElementById('redeemRewardsBtn');
        redeemBtn.disabled = this.userStats.rewardPoints < 100;
    }

    redeemRewards() {
        if (this.userStats.rewardPoints >= 100) {
            // In a real app, this would process the redemption
            this.showSuccess('Reward redemption feature coming soon!');
        } else {
            this.showError('Not enough points to redeem rewards');
        }
    }

    filterHistory(period) {
        // Filter activity history by period
        // Implementation would filter this.activityHistory based on period
        console.log(`Filtering history by: ${period}`);
    }

    exportHistory() {
        const data = {
            referralCode: this.referralCode,
            stats: this.userStats,
            activity: this.activityHistory,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gamescom-referral-data-${this.referralCode}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Referral data exported successfully!');
    }

    switchLeaderboardPeriod(period) {
        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // In a real app, this would load different leaderboard data
        console.log(`Switching leaderboard to: ${period}`);
    }

    viewFullLeaderboard() {
        // In a real app, this would open a full leaderboard page or modal
        this.showSuccess('Full leaderboard feature coming soon!');
    }

    copyEmbedCode() {
        const embedCode = document.getElementById('embedCode');
        embedCode.select();
        document.execCommand('copy');
        
        this.showSuccess('Embed code copied to clipboard!');
    }

    customizeWidget() {
        this.showSuccess('Widget customization coming soon!');
    }

    downloadQRCode() {
        // In a real app, this would generate and download the QR code
        this.showSuccess('QR code download feature coming soon!');
    }

    printQRCode() {
        window.print();
    }

    shareQRCode() {
        if (navigator.share) {
            navigator.share({
                title: 'Gamescom 2025 Events',
                text: 'Scan this QR code to discover gaming events at Gamescom 2025!',
                url: `${this.baseURL}?ref=${this.referralCode}`
            });
        } else {
            this.shareToWhatsApp(); // Fallback to WhatsApp
        }
    }

    saveUserStats() {
        localStorage.setItem('referralStats', JSON.stringify(this.userStats));
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--slack-success);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--slack-error);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = html.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            html.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Initialize referral app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.referralApp = new GamescomReferralApp();
    window.referralApp.init().catch(error => {
        console.error('Failed to initialize referral app:', error);
    });
});