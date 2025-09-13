/**
 * Smart Location-Based Networking
 * Jobs/Ive-inspired proximity matchmaking with calendar integration
 */

import { getIcon } from './icon-gallery.js';

class ProximityNetworking {
  constructor() {
    this.isActive = false;
    this.openSlots = new Map();
    this.nearbyProfessionals = [];
    this.currentLocation = null;
    this.matchmakingActive = false;
    this.ftueShown = localStorage.getItem('proximity_ftue_seen') !== 'true';
    
    this.venues = [
      { id: 'hall7', name: 'Hall 7', lat: 50.946, lng: 6.944, radius: 200 },
      { id: 'business', name: 'Business Area', lat: 50.947, lng: 6.945, radius: 150 },
      { id: 'food', name: 'Food Court', lat: 50.945, lng: 6.946, radius: 100 },
      { id: 'outdoor', name: 'Outdoor Plaza', lat: 50.948, lng: 6.943, radius: 250 }
    ];
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.createUI();
    
    // Show FTUE on first interaction
    if (this.ftueShown === false) {
      setTimeout(() => this.showFTUE(), 1000);
    }
  }

  createUI() {
    // Floating Smart Network Button
    const smartBtn = document.createElement('button');
    smartBtn.className = 'smart-network-btn';
    smartBtn.innerHTML = `
      <span class="smart-network-icon">
        ${getIcon('users', 24, 'network-icon')}
      </span>
      <span class="smart-network-pulse"></span>
    `;
    smartBtn.onclick = () => this.toggle();
    document.body.appendChild(smartBtn);

    // Main Panel
    const panel = document.createElement('div');
    panel.className = 'proximity-panel';
    panel.innerHTML = `
      <div class="proximity-backdrop" onclick="window.proximityNetworking.close()"></div>
      <div class="proximity-container">
        <div class="proximity-header">
          <h2>Smart Networking</h2>
          <p>AI-powered professional matchmaking</p>
          <button class="proximity-close" onclick="window.proximityNetworking.close()">×</button>
        </div>

        <!-- Calendar Slot Marking -->
        <div class="calendar-slots-section">
          <h3>Mark Your Open Time</h3>
          <p class="section-subtitle">Let AI find the perfect networking opportunity</p>
          
          <div class="time-slots">
            <div class="time-slot" data-time="11:00">
              <span class="slot-time">11:00 AM</span>
              <span class="slot-status">Available</span>
              <button class="slot-mark-btn" onclick="window.proximityNetworking.markSlotOpen('11:00')">
                Mark as Open
              </button>
            </div>
            
            <div class="time-slot" data-time="14:00">
              <span class="slot-time">2:00 PM</span>
              <span class="slot-status">Available</span>
              <button class="slot-mark-btn" onclick="window.proximityNetworking.markSlotOpen('14:00')">
                Mark as Open
              </button>
            </div>
            
            <div class="time-slot" data-time="16:00">
              <span class="slot-time">4:00 PM</span>
              <span class="slot-status">Available</span>
              <button class="slot-mark-btn" onclick="window.proximityNetworking.markSlotOpen('16:00')">
                Mark as Open
              </button>
            </div>
          </div>
        </div>

        <!-- Location Detection -->
        <div class="location-section">
          <h3>Your Current Location</h3>
          <div class="location-card">
            <div class="location-icon">${getIcon('mapPin', 24, 'location-svg')}</div>
            <div class="location-info">
              <span class="location-name">Detecting...</span>
              <span class="location-accuracy">Getting GPS signal</span>
            </div>
            <button class="location-refresh" onclick="window.proximityNetworking.detectLocation()">
              Refresh
            </button>
          </div>
        </div>

        <!-- Proximity Matchmaking Visualization -->
        <div class="matchmaking-section" style="display: none;">
          <h3>Finding Your Perfect Match</h3>
          <div class="matchmaking-visualization">
            <div class="radar-container">
              <div class="radar-sweep"></div>
              <div class="radar-rings">
                <div class="radar-ring ring-1"></div>
                <div class="radar-ring ring-2"></div>
                <div class="radar-ring ring-3"></div>
              </div>
              <div class="radar-center">You</div>
              <div class="radar-dots"></div>
            </div>
            
            <div class="matching-stats">
              <div class="stat">
                <span class="stat-value" id="nearby-count">0</span>
                <span class="stat-label">Nearby Professionals</span>
              </div>
              <div class="stat">
                <span class="stat-value" id="match-score">0%</span>
                <span class="stat-label">Best Match Score</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Match Results -->
        <div class="match-results" style="display: none;">
          <h3>Perfect Match Found!</h3>
          <div class="match-card featured">
            <div class="match-score-badge">98%</div>
            <div class="match-profile">
              <div class="match-avatar">SC</div>
              <div class="match-info">
                <h4>Sarah Chen</h4>
                <p>Game Designer at Ubisoft</p>
                <div class="match-tags">
                  <span class="tag">Unity Expert</span>
                  <span class="tag">AI/ML</span>
                  <span class="tag">Multiplayer</span>
                </div>
              </div>
            </div>
            
            <div class="match-reasons">
              <h5>Why you should meet:</h5>
              <ul>
                <li>Working on similar AI game mechanics</li>
                <li>Looking for Unity collaboration</li>
                <li>3 mutual connections</li>
                <li>Currently 50m away at Hall 7</li>
              </ul>
            </div>
            
            <div class="match-suggestion">
              <div class="suggestion-icon">☕</div>
              <div class="suggestion-text">
                <strong>Suggested Meeting</strong>
                <p>Coffee at Food Court • 11:00 AM</p>
              </div>
            </div>
            
            <div class="match-actions">
              <button class="btn-connect" onclick="window.proximityNetworking.sendConnection()">
                Send Connection Request
              </button>
              <button class="btn-schedule" onclick="window.proximityNetworking.scheduleMeeting()">
                Schedule Coffee Chat
              </button>
            </div>
          </div>

          <!-- Other Matches -->
          <h4>Other Great Matches Nearby</h4>
          <div class="other-matches">
            <div class="match-card mini">
              <div class="match-score-badge">89%</div>
              <div class="match-mini-info">
                <strong>Marcus Johnson</strong>
                <span>Publisher at EA • 100m away</span>
              </div>
            </div>
            
            <div class="match-card mini">
              <div class="match-score-badge">85%</div>
              <div class="match-mini-info">
                <strong>Emma Wilson</strong>
                <span>Indie Dev • 75m away</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  }

  showFTUE() {
    const ftue = document.createElement('div');
    ftue.className = 'proximity-ftue';
    ftue.innerHTML = `
      <div class="ftue-backdrop"></div>
      <div class="ftue-container">
        <div class="ftue-steps">
          <!-- Step 1: Introduction -->
          <div class="ftue-step active" data-step="1">
            <div class="ftue-icon">🎯</div>
            <h2>Smart Location Networking</h2>
            <p>Let AI find the perfect person for you to meet, right when you have time</p>
            <div class="ftue-demo">
              <div class="demo-phone">
                <div class="demo-screen">
                  <div class="demo-notification">
                    <span class="notif-icon">💡</span>
                    <div class="notif-text">
                      <strong>Perfect Match Nearby!</strong>
                      <span>Sarah Chen is 50m away • 98% match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button class="ftue-next" onclick="window.proximityNetworking.nextFTUEStep()">Next</button>
          </div>

          <!-- Step 2: Mark Calendar Slots -->
          <div class="ftue-step" data-step="2">
            <div class="ftue-icon">📅</div>
            <h2>Mark Your Open Time</h2>
            <p>Tell us when you're free for coffee or quick meetings</p>
            <div class="ftue-demo">
              <div class="demo-calendar">
                <div class="demo-slot">
                  <span>11:00 AM</span>
                  <button class="demo-mark">Mark as Open</button>
                </div>
                <div class="demo-slot marked">
                  <span>2:00 PM</span>
                  <span class="demo-marked">✓ Open for Networking</span>
                </div>
              </div>
            </div>
            <button class="ftue-next" onclick="window.proximityNetworking.nextFTUEStep()">Next</button>
          </div>

          <!-- Step 3: AI Matchmaking -->
          <div class="ftue-step" data-step="3">
            <div class="ftue-icon">🤖</div>
            <h2>AI Finds Your Match</h2>
            <p>Our AI analyzes interests, goals, and location to find perfect matches</p>
            <div class="ftue-demo">
              <div class="demo-matching">
                <div class="matching-animation">
                  <div class="profile-1">You</div>
                  <div class="matching-lines">
                    <div class="line line-1"></div>
                    <div class="line line-2"></div>
                    <div class="line line-3"></div>
                  </div>
                  <div class="profile-2">Sarah</div>
                </div>
                <div class="matching-factors">
                  <span class="factor">✓ Similar interests</span>
                  <span class="factor">✓ Complementary skills</span>
                  <span class="factor">✓ Perfect timing</span>
                </div>
              </div>
            </div>
            <button class="ftue-next" onclick="window.proximityNetworking.nextFTUEStep()">Next</button>
          </div>

          <!-- Step 4: Proximity Alert -->
          <div class="ftue-step" data-step="4">
            <div class="ftue-icon">📍</div>
            <h2>Real-Time Proximity</h2>
            <p>Get notified when your perfect match is nearby</p>
            <div class="ftue-demo">
              <div class="demo-map">
                <div class="map-radar">
                  <div class="radar-pulse"></div>
                  <div class="you-dot">You</div>
                  <div class="match-dot">Match<br>50m</div>
                </div>
              </div>
            </div>
            <button class="ftue-start" onclick="window.proximityNetworking.completeFTUE()">
              Start Smart Networking
            </button>
          </div>
        </div>

        <div class="ftue-dots">
          <span class="dot active" data-dot="1"></span>
          <span class="dot" data-dot="2"></span>
          <span class="dot" data-dot="3"></span>
          <span class="dot" data-dot="4"></span>
        </div>
      </div>
    `;
    document.body.appendChild(ftue);

    // Auto-play the first step animation
    setTimeout(() => {
      const notification = ftue.querySelector('.demo-notification');
      if (notification) {
        notification.style.animation = 'slideInFromTop 600ms ease-out';
      }
    }, 500);
  }

  nextFTUEStep() {
    const ftue = document.querySelector('.proximity-ftue');
    if (!ftue) return;

    const currentStep = ftue.querySelector('.ftue-step.active');
    const currentNum = parseInt(currentStep.dataset.step);
    const nextNum = currentNum + 1;
    const nextStep = ftue.querySelector(`.ftue-step[data-step="${nextNum}"]`);

    if (nextStep) {
      // Update steps
      currentStep.classList.remove('active');
      nextStep.classList.add('active');

      // Update dots
      ftue.querySelectorAll('.dot').forEach(dot => {
        dot.classList.remove('active');
        if (parseInt(dot.dataset.dot) <= nextNum) {
          dot.classList.add('active');
        }
      });

      // Trigger step-specific animations
      this.animateFTUEStep(nextNum);
    }

    if (window.haptic) {
      window.haptic.selection();
    }
  }

  animateFTUEStep(step) {
    const ftue = document.querySelector('.proximity-ftue');
    
    switch(step) {
      case 2:
        // Animate calendar slot marking
        setTimeout(() => {
          const demoSlot = ftue.querySelector('.demo-slot:not(.marked)');
          if (demoSlot) {
            demoSlot.classList.add('marking');
            setTimeout(() => {
              demoSlot.classList.add('marked');
              demoSlot.classList.remove('marking');
            }, 600);
          }
        }, 500);
        break;
        
      case 3:
        // Animate AI matching
        setTimeout(() => {
          const lines = ftue.querySelectorAll('.matching-lines .line');
          lines.forEach((line, index) => {
            setTimeout(() => {
              line.style.animation = 'pulse 1s ease-in-out infinite';
            }, index * 200);
          });
        }, 500);
        break;
        
      case 4:
        // Animate proximity radar
        const radar = ftue.querySelector('.radar-pulse');
        if (radar) {
          radar.style.animation = 'radarPulse 2s ease-out infinite';
        }
        break;
    }
  }

  completeFTUE() {
    localStorage.setItem('proximity_ftue_seen', 'true');
    const ftue = document.querySelector('.proximity-ftue');
    if (ftue) {
      ftue.style.animation = 'fadeOut 300ms ease-out';
      setTimeout(() => ftue.remove(), 300);
    }
    
    // Open the main panel
    this.open();
    
    // Start demo
    setTimeout(() => this.startDemo(), 500);
  }

  markSlotOpen(time) {
    const slot = document.querySelector(`.time-slot[data-time="${time}"]`);
    if (!slot) return;

    // Mark slot as open
    slot.classList.add('marked-open');
    const btn = slot.querySelector('.slot-mark-btn');
    btn.textContent = '✓ Open for Networking';
    btn.disabled = true;

    // Store open slot
    this.openSlots.set(time, {
      time: time,
      date: 'August 21, 2025',
      status: 'open'
    });

    // Show matchmaking after marking slot
    if (this.openSlots.size === 1) {
      setTimeout(() => this.startMatchmaking(), 800);
    }

    // Haptic feedback
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  detectLocation() {
    const locationCard = document.querySelector('.location-card');
    const locationName = locationCard.querySelector('.location-name');
    const locationAccuracy = locationCard.querySelector('.location-accuracy');

    // Simulate location detection
    locationName.textContent = 'Detecting...';
    locationAccuracy.textContent = 'Getting GPS signal';
    locationCard.classList.add('detecting');

    setTimeout(() => {
      // Pick a random venue
      const venue = this.venues[Math.floor(Math.random() * this.venues.length)];
      this.currentLocation = venue;

      locationName.textContent = venue.name;
      locationAccuracy.textContent = '±5m accuracy';
      locationCard.classList.remove('detecting');
      locationCard.classList.add('detected');

      // Start finding nearby professionals
      this.findNearbyProfessionals();
    }, 1500);
  }

  findNearbyProfessionals() {
    // Simulate finding nearby professionals
    this.nearbyProfessionals = [
      { id: 1, name: 'Sarah Chen', role: 'Game Designer', company: 'Ubisoft', distance: 50, score: 98 },
      { id: 2, name: 'Marcus Johnson', role: 'Publisher', company: 'EA Games', distance: 100, score: 89 },
      { id: 3, name: 'Emma Wilson', role: 'Indie Developer', company: 'Pixel Dreams', distance: 75, score: 85 },
      { id: 4, name: 'Alex Kumar', role: 'Investor', company: 'GameVentures', distance: 200, score: 76 },
      { id: 5, name: 'Lisa Park', role: 'Artist', company: 'Riot Games', distance: 150, score: 82 }
    ];

    // Update radar visualization
    this.updateRadar();
  }

  updateRadar() {
    const dotsContainer = document.querySelector('.radar-dots');
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Add dots for nearby professionals
    this.nearbyProfessionals.forEach((prof, index) => {
      const angle = (index / this.nearbyProfessionals.length) * 2 * Math.PI;
      const distance = Math.min(prof.distance / 250, 0.9); // Normalize to radar size
      const x = 50 + (distance * 40 * Math.cos(angle));
      const y = 50 + (distance * 40 * Math.sin(angle));

      const dot = document.createElement('div');
      dot.className = 'radar-dot';
      dot.style.left = `${x}%`;
      dot.style.top = `${y}%`;
      dot.style.animationDelay = `${index * 100}ms`;
      dot.title = `${prof.name} - ${prof.distance}m away`;
      
      if (prof.score > 90) {
        dot.classList.add('high-match');
      }
      
      dotsContainer.appendChild(dot);
    });

    // Update stats
    document.getElementById('nearby-count').textContent = this.nearbyProfessionals.length;
    document.getElementById('match-score').textContent = '98%';
  }

  startMatchmaking() {
    const matchmakingSection = document.querySelector('.matchmaking-section');
    matchmakingSection.style.display = 'block';
    matchmakingSection.style.animation = 'fadeIn 500ms ease-out';

    // Detect location automatically
    this.detectLocation();

    // Animate radar sweep
    const sweep = document.querySelector('.radar-sweep');
    sweep.style.animation = 'radarSweep 2s linear infinite';

    // Show results after animation
    setTimeout(() => {
      this.showMatchResults();
    }, 3000);
  }

  showMatchResults() {
    const resultsSection = document.querySelector('.match-results');
    resultsSection.style.display = 'block';
    resultsSection.style.animation = 'slideInFromBottom 600ms ease-out';

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Haptic celebration
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  sendConnection() {
    this.showToast('Connection request sent to Sarah Chen!');
    
    // Update button
    const btn = event.target;
    btn.textContent = '✓ Request Sent';
    btn.disabled = true;
    btn.classList.add('sent');
  }

  scheduleMeeting() {
    // Add to calendar
    const meeting = {
      title: 'Coffee with Sarah Chen',
      location: 'Food Court',
      time: '11:00 AM',
      date: 'August 21, 2025'
    };

    // Show confirmation
    this.showToast('Meeting scheduled! Added to your calendar.');
    
    // Update UI
    const btn = event.target;
    btn.textContent = '✓ Scheduled';
    btn.disabled = true;
    btn.classList.add('scheduled');

    // Close panel after success
    setTimeout(() => this.close(), 2000);
  }

  startDemo() {
    // Auto-mark a slot
    setTimeout(() => {
      this.markSlotOpen('11:00');
    }, 1000);
  }

  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const panel = document.querySelector('.proximity-panel');
    panel.classList.add('active');
    this.isActive = true;

    if (window.haptic) {
      window.haptic.impact('medium');
    }
  }

  close() {
    const panel = document.querySelector('.proximity-panel');
    panel.classList.remove('active');
    this.isActive = false;

    if (window.haptic) {
      window.haptic.impact('light');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'proximity-toast';
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

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Smart Network Button */
      .smart-network-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        border-radius: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        z-index: 995;
        transition: all 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      @media (max-width: 768px) {
        .smart-network-btn {
          bottom: 80px; /* Account for mobile navigation */
          right: 16px;
          width: 48px;
          height: 48px;
        }
      }
      
      .smart-network-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
      }
      
      .smart-network-icon {
        color: white;
        font-size: 24px;
        z-index: 2;
      }
      
      .smart-network-icon svg {
        width: 24px;
        height: 24px;
      }
      
      .smart-network-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        animation: pulse-ring 2s infinite;
      }
      
      /* Proximity Panel */
      .proximity-panel {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: none;
      }
      
      .proximity-panel.active {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .proximity-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
      }
      
      .proximity-container {
        position: relative;
        width: 90%;
        max-width: 900px;
        max-height: 85vh;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        overflow-y: auto;
        animation: scaleIn 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .proximity-header {
        padding: 32px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .proximity-header h2 {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }
      
      .proximity-header p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
      }
      
      .proximity-close {
        position: absolute;
        top: 24px;
        right: 24px;
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
      
      .proximity-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
      
      /* Calendar Slots Section */
      .calendar-slots-section {
        padding: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .calendar-slots-section h3 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 8px;
      }
      
      .section-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 24px;
      }
      
      .time-slots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .time-slot {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: all 200ms ease;
      }
      
      .time-slot.marked-open {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      .slot-time {
        font-size: 18px;
        font-weight: 600;
        color: white;
      }
      
      .slot-status {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .slot-mark-btn {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .slot-mark-btn:hover:not(:disabled) {
        background: rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.4);
        transform: translateY(-1px);
      }
      
      .slot-mark-btn:disabled {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
        cursor: default;
      }
      
      /* Location Section */
      .location-section {
        padding: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .location-section h3 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 16px;
      }
      
      .location-card {
        padding: 20px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .location-card.detecting {
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .location-card.detected {
        border-color: rgba(16, 185, 129, 0.3);
        background: rgba(16, 185, 129, 0.05);
      }
      
      .location-icon {
        font-size: 32px;
      }
      
      .location-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .location-name {
        font-size: 16px;
        font-weight: 600;
        color: white;
      }
      
      .location-accuracy {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
      }
      
      .location-refresh {
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        cursor: pointer;
      }
      
      /* Matchmaking Visualization */
      .matchmaking-section {
        padding: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .matchmaking-section h3 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 24px;
        text-align: center;
      }
      
      .matchmaking-visualization {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 48px;
        align-items: center;
      }
      
      .radar-container {
        position: relative;
        width: 300px;
        height: 300px;
        margin: 0 auto;
      }
      
      .radar-sweep {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          rgba(16, 185, 129, 0.3) 30deg,
          transparent 60deg
        );
        opacity: 0.8;
      }
      
      @keyframes radarSweep {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .radar-rings {
        position: absolute;
        inset: 0;
      }
      
      .radar-ring {
        position: absolute;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 50%;
      }
      
      .ring-1 {
        inset: 30%;
      }
      
      .ring-2 {
        inset: 15%;
      }
      
      .ring-3 {
        inset: 0;
      }
      
      .radar-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        z-index: 10;
      }
      
      .radar-dots {
        position: absolute;
        inset: 0;
      }
      
      .radar-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        animation: fadeInOut 2s ease-in-out infinite;
      }
      
      .radar-dot.high-match {
        background: #fbbf24;
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
      }
      
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      
      .matching-stats {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .stat {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #10b981;
      }
      
      .stat-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
      }
      
      /* Match Results */
      .match-results {
        padding: 32px;
      }
      
      .match-results h3 {
        font-size: 24px;
        font-weight: 600;
        color: white;
        margin-bottom: 24px;
        text-align: center;
      }
      
      .match-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        position: relative;
        margin-bottom: 24px;
      }
      
      .match-card.featured {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
        border-color: rgba(16, 185, 129, 0.2);
      }
      
      .match-score-badge {
        position: absolute;
        top: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .match-profile {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }
      
      .match-avatar {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #6b7bff, #ec4899);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 20px;
      }
      
      .match-info h4 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 4px;
      }
      
      .match-info p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .match-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .match-tags .tag {
        padding: 4px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }
      
      .match-reasons {
        margin-bottom: 20px;
      }
      
      .match-reasons h5 {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 12px;
      }
      
      .match-reasons ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .match-reasons li {
        padding: 8px 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        padding-left: 20px;
        position: relative;
      }
      
      .match-reasons li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #10b981;
      }
      
      .match-suggestion {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: rgba(16, 185, 129, 0.05);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 12px;
        margin-bottom: 20px;
      }
      
      .suggestion-icon {
        font-size: 32px;
      }
      
      .suggestion-text strong {
        display: block;
        color: white;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .suggestion-text p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        margin: 0;
      }
      
      .match-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      .btn-connect,
      .btn-schedule {
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        border: none;
      }
      
      .btn-connect {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
      }
      
      .btn-connect:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
      }
      
      .btn-connect.sent {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
        color: #10b981;
      }
      
      .btn-schedule {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
      }
      
      .btn-schedule:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .btn-schedule.scheduled {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
      
      .match-card.mini {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        margin-bottom: 12px;
      }
      
      .match-card.mini .match-score-badge {
        position: static;
        width: 40px;
        height: 40px;
        font-size: 14px;
      }
      
      .match-mini-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .match-mini-info strong {
        color: white;
        font-size: 14px;
      }
      
      .match-mini-info span {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }
      
      .other-matches h4 {
        font-size: 16px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin: 32px 0 16px;
      }
      
      /* FTUE Styles */
      .proximity-ftue {
        position: fixed;
        inset: 0;
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ftue-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
      }
      
      .ftue-container {
        position: relative;
        width: 90%;
        max-width: 500px;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 48px 32px 32px;
        text-align: center;
      }
      
      .ftue-steps {
        position: relative;
        min-height: 400px;
      }
      
      .ftue-step {
        display: none;
        animation: fadeIn 500ms ease-out;
      }
      
      .ftue-step.active {
        display: block;
      }
      
      .ftue-icon {
        font-size: 64px;
        margin-bottom: 24px;
      }
      
      .ftue-step h2 {
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin-bottom: 12px;
      }
      
      .ftue-step p {
        color: rgba(255, 255, 255, 0.6);
        font-size: 16px;
        margin-bottom: 32px;
        line-height: 1.5;
      }
      
      .ftue-demo {
        margin: 32px 0;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .demo-phone {
        width: 240px;
        height: 180px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 16px;
      }
      
      .demo-screen {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .demo-notification {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        animation: slideInFromTop 600ms ease-out forwards;
      }
      
      @keyframes slideInFromTop {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .notif-icon {
        font-size: 24px;
      }
      
      .notif-text {
        text-align: left;
      }
      
      .notif-text strong {
        display: block;
        color: white;
        font-size: 13px;
        margin-bottom: 2px;
      }
      
      .notif-text span {
        color: rgba(255, 255, 255, 0.6);
        font-size: 11px;
      }
      
      .demo-calendar {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .demo-slot {
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .demo-slot span {
        color: white;
        font-size: 14px;
        font-weight: 600;
      }
      
      .demo-mark {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: white;
        font-size: 11px;
        cursor: pointer;
      }
      
      .demo-slot.marked {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      .demo-marked {
        color: #10b981;
        font-size: 12px;
      }
      
      .demo-matching {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      
      .matching-animation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
      }
      
      .profile-1,
      .profile-2 {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
      }
      
      .profile-1 {
        background: linear-gradient(135deg, #6b7bff, #ec4899);
      }
      
      .profile-2 {
        background: linear-gradient(135deg, #10b981, #059669);
      }
      
      .matching-lines {
        position: absolute;
        left: 60px;
        right: 60px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
      }
      
      .line {
        height: 2px;
        background: linear-gradient(90deg, #6b7bff, #10b981);
        opacity: 0.3;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scaleX(1); }
        50% { opacity: 1; transform: scaleX(1.1); }
      }
      
      .matching-factors {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .factor {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
      }
      
      .demo-map {
        width: 200px;
        height: 200px;
        margin: 0 auto;
      }
      
      .map-radar {
        position: relative;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.05), transparent);
        border: 2px solid rgba(16, 185, 129, 0.2);
        border-radius: 50%;
      }
      
      .radar-pulse {
        position: absolute;
        inset: 0;
        border: 2px solid rgba(16, 185, 129, 0.5);
        border-radius: 50%;
        opacity: 0;
      }
      
      @keyframes radarPulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      .you-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #6b7bff, #ec4899);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: 600;
      }
      
      .match-dot {
        position: absolute;
        top: 25%;
        right: 25%;
        width: 40px;
        height: 40px;
        background: #fbbf24;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: black;
        font-size: 9px;
        font-weight: 600;
        text-align: center;
        animation: pulse 2s ease-in-out infinite;
      }
      
      .ftue-next,
      .ftue-start {
        padding: 12px 32px;
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .ftue-next:hover,
      .ftue-start:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      }
      
      .ftue-dots {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 32px;
      }
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 200ms ease;
      }
      
      .dot.active {
        background: #10b981;
        transform: scale(1.2);
      }
      
      /* Toast */
      .proximity-toast {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 12px 24px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 12px;
        color: white;
        font-weight: 600;
        z-index: 3001;
        transition: transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .proximity-toast.active {
        transform: translateX(-50%) translateY(0);
      }
      
      /* Animations */
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
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes slideInFromBottom {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .proximity-container {
          width: 95%;
          max-height: 90vh;
        }
        
        .matchmaking-visualization {
          grid-template-columns: 1fr;
          gap: 32px;
        }
        
        .radar-container {
          width: 250px;
          height: 250px;
        }
        
        .match-actions {
          grid-template-columns: 1fr;
        }
        
        .time-slots {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize proximity networking
window.proximityNetworking = new ProximityNetworking();

export default window.proximityNetworking;