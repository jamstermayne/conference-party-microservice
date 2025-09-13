/**
 * Feature Showcase System
 * Complete access to ALL MAU platform capabilities
 */

class FeatureShowcase {
  constructor() {
    this.isOpen = false;
    this.currentFeature = null;
    
    this.features = {
      ml: {
        title: 'Smart Networking',
        icon: 'brain',
        description: 'AI-powered professional connection matching',
        capabilities: [
          'Smart contact matching',
          'Professional recommendations',
          'Optimal networking paths',
          'Industry-based connections',
          'Meeting scheduling'
        ]
      },
      eventCreation: {
        title: 'Create Event',
        icon: 'calendar',
        description: 'Host your own conference event',
        capabilities: [
          'Custom event setup',
          'Venue booking',
          'Attendee management',
          'Ticketing system',
          'Promotion tools'
        ]
      },
      analytics: {
        title: 'Analytics Dashboard',
        icon: 'chartBar',
        description: 'Post-event insights and metrics',
        capabilities: [
          'Attendance analytics',
          'Engagement metrics',
          'ROI tracking',
          'Network growth',
          'Heat maps'
        ]
      },
      aiAssistant: {
        title: 'AI Assistant',
        icon: 'sparkles',
        description: 'Your personal conference concierge',
        capabilities: [
          'Schedule optimization',
          'Meeting suggestions',
          'Real-time Q&A',
          'Language translation',
          'Note taking'
        ]
      },
      virtualEvents: {
        title: 'Virtual Events',
        icon: 'video',
        description: 'Hybrid and remote participation',
        capabilities: [
          'Live streaming',
          'Virtual booths',
          'VR experiences',
          'Remote networking',
          'Digital swag'
        ]
      },
      marketplace: {
        title: 'Marketplace',
        icon: 'target',
        description: 'B2B deals and partnerships',
        capabilities: [
          'Deal flow',
          'Investment opportunities',
          'Service providers',
          'Job board',
          'Collaboration hub'
        ]
      }
    };
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.createShowcaseUI();
    this.setupKeyboardShortcuts();
  }

  createShowcaseUI() {
    // No button needed - will be triggered from hero landing

    // Main Showcase Panel
    const showcase = document.createElement('div');
    showcase.className = 'feature-showcase';
    showcase.innerHTML = `
      <div class="showcase-backdrop" onclick="window.featureShowcase.close()"></div>
      <div class="showcase-panel">
        <div class="showcase-header">
          <h2 class="showcase-title">MAU Platform Features</h2>
          <p class="showcase-subtitle">Unlock the full power of professional networking</p>
          <button class="showcase-close" onclick="window.featureShowcase.close()">×</button>
        </div>

        <div class="showcase-grid">
          ${Object.entries(this.features).map(([key, feature]) => {
            const iconSvg = getIcon(feature.icon, 48, 'feature-icon-svg');
            return `
            <div class="feature-card" onclick="window.featureShowcase.openFeature('${key}')">
              <div class="feature-card-icon">${iconSvg}</div>
              <h3 class="feature-card-title">${feature.title}</h3>
              <p class="feature-card-description">${feature.description}</p>
              <div class="feature-card-capabilities">
                ${feature.capabilities.slice(0, 3).map(cap => `
                  <span class="capability-tag">• ${cap}</span>
                `).join('')}
              </div>
              <button class="feature-card-action">
                Explore →
              </button>
            </div>
            `;
          }).join('')}
        </div>

        <div class="showcase-footer">
          <div class="keyboard-hint">
            <kbd>⌘</kbd> + <kbd>K</kbd> to open • <kbd>ESC</kbd> to close
          </div>
        </div>
      </div>

      <!-- Feature Detail Views -->
      ${this.createMLPanel()}
      ${this.createEventCreationPanel()}
      ${this.createAnalyticsPanel()}
      ${this.createAIAssistantPanel()}
    `;
    document.body.appendChild(showcase);
  }

  createMLPanel() {
    return `
      <div class="feature-detail-panel" id="ml-panel">
        <div class="detail-header">
          <button class="detail-back" onclick="window.featureShowcase.backToGrid()">←</button>
          <h2>${window.getIcon ? window.getIcon('ai') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'} ML Recommendations Engine</h2>
        </div>
        
        <div class="ml-recommendations">
          <div class="ml-section">
            <h3>Smart Networking Matches</h3>
            <div class="ml-matches">
              <div class="ml-match-card">
                <div class="match-score">95%</div>
                <div class="match-info">
                  <h4>Sarah Chen</h4>
                  <p>Game Designer at Ubisoft</p>
                  <div class="match-reasons">
                    <span class="reason">✓ Similar interests</span>
                    <span class="reason">✓ Complementary skills</span>
                    <span class="reason">✓ Mutual connections</span>
                  </div>
                </div>
                <button class="match-connect">Connect</button>
              </div>
              
              <div class="ml-match-card">
                <div class="match-score">88%</div>
                <div class="match-info">
                  <h4>Marcus Johnson</h4>
                  <p>Publisher at EA Games</p>
                  <div class="match-reasons">
                    <span class="reason">✓ Business synergy</span>
                    <span class="reason">✓ Active in your sector</span>
                  </div>
                </div>
                <button class="match-connect">Connect</button>
              </div>
            </div>
          </div>

          <div class="ml-section">
            <h3>Event Recommendations</h3>
            <div class="ml-events">
              <div class="ml-event">
                <div class="event-relevance">
                  <span class="relevance-score">⭐ 4.8</span>
                  <span class="relevance-label">Highly Relevant</span>
                </div>
                <h4>AI in Game Development Summit</h4>
                <p>Based on your interest in machine learning and game tech</p>
                <button class="event-add">Add to Schedule</button>
              </div>
            </div>
          </div>

          <div class="ml-section">
            <h3>Networking Path Optimizer</h3>
            <div class="network-path">
              <div class="path-visualization">
                <div class="path-node current">You</div>
                <div class="path-connection">→</div>
                <div class="path-node">John D.</div>
                <div class="path-connection">→</div>
                <div class="path-node target">Target CEO</div>
              </div>
              <p class="path-description">Optimal path: 2 introductions needed</p>
              <button class="path-start">Start Introduction Chain</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createEventCreationPanel() {
    return `
      <div class="feature-detail-panel" id="eventCreation-panel">
        <div class="detail-header">
          <button class="detail-back" onclick="window.featureShowcase.backToGrid()">←</button>
          <h2>🎯 Create Your Event</h2>
        </div>
        
        <form class="event-creation-form">
          <div class="form-section">
            <h3>Basic Information</h3>
            <input type="text" placeholder="Event Title" class="form-input" value="Indie Developer Meetup">
            <textarea placeholder="Description" class="form-textarea">Join fellow indie developers for an evening of networking, knowledge sharing, and collaboration.</textarea>
            
            <div class="form-row">
              <input type="date" class="form-input" value="2025-08-22">
              <input type="time" class="form-input" value="18:00">
            </div>
          </div>

          <div class="form-section">
            <h3>Venue Selection</h3>
            <div class="venue-options">
              <label class="venue-option selected">
                <input type="radio" name="venue" checked>
                <div class="venue-card">
                  <h4>Hall 7 - Meeting Room A</h4>
                  <p>Capacity: 50 people</p>
                  <span class="venue-price">€500/hour</span>
                </div>
              </label>
              <label class="venue-option">
                <input type="radio" name="venue">
                <div class="venue-card">
                  <h4>VIP Lounge</h4>
                  <p>Capacity: 30 people</p>
                  <span class="venue-price">€800/hour</span>
                </div>
              </label>
            </div>
          </div>

          <div class="form-section">
            <h3>Event Features</h3>
            <div class="feature-toggles">
              <label class="toggle-option">
                <input type="checkbox" checked>
                <span>Live Streaming</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" checked>
                <span>Q&A Session</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox">
                <span>Catering</span>
              </label>
              <label class="toggle-option">
                <input type="checkbox" checked>
                <span>Recording</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="window.featureShowcase.previewEvent()">Preview</button>
            <button type="button" class="btn-primary" onclick="window.featureShowcase.createEvent()">Create Event</button>
          </div>
        </form>
      </div>
    `;
  }

  createAnalyticsPanel() {
    return `
      <div class="feature-detail-panel" id="analytics-panel">
        <div class="detail-header">
          <button class="detail-back" onclick="window.featureShowcase.backToGrid()">←</button>
          <h2>📊 Analytics Dashboard</h2>
        </div>
        
        <div class="analytics-dashboard">
          <div class="analytics-summary">
            <div class="stat-card">
              <div class="stat-value">2,847</div>
              <div class="stat-label">Total Attendees</div>
              <div class="stat-change positive">↑ 23%</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">89%</div>
              <div class="stat-label">Engagement Rate</div>
              <div class="stat-change positive">↑ 12%</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">456</div>
              <div class="stat-label">New Connections</div>
              <div class="stat-change positive">↑ 67%</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">€125K</div>
              <div class="stat-label">Deal Value</div>
              <div class="stat-change positive">↑ 45%</div>
            </div>
          </div>

          <div class="analytics-chart">
            <h3>Engagement Timeline</h3>
            <div class="chart-container">
              <div class="chart-bars">
                ${[65, 72, 68, 84, 91, 88, 95, 89].map(height => `
                  <div class="chart-bar" style="height: ${height}%"></div>
                `).join('')}
              </div>
              <div class="chart-labels">
                <span>Day 1</span>
                <span>Day 2</span>
                <span>Day 3</span>
                <span>Day 4</span>
              </div>
            </div>
          </div>

          <div class="analytics-heatmap">
            <h3>Venue Heat Map</h3>
            <div class="heatmap-container">
              <div class="heatmap-grid">
                ${Array(48).fill(0).map(() => {
                  const intensity = Math.random();
                  return `<div class="heatmap-cell" style="background: rgba(0, 122, 255, ${intensity})"></div>`;
                }).join('')}
              </div>
              <p class="heatmap-label">Peak activity zones during your events</p>
            </div>
          </div>

          <div class="analytics-connections">
            <h3>Network Growth</h3>
            <div class="connection-graph">
              <div class="graph-center">You</div>
              <div class="graph-ring ring-1">
                <span class="graph-node">156 Direct</span>
              </div>
              <div class="graph-ring ring-2">
                <span class="graph-node">1.2K Secondary</span>
              </div>
              <div class="graph-ring ring-3">
                <span class="graph-node">8.5K Extended</span>
              </div>
            </div>
          </div>

          <button class="export-report">📥 Export Full Report</button>
        </div>
      </div>
    `;
  }

  createAIAssistantPanel() {
    return `
      <div class="feature-detail-panel" id="aiAssistant-panel">
        <div class="detail-header">
          <button class="detail-back" onclick="window.featureShowcase.backToGrid()">←</button>
          <h2>${window.getIcon ? window.getIcon('ai') : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'} AI Intelligence</h2>
        </div>
        
        <div class="ai-assistant-container">
          <!-- Smart Scheduling Demo -->
          <div class="ai-demo-section" id="smart-scheduling">
            <h3>Smart Scheduling</h3>
            <p class="ai-demo-subtitle">Watch AI optimize your day in real-time</p>
            
            <div class="schedule-visualization">
              <div class="schedule-before">
                <h4>Your Current Schedule</h4>
                <div class="schedule-timeline">
                  <div class="time-slot conflict">
                    <span class="time">10:00</span>
                    <div class="event">Unity Keynote</div>
                  </div>
                  <div class="time-slot conflict">
                    <span class="time">10:30</span>
                    <div class="event">EA Games Meeting</div>
                  </div>
                  <div class="time-slot gap">
                    <span class="time">11:00</span>
                    <div class="event empty">Empty</div>
                  </div>
                  <div class="time-slot">
                    <span class="time">14:00</span>
                    <div class="event">Indie Showcase</div>
                  </div>
                  <div class="time-slot gap">
                    <span class="time">15:00</span>
                    <div class="event empty">Empty</div>
                  </div>
                </div>
              </div>
              
              <div class="schedule-ai-magic">
                <button class="ai-optimize-btn" onclick="window.featureShowcase.runScheduleOptimization()">
                  <span class="optimize-icon">✨</span>
                  <span>Optimize with AI</span>
                </button>
              </div>
              
              <div class="schedule-after" style="opacity: 0">
                <h4>AI Optimized</h4>
                <div class="schedule-timeline">
                  <div class="time-slot optimized">
                    <span class="time">09:30</span>
                    <div class="event">EA Games Meeting</div>
                    <span class="benefit">+30min prep time</span>
                  </div>
                  <div class="time-slot optimized">
                    <span class="time">10:00</span>
                    <div class="event">Unity Keynote</div>
                  </div>
                  <div class="time-slot optimized new">
                    <span class="time">11:00</span>
                    <div class="event">Sarah Chen - Coffee</div>
                    <span class="benefit">95% match</span>
                  </div>
                  <div class="time-slot optimized">
                    <span class="time">14:00</span>
                    <div class="event">Indie Showcase</div>
                  </div>
                  <div class="time-slot optimized new">
                    <span class="time">15:00</span>
                    <div class="event">VR Demo - Hall 7</div>
                    <span class="benefit">High interest</span>
                  </div>
                </div>
                <div class="ai-insights">
                  <p class="insight">✓ Resolved 2 conflicts</p>
                  <p class="insight">✓ Added 2 high-value opportunities</p>
                  <p class="insight">✓ Optimized travel time between venues</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Translation Demo -->
          <div class="ai-demo-section" id="translation">
            <h3>Universal Language</h3>
            <p class="ai-demo-subtitle">Connect without barriers</p>
            
            <div class="translation-demo">
              <div class="language-selector">
                <p>Select your native language:</p>
                <div class="language-grid">
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('en')">🇬🇧 English</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('de')">🇩🇪 Deutsch</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('fr')">🇫🇷 Français</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('es')">🇪🇸 Español</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('ja')">🇯🇵 日本語</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('zh')">🇨🇳 中文</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('ko')">🇰🇷 한국어</button>
                  <button class="lang-option" onclick="window.featureShowcase.selectLanguage('pt')">🇧🇷 Português</button>
                </div>
              </div>
              
              <div class="translation-result" style="display: none">
                <div class="translation-example">
                  <div class="original-text">
                    <span class="speaker">Marcus (German Speaker):</span>
                    <p>"Hallo! Ich bin von Ubisoft. Möchten Sie über unsere neue Gaming-Engine sprechen?"</p>
                  </div>
                  <div class="translated-text">
                    <span class="translated-label">Translated to <span class="selected-lang">English</span>:</span>
                    <p class="translation">"Hello! I'm from Ubisoft. Would you like to talk about our new gaming engine?"</p>
                  </div>
                </div>
                <button class="translation-action">Enable Real-time Translation</button>
              </div>
            </div>
          </div>

          <!-- Automatic Notes Demo -->
          <div class="ai-demo-section" id="notes">
            <h3>Intelligent Notes</h3>
            <p class="ai-demo-subtitle">Never miss a key insight</p>
            
            <div class="notes-demo">
              <div class="session-example">
                <h4>Unity Keynote - John Riccitiello</h4>
                <p class="session-time">August 21, 2025 • 10:00 AM</p>
              </div>
              
              <div class="ai-notes-output">
                <h5>AI-Generated Summary</h5>
                <div class="note-content">
                  <p><strong>Key Announcements:</strong></p>
                  <ul>
                    <li>Unity 2025.3 LTS launching with 40% performance improvements</li>
                    <li>New AI-powered asset generation pipeline</li>
                    <li>Partnership with Microsoft for cloud rendering</li>
                  </ul>
                  
                  <p><strong>Action Items for You:</strong></p>
                  <ul>
                    <li>Schedule demo of new AI tools at Unity booth (Hall 6)</li>
                    <li>Connect with Unity rep Sarah Chen (matched as 95% relevant)</li>
                    <li>Download beta SDK before September 1</li>
                  </ul>
                  
                  <p><strong>Relevant to Your Projects:</strong></p>
                  <ul>
                    <li>New multiplayer framework aligns with your "Project Phoenix"</li>
                    <li>Performance improvements solve your current bottlenecks</li>
                  </ul>
                </div>
                
                <div class="note-actions">
                  <button class="note-action">Export to Notion</button>
                  <button class="note-action">Share with Team</button>
                  <button class="note-action">Add to Calendar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const showcase = document.querySelector('.feature-showcase');
    showcase.classList.add('active');
    this.isOpen = true;
    
    // Show grid by default
    this.backToGrid();
    
    if (window.haptic) {
      window.haptic.impact('medium');
    }
  }

  close() {
    const showcase = document.querySelector('.feature-showcase');
    showcase.classList.remove('active');
    this.isOpen = false;
    
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  startApp() {
    // Close the showcase
    this.close();
    
    // Check if we're still on hero landing
    const heroLanding = document.getElementById('hero-landing');
    if (heroLanding && heroLanding.style.display !== 'none') {
      // Use the hero landing's startApp method
      if (window.heroLanding && window.heroLanding.startApp) {
        window.heroLanding.startApp();
      } else if (window.startApp) {
        window.startApp();
      }
    }
    
    // Make sure the app is visible
    const app = document.getElementById('app');
    if (app) {
      app.style.display = 'block';
    }
  }

  openFeature(featureKey) {
    this.currentFeature = featureKey;
    
    // Hide grid
    const grid = document.querySelector('.showcase-panel');
    grid.style.display = 'none';
    
    // Show feature panel
    const panels = document.querySelectorAll('.feature-detail-panel');
    panels.forEach(panel => panel.style.display = 'none');
    
    const targetPanel = document.getElementById(`${featureKey}-panel`);
    if (targetPanel) {
      targetPanel.style.display = 'block';
      targetPanel.style.animation = 'slideIn 300ms ease-out';
    }
    
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  backToGrid() {
    // Show grid
    const grid = document.querySelector('.showcase-panel');
    grid.style.display = 'block';
    
    // Hide all feature panels
    const panels = document.querySelectorAll('.feature-detail-panel');
    panels.forEach(panel => panel.style.display = 'none');
    
    this.currentFeature = null;
  }

  createEvent() {
    this.showToast('🎉 Event created successfully! Check your dashboard.');
    setTimeout(() => this.close(), 1500);
  }

  previewEvent() {
    this.showToast('Preview mode activated');
  }

  askAI(topic) {
    const responses = {
      optimize: "I've analyzed your interests and the conference schedule. I recommend attending the AI Summit at 2 PM and the Networking Mixer at 6 PM for maximum value.",
      network: "Based on your profile, you should connect with Sarah Chen (Game Designer) and Marcus Johnson (Publisher). They align perfectly with your goals.",
      summary: "Key takeaways from today: 1) AI is transforming game development, 2) Cross-platform play is now essential, 3) Indie games are seeing 40% YoY growth."
    };
    
    this.addAIResponse(responses[topic] || "I'm processing your request...");
  }

  sendToAI(event) {
    event.preventDefault();
    const input = event.target.querySelector('.ai-input');
    const message = input.value.trim();
    
    if (message) {
      this.addAIResponse(`Processing: "${message}". I'll analyze this and respond shortly...`);
      input.value = '';
    }
  }

  addAIResponse(text) {
    const messagesContainer = document.querySelector('.ai-messages');
    const newMessage = document.createElement('div');
    newMessage.className = 'ai-message assistant';
    newMessage.innerHTML = `
      <div class="ai-avatar">🤖</div>
      <div class="ai-bubble">
        <p>${text}</p>
      </div>
    `;
    
    // Insert before suggestions
    const suggestions = messagesContainer.querySelector('.ai-suggestions');
    messagesContainer.insertBefore(newMessage, suggestions);
    
    // Animate
    newMessage.style.animation = 'fadeInUp 300ms ease-out';
    
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      
      // ESC to close
      if (e.key === 'Escape' && this.isOpen) {
        if (this.currentFeature) {
          this.backToGrid();
        } else {
          this.close();
        }
      }
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'showcase-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // AI Demo Interactions - Jobs/Ive Magic
  runScheduleOptimization() {
    const button = document.querySelector('.ai-optimize-btn');
    const beforeSection = document.querySelector('.schedule-before');
    const afterSection = document.querySelector('.schedule-after');
    
    // Disable button and show animation
    button.disabled = true;
    button.innerHTML = '<span class="optimize-icon spinning">⚡</span><span>Optimizing...</span>';
    
    // Fade out before, fade in after with stagger
    setTimeout(() => {
      beforeSection.style.opacity = '0.3';
      afterSection.style.opacity = '1';
      afterSection.style.animation = 'slideInFromRight 800ms ease-out';
      
      // Stagger animate each time slot
      const slots = afterSection.querySelectorAll('.time-slot');
      slots.forEach((slot, index) => {
        slot.style.animation = `slideInFromRight 600ms ${index * 100}ms ease-out both`;
      });
      
      // Show insights with delay
      setTimeout(() => {
        const insights = afterSection.querySelector('.ai-insights');
        if (insights) {
          insights.style.animation = 'fadeIn 600ms ease-out';
        }
      }, 800);
      
      // Reset button
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<span class="optimize-icon">✨</span><span>Re-optimize</span>';
      }, 1500);
    }, 1000);
    
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  selectLanguage(langCode) {
    const selector = document.querySelector('.language-selector');
    const result = document.querySelector('.translation-result');
    const selectedLangSpan = document.querySelector('.selected-lang');
    const translationText = document.querySelector('.translation');
    
    // Language translations
    const translations = {
      en: { name: 'English', text: 'Hello! I\'m from Ubisoft. Would you like to talk about our new gaming engine?' },
      de: { name: 'German', text: 'Hallo! Ich bin von Ubisoft. Möchten Sie über unsere neue Gaming-Engine sprechen?' },
      fr: { name: 'French', text: 'Bonjour! Je suis d\'Ubisoft. Voulez-vous parler de notre nouveau moteur de jeu?' },
      es: { name: 'Spanish', text: '¡Hola! Soy de Ubisoft. ¿Te gustaría hablar sobre nuestro nuevo motor de juegos?' },
      ja: { name: 'Japanese', text: 'こんにちは！私はUbisoftから来ました。新しいゲームエンジンについて話しませんか？' },
      zh: { name: 'Chinese', text: '你好！我来自育碧。想聊聊我们的新游戏引擎吗？' },
      ko: { name: 'Korean', text: '안녕하세요! 저는 유비소프트에서 왔습니다. 새로운 게임 엔진에 대해 이야기하시겠습니까?' },
      pt: { name: 'Portuguese', text: 'Olá! Sou da Ubisoft. Gostaria de falar sobre nosso novo motor de jogos?' }
    };
    
    // Animate selection
    const buttons = document.querySelectorAll('.lang-option');
    buttons.forEach(btn => {
      btn.classList.remove('selected');
      if (btn.onclick.toString().includes(langCode)) {
        btn.classList.add('selected');
      }
    });
    
    // Show result with animation
    selector.style.animation = 'fadeOut 300ms ease-out';
    setTimeout(() => {
      selector.style.display = 'none';
      result.style.display = 'block';
      result.style.animation = 'fadeIn 500ms ease-out';
      
      if (selectedLangSpan && translations[langCode]) {
        selectedLangSpan.textContent = translations[langCode].name;
        translationText.textContent = translations[langCode].text;
      }
    }, 300);
    
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Command Center Button - Subtle and professional */
      .command-center-btn {
        position: fixed;
        bottom: 290px;
        right: 24px;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        z-index: 996;
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .command-center-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
        transform: scale(1.05);
      }
      
      .command-label {
        font-size: 10px;
        font-weight: 600;
      }
      
      /* Feature Showcase */
      .feature-showcase {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: none;
      }
      
      .feature-showcase.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .showcase-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        cursor: pointer;
      }
      
      .showcase-panel {
        position: relative;
        width: 90%;
        max-width: 1200px;
        max-height: 80vh;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        overflow-y: auto;
        animation: scaleIn 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .showcase-header {
        padding: 32px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
      }
      
      .showcase-title {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .showcase-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
      }
      
      .showcase-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 24px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .showcase-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
      
      /* Feature Grid */
      .showcase-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        padding: 32px;
        align-items: stretch;
      }
      
      @media (max-width: 1024px) {
        .showcase-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 640px) {
        .showcase-grid {
          grid-template-columns: 1fr;
        }
      }
      
      .feature-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 200ms ease;
        display: flex;
        flex-direction: column;
        min-height: 320px;
      }
      
      .feature-card:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 215, 0, 0.3);
      }
      
      .feature-card-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border-radius: 12px;
        padding: 10px;
      }
      
      .feature-card-icon svg,
      .feature-icon-svg {
        width: 100%;
        height: 100%;
        color: white;
        stroke-width: 1.5;
      }
      
      .feature-card-title {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 8px;
      }
      
      .feature-card-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 16px;
        line-height: 1.5;
      }
      
      .feature-card-capabilities {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
        flex: 1; /* Take remaining space */
      }
      
      .capability-tag {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .feature-card-action {
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        margin-top: auto; /* Push to bottom */
      }
      
      .feature-card-action:hover {
        transform: translateX(4px);
      }
      
      /* Feature Detail Panels */
      .feature-detail-panel {
        position: relative;
        width: 90%;
        max-width: 1200px;
        max-height: 80vh;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        overflow-y: auto;
        display: none;
        padding: 32px;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .detail-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 32px;
      }
      
      .detail-header h2 {
        font-size: 28px;
        color: white;
      }
      
      .detail-back {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 20px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .detail-back:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateX(-4px);
      }
      
      /* ML Panel Styles */
      .ml-recommendations {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      
      .ml-section h3 {
        font-size: 20px;
        color: white;
        margin-bottom: 16px;
      }
      
      .ml-matches {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .ml-match-card {
        flex: 1;
        min-width: 280px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
      }
      
      .match-score {
        font-size: 32px;
        font-weight: 700;
        color: #34c759;
        margin-bottom: 12px;
      }
      
      .match-info h4 {
        font-size: 18px;
        color: white;
        margin-bottom: 4px;
      }
      
      .match-info p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .match-reasons {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 16px;
      }
      
      .reason {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .match-connect {
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
      
      /* Event Creation Styles */
      .event-creation-form {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      
      .form-section h3 {
        font-size: 18px;
        color: white;
        margin-bottom: 16px;
      }
      
      .form-input,
      .form-textarea {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .form-textarea {
        min-height: 100px;
        resize: vertical;
      }
      
      .form-row {
        display: flex;
        gap: 12px;
      }
      
      .venue-options {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .venue-option {
        flex: 1;
        min-width: 200px;
        cursor: pointer;
      }
      
      .venue-card {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        transition: all 200ms ease;
      }
      
      .venue-option input {
        display: none;
      }
      
      .venue-option input:checked + .venue-card {
        border-color: #007aff;
        background: rgba(0, 122, 255, 0.1);
      }
      
      .venue-card h4 {
        color: white;
        margin-bottom: 4px;
      }
      
      .venue-card p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .venue-price {
        color: #34c759;
        font-weight: 600;
      }
      
      .feature-toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      
      .toggle-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        cursor: pointer;
        color: white;
        font-size: 14px;
      }
      
      .toggle-option input {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .btn-primary,
      .btn-secondary {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
        color: white;
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      /* Analytics Styles */
      .analytics-dashboard {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      
      .analytics-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .stat-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8px;
      }
      
      .stat-change {
        font-size: 14px;
        font-weight: 600;
      }
      
      .stat-change.positive {
        color: #34c759;
      }
      
      .analytics-chart h3 {
        font-size: 18px;
        color: white;
        margin-bottom: 16px;
      }
      
      .chart-container {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        padding: 20px;
      }
      
      .chart-bars {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        height: 200px;
        margin-bottom: 12px;
      }
      
      .chart-bar {
        flex: 1;
        background: linear-gradient(180deg, #007aff 0%, #5856d6 100%);
        border-radius: 4px 4px 0 0;
        transition: all 200ms ease;
      }
      
      .chart-bar:hover {
        opacity: 0.8;
      }
      
      .chart-labels {
        display: flex;
        justify-content: space-between;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
      
      .heatmap-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 2px;
        margin-bottom: 12px;
      }
      
      .heatmap-cell {
        aspect-ratio: 1;
        border-radius: 2px;
      }
      
      .connection-graph {
        position: relative;
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .graph-center {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        z-index: 3;
      }
      
      .graph-ring {
        position: absolute;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ring-1 {
        width: 150px;
        height: 150px;
      }
      
      .ring-2 {
        width: 220px;
        height: 220px;
      }
      
      .ring-3 {
        width: 290px;
        height: 290px;
      }
      
      .graph-node {
        position: absolute;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        font-size: 12px;
        color: white;
      }
      
      .export-report {
        padding: 12px 24px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        margin-top: 24px;
      }
      
      /* AI Assistant Styles */
      .ai-assistant {
        display: flex;
        gap: 32px;
      }
      
      .ai-chat-interface {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        height: 500px;
      }
      
      .ai-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }
      
      .ai-message {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .ai-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
      
      .ai-bubble {
        flex: 1;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        color: white;
      }
      
      .ai-bubble p {
        margin-bottom: 8px;
      }
      
      .ai-bubble ul {
        margin: 12px 0;
        padding-left: 20px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .ai-suggestions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }
      
      .ai-suggestion {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .ai-suggestion:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
      
      .ai-input-form {
        display: flex;
        gap: 8px;
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .ai-input {
        flex: 1;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: white;
        font-size: 14px;
      }
      
      .ai-send {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ai-features {
        width: 300px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .ai-feature-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
      }
      
      .ai-feature-card h4 {
        font-size: 16px;
        color: white;
        margin-bottom: 8px;
      }
      
      .ai-feature-card p {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 12px;
        line-height: 1.5;
      }
      
      .ai-feature-btn {
        width: 100%;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      
      /* Footer */
      .showcase-footer {
        padding: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        text-align: center;
      }
      
      .keyboard-hint {
        color: rgba(255, 255, 255, 0.5);
        font-size: 13px;
      }
      
      .keyboard-hint kbd {
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        font-family: monospace;
      }
      
      /* Toast */
      .showcase-toast {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 24px;
        background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 2001;
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .showcase-toast.active {
        transform: translateX(-50%) translateY(0);
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* AI Demo Sections - Jobs/Ive Inspired */
      .ai-demo-section {
        margin-bottom: 48px;
        padding: 32px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .ai-demo-section h3 {
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .ai-demo-subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 32px;
      }
      
      /* Schedule Visualization */
      .schedule-visualization {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 32px;
        align-items: center;
      }
      
      .schedule-before,
      .schedule-after {
        transition: opacity 600ms ease;
      }
      
      .schedule-before h4,
      .schedule-after h4 {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 16px;
      }
      
      .schedule-timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .time-slot {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        transition: all 300ms ease;
      }
      
      .time-slot.conflict {
        border-color: rgba(255, 59, 48, 0.5);
        background: rgba(255, 59, 48, 0.05);
      }
      
      .time-slot.gap .event {
        opacity: 0.3;
      }
      
      .time-slot.optimized {
        border-color: rgba(52, 199, 89, 0.5);
        background: rgba(52, 199, 89, 0.05);
      }
      
      .time-slot.new {
        border-color: rgba(0, 122, 255, 0.5);
        background: rgba(0, 122, 255, 0.05);
      }
      
      .time {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
        min-width: 45px;
      }
      
      .event {
        flex: 1;
        font-size: 14px;
        color: white;
      }
      
      .benefit {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        color: rgba(52, 199, 89, 0.8);
        font-weight: 600;
      }
      
      .schedule-ai-magic {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ai-optimize-btn {
        padding: 16px 24px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 16px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 8px 32px rgba(0, 122, 255, 0.3);
      }
      
      .ai-optimize-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(0, 122, 255, 0.4);
      }
      
      .ai-optimize-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .optimize-icon {
        font-size: 20px;
        display: inline-block;
      }
      
      .optimize-icon.spinning {
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .ai-insights {
        margin-top: 24px;
        padding: 16px;
        background: rgba(52, 199, 89, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(52, 199, 89, 0.2);
      }
      
      .insight {
        color: rgba(52, 199, 89, 0.9);
        font-size: 14px;
        margin-bottom: 8px;
      }
      
      .insight:last-child {
        margin-bottom: 0;
      }
      
      /* Translation Demo */
      .language-selector p {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16px;
      }
      
      .language-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      
      .lang-option {
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .lang-option:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .lang-option.selected {
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border-color: transparent;
      }
      
      .translation-example {
        padding: 24px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        margin-bottom: 24px;
      }
      
      .original-text,
      .translated-text {
        margin-bottom: 16px;
      }
      
      .speaker,
      .translated-label {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 8px;
      }
      
      .original-text p,
      .translation {
        font-size: 16px;
        line-height: 1.6;
        color: white;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
      }
      
      .translation {
        background: rgba(0, 122, 255, 0.1);
        border: 1px solid rgba(0, 122, 255, 0.2);
      }
      
      .translation-action {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      
      /* Notes Demo */
      .session-example {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        margin-bottom: 24px;
      }
      
      .session-example h4 {
        font-size: 18px;
        color: white;
        margin-bottom: 4px;
      }
      
      .session-time {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .ai-notes-output {
        padding: 24px;
        background: linear-gradient(135deg, rgba(88, 86, 214, 0.05) 0%, rgba(0, 122, 255, 0.05) 100%);
        border-radius: 16px;
        border: 1px solid rgba(0, 122, 255, 0.2);
      }
      
      .ai-notes-output h5 {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(0, 122, 255, 0.8);
        margin-bottom: 16px;
      }
      
      .note-content {
        color: white;
        line-height: 1.6;
      }
      
      .note-content p {
        margin-bottom: 12px;
      }
      
      .note-content strong {
        color: rgba(0, 122, 255, 0.9);
      }
      
      .note-content ul {
        margin: 0 0 16px 20px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .note-content li {
        margin-bottom: 8px;
      }
      
      .note-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      .note-action {
        flex: 1;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .note-action:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
      }
      
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(0, 122, 255, 0);
        }
        50% {
          box-shadow: 0 0 40px 10px rgba(0, 122, 255, 0.3);
        }
      }
      
      /* Mobile */
      @media (max-width: 768px) {
        .showcase-panel,
        .feature-detail-panel {
          width: 95%;
          max-height: 90vh;
        }
        
        .showcase-grid {
          grid-template-columns: 1fr;
          padding: 20px;
        }
        
        .ai-assistant {
          flex-direction: column;
        }
        
        .ai-features {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  getFallbackIcon(iconName) {
    const icons = {
      ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      analytics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
      video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>'
    };
    return icons[iconName] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>';
  }
}

// Initialize feature showcase
window.featureShowcase = new FeatureShowcase();

export default window.featureShowcase;