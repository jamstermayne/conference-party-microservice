/**
 * 🚀 OPTIMIZED PROFESSIONAL ONBOARDING SYSTEM
 * Uses centralized storage, event management, and caching
 * Four core personas: Developer, Publishing, Investor, Service Provider
 */

class OnboardingManager {
    constructor() {
        this.currentStep = 0;
        this.eventKeys = []; // Track event listeners for cleanup
        this.userData = {
            userId: this.getOrCreateUserId(),
            persona: null,
            profile: {},
            preferences: {},
            completedAt: null
        };
        
        this.personas = {
            developer: {
                id: 'developer',
                title: 'Game Developer',
                icon: '👨‍💻',
                description: 'Building the future of gaming',
                color: 'var(--primary)',
                questions: [
                    { key: 'studio', label: 'Studio/Company', type: 'text', placeholder: 'e.g., Indie Studio, AAA Company' },
                    { key: 'role', label: 'Your Role', type: 'select', options: ['Programmer', 'Designer', 'Artist', 'Producer', 'QA', 'Other'] },
                    { key: 'platform', label: 'Primary Platform', type: 'select', options: ['PC', 'Console', 'Mobile', 'VR/AR', 'Multi-platform'] },
                    { key: 'experience', label: 'Years in Industry', type: 'select', options: ['0-2', '3-5', '5-10', '10+'] }
                ],
                interests: ['Technical talks', 'Indie showcases', 'Engine demos', 'Networking mixers']
            },
            publishing: {
                id: 'publishing',
                title: 'Publisher & Marketing',
                icon: '📢',
                description: 'Bringing games to the world',
                color: 'var(--success)',
                questions: [
                    { key: 'company', label: 'Company', type: 'text', placeholder: 'Publishing company name' },
                    { key: 'role', label: 'Department', type: 'select', options: ['Publishing', 'Marketing', 'PR', 'Business Dev', 'Community', 'Sales'] },
                    { key: 'market', label: 'Primary Market', type: 'select', options: ['Global', 'North America', 'Europe', 'Asia', 'Latin America'] },
                    { key: 'portfolio', label: 'Portfolio Size', type: 'select', options: ['1-5 titles', '5-20 titles', '20-50 titles', '50+ titles'] }
                ],
                interests: ['Business meetings', 'Launch parties', 'Press events', 'Partner showcases']
            },
            investor: {
                id: 'investor',
                title: 'Investor & VC',
                icon: '💼',
                description: 'Funding the next big hit',
                color: 'var(--warning)',
                questions: [
                    { key: 'firm', label: 'Firm/Fund', type: 'text', placeholder: 'Investment firm name' },
                    { key: 'stage', label: 'Investment Stage', type: 'select', options: ['Seed', 'Series A', 'Series B+', 'Growth', 'All stages'] },
                    { key: 'checkSize', label: 'Typical Check Size', type: 'select', options: ['<$500K', '$500K-$2M', '$2M-$10M', '$10M+'] },
                    { key: 'focus', label: 'Investment Focus', type: 'select', options: ['Mobile', 'PC/Console', 'Web3/Blockchain', 'Platform agnostic'] }
                ],
                interests: ['Pitch events', 'VIP dinners', 'Executive meetings', 'Demo sessions']
            },
            service: {
                id: 'service',
                title: 'Service Provider',
                icon: '🛠️',
                description: 'Supporting the ecosystem',
                color: 'var(--secondary)',
                questions: [
                    { key: 'company', label: 'Company', type: 'text', placeholder: 'Service company name' },
                    { key: 'service', label: 'Service Type', type: 'select', options: ['Localization', 'QA Testing', 'Audio/Music', 'Outsourcing', 'Tools/Tech', 'Legal', 'Other'] },
                    { key: 'scale', label: 'Company Size', type: 'select', options: ['1-10', '11-50', '51-200', '200+'] },
                    { key: 'clients', label: 'Client Focus', type: 'select', options: ['Indies', 'AA Studios', 'AAA Studios', 'Publishers', 'All'] }
                ],
                interests: ['Partner events', 'Tech demos', 'B2B meetings', 'Industry panels']
            }
        };
        
        this.init();
    }

    async init() {
        // Check if user has already completed onboarding
        const completed = await this.checkOnboardingStatus();
        if (completed && !this.isForceOnboarding()) {
            this.redirectToMain();
            return;
        }
        
        this.renderOnboarding();
        this.attachEventListeners();
    }

    async checkOnboardingStatus() {
        try {
            const completed = localStorage.getItem('gamescom_onboarding_completed');
            if (!completed) return false;
            
            const data = JSON.parse(completed);
            return data && data.completedAt && data.persona;
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            return false;
        }
    }

    isForceOnboarding() {
        const params = new URLSearchParams(window.location.search);
        return params.get('force') === 'true';
    }

    renderOnboarding() {
        const container = document.querySelector('.main-content') || document.querySelector('main') || document.body;
        
        container.innerHTML = `
            <div class="onboarding-container">
                <div class="onboarding-wrapper">
                    <!-- Progress Bar -->
                    <div class="onboarding-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
                        </div>
                        <div class="progress-steps">
                            <div class="progress-step active" data-step="0">
                                <span class="step-number">1</span>
                                <span class="step-label">Welcome</span>
                            </div>
                            <div class="progress-step" data-step="1">
                                <span class="step-number">2</span>
                                <span class="step-label">Role</span>
                            </div>
                            <div class="progress-step" data-step="2">
                                <span class="step-number">3</span>
                                <span class="step-label">Profile</span>
                            </div>
                            <div class="progress-step" data-step="3">
                                <span class="step-number">4</span>
                                <span class="step-label">Interests</span>
                            </div>
                        </div>
                    </div>

                    <!-- Content Area -->
                    <div class="onboarding-content" id="onboardingContent">
                        ${this.renderWelcomeStep()}
                    </div>

                    <!-- Navigation -->
                    <div class="onboarding-nav">
                        <button class="btn btn-ghost" id="backBtn" style="display: none;">
                            ← Back
                        </button>
                        <button class="btn btn-primary" id="nextBtn">
                            Get Started →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWelcomeStep() {
        return `
            <div class="onboarding-step" data-step="welcome">
                <div class="welcome-header">
                    <div class="welcome-icon">🎮</div>
                    <h1 class="welcome-title">Welcome to Gamescom 2025</h1>
                    <p class="welcome-subtitle">The world's largest gaming industry gathering</p>
                </div>
                
                <div class="welcome-features">
                    <div class="feature-grid">
                        <div class="feature-card">
                            <span class="feature-icon">🎯</span>
                            <h3>Personalized Events</h3>
                            <p>Get recommendations based on your professional interests</p>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">🤝</span>
                            <h3>Network Smarter</h3>
                            <p>Connect with the right people in the industry</p>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">📅</span>
                            <h3>Plan Your Week</h3>
                            <p>Never miss important parties and networking events</p>
                        </div>
                        <div class="feature-card">
                            <span class="feature-icon">🔔</span>
                            <h3>Real-time Updates</h3>
                            <p>Get notified about exclusive events and changes</p>
                        </div>
                    </div>
                </div>
                
                <div class="welcome-footer">
                    <p class="text-muted">This takes just 2 minutes and helps us personalize your experience</p>
                </div>
            </div>
        `;
    }

    renderPersonaStep() {
        return `
            <div class="onboarding-step" data-step="persona">
                <div class="step-header">
                    <h2>What brings you to Gamescom?</h2>
                    <p class="text-muted">Select your primary professional role</p>
                </div>
                
                <div class="persona-grid">
                    ${Object.values(this.personas).map(persona => `
                        <div class="persona-card" data-persona="${persona.id}">
                            <div class="persona-icon" style="background: ${persona.color}20; color: ${persona.color}">
                                ${persona.icon}
                            </div>
                            <h3 class="persona-title">${persona.title}</h3>
                            <p class="persona-description">${persona.description}</p>
                            <div class="persona-check">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="2"/>
                                    <path d="M7 12l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"/>
                                </svg>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderProfileStep() {
        if (!this.userData.persona) return '';
        
        const persona = this.personas[this.userData.persona];
        
        return `
            <div class="onboarding-step" data-step="profile">
                <div class="step-header">
                    <div class="persona-badge" style="background: ${persona.color}20; color: ${persona.color}">
                        ${persona.icon} ${persona.title}
                    </div>
                    <h2>Tell us about yourself</h2>
                    <p class="text-muted">This helps us connect you with relevant opportunities</p>
                </div>
                
                <form class="profile-form" id="profileForm">
                    ${persona.questions.map(q => this.renderFormField(q)).join('')}
                </form>
            </div>
        `;
    }

    renderFormField(question) {
        if (question.type === 'text') {
            return `
                <div class="form-group">
                    <label for="${question.key}" class="form-label">${question.label}</label>
                    <input 
                        type="text" 
                        id="${question.key}" 
                        name="${question.key}"
                        class="form-input" 
                        placeholder="${question.placeholder || ''}"
                        required
                    >
                </div>
            `;
        }
        
        if (question.type === 'select') {
            return `
                <div class="form-group">
                    <label for="${question.key}" class="form-label">${question.label}</label>
                    <select id="${question.key}" name="${question.key}" class="form-select" required>
                        <option value="">Select...</option>
                        ${question.options.map(opt => `
                            <option value="${opt}">${opt}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
        
        return '';
    }

    renderInterestsStep() {
        if (!this.userData.persona) return '';
        
        const persona = this.personas[this.userData.persona];
        
        return `
            <div class="onboarding-step" data-step="interests">
                <div class="step-header">
                    <h2>What are you interested in?</h2>
                    <p class="text-muted">We'll notify you about these types of events</p>
                </div>
                
                <div class="interests-section">
                    <h3 class="section-title">Recommended for ${persona.title}</h3>
                    <div class="interest-chips">
                        ${persona.interests.map(interest => `
                            <label class="interest-chip">
                                <input type="checkbox" name="interest" value="${interest}" checked>
                                <span>${interest}</span>
                            </label>
                        `).join('')}
                    </div>
                    
                    <h3 class="section-title mt-lg">Other Interests</h3>
                    <div class="interest-chips">
                        ${this.getOtherInterests().map(interest => `
                            <label class="interest-chip">
                                <input type="checkbox" name="interest" value="${interest}">
                                <span>${interest}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="completion-message">
                    <div class="success-icon">✨</div>
                    <h3>You're all set!</h3>
                    <p class="text-muted">Ready to discover amazing events at Gamescom 2025</p>
                </div>
            </div>
        `;
    }

    getOtherInterests() {
        const allInterests = [
            'VIP parties', 'Award ceremonies', 'Game reveals',
            'Esports events', 'Cosplay gatherings', 'Media events',
            'Educational workshops', 'Recruitment fairs', 'After parties',
            'Industry talks', 'Startup pitches', 'Tech showcases'
        ];
        
        const personaInterests = this.userData.persona ? 
            this.personas[this.userData.persona].interests : [];
        
        return allInterests.filter(i => !personaInterests.includes(i));
    }

    attachEventListeners() {
        // Navigation buttons using standard event listeners
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNext());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleBack());
        }
    }

    handleNext() {
        if (this.currentStep === 0) {
            this.currentStep = 1;
            this.updateContent(this.renderPersonaStep());
            this.attachPersonaListeners();
        } else if (this.currentStep === 1) {
            if (!this.userData.persona) {
                this.showError('Please select your professional role');
                return;
            }
            this.currentStep = 2;
            this.updateContent(this.renderProfileStep());
        } else if (this.currentStep === 2) {
            if (!this.validateProfileForm()) {
                return;
            }
            this.saveProfileData();
            this.currentStep = 3;
            this.updateContent(this.renderInterestsStep());
            document.getElementById('nextBtn').textContent = 'Complete Setup →';
        } else if (this.currentStep === 3) {
            this.saveInterests();
            this.completeOnboarding();
        }
        
        this.updateProgress();
        this.updateNavButtons();
    }

    handleBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
            
            if (this.currentStep === 0) {
                this.updateContent(this.renderWelcomeStep());
            } else if (this.currentStep === 1) {
                this.updateContent(this.renderPersonaStep());
                this.attachPersonaListeners();
            } else if (this.currentStep === 2) {
                this.updateContent(this.renderProfileStep());
            }
            
            this.updateProgress();
            this.updateNavButtons();
        }
    }

    attachPersonaListeners() {
        document.querySelectorAll('.persona-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Remove previous selection
                document.querySelectorAll('.persona-card').forEach(c => {
                    c.classList.remove('selected');
                    const path = c.querySelector('path');
                    if (path) {
                        path.style.display = 'none';
                    }
                });
                
                // Add new selection
                card.classList.add('selected');
                const path = card.querySelector('path');
                if (path) {
                    path.style.display = 'block';
                }
                
                this.userData.persona = card.dataset.persona;
                console.log('Selected persona:', this.userData.persona);
            });
        });
    }

    validateProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return false;
        
        const formData = new FormData(form);
        const profile = {};
        let isValid = true;
        
        for (let [key, value] of formData.entries()) {
            if (!value) {
                isValid = false;
                document.getElementById(key)?.classList.add('error');
            } else {
                profile[key] = value;
                document.getElementById(key)?.classList.remove('error');
            }
        }
        
        if (!isValid) {
            this.showError('Please fill in all required fields');
        }
        
        return isValid;
    }

    saveProfileData() {
        const form = document.getElementById('profileForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const profile = {};
        
        for (let [key, value] of formData.entries()) {
            profile[key] = value;
        }
        
        this.userData.profile = profile;
    }

    saveInterests() {
        const interests = [];
        document.querySelectorAll('input[name="interest"]:checked').forEach(input => {
            interests.push(input.value);
        });
        
        this.userData.preferences.interests = interests;
    }

    async completeOnboarding() {
        this.userData.completedAt = new Date().toISOString();
        
        try {
            // Save to localStorage
            localStorage.setItem('gamescom_onboarding_completed', JSON.stringify(this.userData));
            localStorage.setItem('gamescom_user_persona', this.userData.persona);
            localStorage.setItem('gamescom_user_profile', JSON.stringify(this.userData.profile));
            localStorage.setItem('gamescom_user_preferences', JSON.stringify(this.userData.preferences));
            
            console.log('Onboarding completed successfully:', this.userData);
            
            // Show success animation
            this.showSuccessAnimation();
            
            // Redirect after animation
            setTimeout(() => {
                this.redirectToMain();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
            this.showError('Failed to save your profile. Please try again.');
        }
    }

    showSuccessAnimation() {
        const content = document.getElementById('onboardingContent');
        if (content) {
            content.innerHTML = `
                <div class="success-animation">
                    <div class="success-checkmark">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--success)" stroke-width="4" class="circle-animation"/>
                            <path d="M30 50 L45 65 L70 35" fill="none" stroke="var(--success)" stroke-width="4" class="check-animation"/>
                        </svg>
                    </div>
                    <h2 class="mt-lg">Welcome aboard!</h2>
                    <p class="text-muted">Redirecting to your personalized event feed...</p>
                </div>
            `;
        }
    }

    redirectToMain() {
        // Navigate to main events page with persona context
        window.location.href = `/#events?persona=${this.userData.persona || ''}`;
    }

    updateContent(html) {
        const content = document.getElementById('onboardingContent');
        if (content) {
            content.innerHTML = html;
        }
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / 4) * 100;
        const fill = document.getElementById('progressFill');
        if (fill) {
            fill.style.width = `${progress}%`;
        }
        
        // Update step indicators
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    updateNavButtons() {
        const backBtn = document.getElementById('backBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (backBtn) {
            backBtn.style.display = this.currentStep > 0 ? 'flex' : 'none';
        }
        
        if (nextBtn && this.currentStep === 3) {
            nextBtn.textContent = 'Complete Setup →';
        } else if (nextBtn && this.currentStep === 0) {
            nextBtn.textContent = 'Get Started →';
        } else if (nextBtn) {
            nextBtn.textContent = 'Continue →';
        }
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <span class="toast-icon">⚠️</span>
            <span class="toast-message">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem('gamescom_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('gamescom_user_id', userId);
        }
        return userId;
    }
    
    /**
     * Cleanup event listeners when component is destroyed
     */
    destroy() {
        // Standard event listeners will be automatically removed when elements are destroyed
        this.eventKeys = [];
    }
}

// Initialize on page load or when navigating to onboarding
if (window.location.pathname === '/onboarding' || window.location.hash === '#onboarding') {
    document.addEventListener('DOMContentLoaded', () => {
        window.onboardingManager = new OnboardingManager();
    });
}

// Export for navigation integration
window.OnboardingManager = OnboardingManager;