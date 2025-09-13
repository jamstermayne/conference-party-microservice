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
    this.selectedDuration = 4; // Default 4 hours
    this.selectedGranularity = 'precise'; // Default precise
    
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
      <div class="proximity-backdrop"></div>
      <div class="proximity-container">
        <div class="proximity-header">
          <h2>Smart Networking</h2>
          <p>AI-powered professional matchmaking</p>
          <button class="proximity-close">×</button>
        </div>

        <!-- Enhanced Calendar with Side-by-Side View -->
        <div class="calendar-slots-section">
          <h3>Mark Your Open Time</h3>
          <p class="section-subtitle">Let AI find the perfect networking opportunity</p>
          
          <div class="calendar-container">
            <!-- Visual Timeline -->
            <div class="visual-timeline">
              <div class="timeline-header">Today's Schedule</div>
              <div class="timeline-track">
                <div class="timeline-hour" data-hour="9">9 AM</div>
                <div class="timeline-hour" data-hour="10">10 AM</div>
                <div class="timeline-hour" data-hour="11">11 AM</div>
                <div class="timeline-hour" data-hour="12">12 PM</div>
                <div class="timeline-hour" data-hour="13">1 PM</div>
                <div class="timeline-hour" data-hour="14">2 PM</div>
                <div class="timeline-hour" data-hour="15">3 PM</div>
                <div class="timeline-hour" data-hour="16">4 PM</div>
                <div class="timeline-hour" data-hour="17">5 PM</div>
                <div class="timeline-hour" data-hour="18">6 PM</div>
                
                <!-- Visual blocks for existing events -->
                <div class="event-block" style="top: 20%; height: 10%;">
                  <span>Keynote (11-12)</span>
                </div>
                <div class="event-block" style="top: 50%; height: 10%;">
                  <span>Lunch (2-3pm)</span>
                </div>
                
                <!-- Selected slots will appear here -->
                <div class="selected-slots" id="timeline-selected"></div>
              </div>
            </div>
            
            <!-- Time Slot Selection -->
            <div class="slot-selection">
              <div class="time-slots">
                <div class="time-slot" data-time="10:00">
                  <span class="slot-time">10:00 AM</span>
                  <span class="slot-duration">30 min coffee</span>
                  <button class="slot-toggle">
                    <span class="toggle-icon">○</span>
                  </button>
                </div>
                
                <div class="time-slot" data-time="12:30">
                  <span class="slot-time">12:30 PM</span>
                  <span class="slot-duration">45 min meeting</span>
                  <button class="slot-toggle">
                    <span class="toggle-icon">○</span>
                  </button>
                </div>
                
                <div class="time-slot" data-time="15:30">
                  <span class="slot-time">3:30 PM</span>
                  <span class="slot-duration">30 min chat</span>
                  <button class="slot-toggle">
                    <span class="toggle-icon">○</span>
                  </button>
                </div>
                
                <div class="time-slot" data-time="17:00">
                  <span class="slot-time">5:00 PM</span>
                  <span class="slot-duration">60 min dinner</span>
                  <button class="slot-toggle">
                    <span class="toggle-icon">○</span>
                  </button>
                </div>
              </div>
              
              <!-- Submit Button -->
              <div class="calendar-actions">
                <div class="selected-count">
                  <span id="slot-count">0</span> time slots selected
                </div>
                <button class="btn-submit-calendar" disabled>
                  ${getIcon('check', 20)}
                  <span>Submit Availability</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- GPS Sharing Options (Hidden initially) -->
        <div class="gps-sharing-section" style="display: none;">
          <h3>Share Your Location</h3>
          <p class="section-subtitle">Help matches find you at the venue</p>
          
          <div class="gps-options">
            <!-- Duration Options -->
            <div class="option-group">
              <label>How long to share?</label>
              <div class="duration-options">
                <button class="duration-btn" data-duration="1">
                  ${getIcon('clock', 16)}
                  <span>1 Hour</span>
                  <small>Quick meetup</small>
                </button>
                <button class="duration-btn active" data-duration="4">
                  ${getIcon('clock', 16)}
                  <span>4 Hours</span>
                  <small>Half day</small>
                </button>
                <button class="duration-btn" data-duration="8">
                  ${getIcon('clock', 16)}
                  <span>8 Hours</span>
                  <small>Full day</small>
                </button>
              </div>
            </div>
            
            <!-- Granularity Options -->
            <div class="option-group">
              <label>Location precision?</label>
              <div class="granularity-options">
                <button class="granularity-btn active" data-level="precise">
                  ${getIcon('mapPin', 16)}
                  <span>Precise</span>
                  <small>Find me exactly (±5m)</small>
                </button>
                <button class="granularity-btn" data-level="room">
                  ${getIcon('home', 16)}
                  <span>Meeting Room</span>
                  <small>Room level (±50m)</small>
                </button>
                <button class="granularity-btn" data-level="building">
                  ${getIcon('building', 16)}
                  <span>Building</span>
                  <small>General area (±200m)</small>
                </button>
              </div>
            </div>
            
            <!-- Privacy Notice -->
            <div class="privacy-notice">
              ${getIcon('shield', 16)}
              <span>Your location is only shared with confirmed matches during the selected time window</span>
            </div>
            
            <!-- Confirm GPS Sharing -->
            <button class="btn-confirm-gps">
              ${getIcon('navigation', 20)}
              <span>Enable Location Sharing</span>
            </button>
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
            <button class="location-refresh">
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
          <h3>Top 3 Matches Found!</h3>
          <p class="match-subtitle">Choose who you'd like to connect with</p>
          
          <!-- Primary Match -->
          <div class="match-card featured" data-match-id="1">
            <div class="match-score-badge">98%</div>
            <div class="match-profile">
              <div class="match-avatar" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">SC</div>
              <div class="match-info">
                <h4>Sarah Chen</h4>
                <p>VP Marketing Operations at Salesforce</p>
                <div class="match-tags">
                  <span class="tag">Marketing Cloud</span>
                  <span class="tag">CDP</span>
                  <span class="tag">Attribution</span>
                  <span class="tag">Einstein AI</span>
                </div>
              </div>
            </div>
            
            <div class="match-details-grid">
              <div class="match-stat">
                <span class="stat-icon">${getIcon('mapPin', 16)}</span>
                <span>50m away • Hall 7</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('users', 16)}</span>
                <span>3 mutual connections</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('briefcase', 16)}</span>
                <span>8 years experience</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('star', 16)}</span>
                <span>Ship 2 AAA titles</span>
              </div>
            </div>
            
            <div class="match-reasons">
              <h5>Why you match:</h5>
              <ul>
                <li>Both implementing AI-driven personalization</li>
                <li>Looking for CDP integration partners</li>
                <li>Shared focus on multi-touch attribution</li>
                <li>Compatible meeting time at 12:30 PM</li>
              </ul>
            </div>
            
            <div class="match-actions">
              <button class="btn-connect" data-name="Sarah Chen">
                ${getIcon('userPlus', 16)}
                <span>Connect</span>
              </button>
              <button class="btn-schedule" data-name="Sarah Chen">
                ${getIcon('calendar', 16)}
                <span>Schedule Meet</span>
              </button>
              <button class="btn-message" data-name="Sarah Chen">
                ${getIcon('messageCircle', 16)}
                <span>Message</span>
              </button>
            </div>
          </div>

          <!-- Second Match -->
          <div class="match-card" data-match-id="2">
            <div class="match-score-badge">89%</div>
            <div class="match-profile">
              <div class="match-avatar" style="background: linear-gradient(135deg, #3b82f6, #06b6d4);">MJ</div>
              <div class="match-info">
                <h4>Marcus Johnson</h4>
                <p>Director of Growth at HubSpot</p>
                <div class="match-tags">
                  <span class="tag">Marketing Automation</span>
                  <span class="tag">Lead Scoring</span>
                  <span class="tag">ABM</span>
                  <span class="tag">Integrations</span>
                </div>
              </div>
            </div>
            
            <div class="match-details-grid">
              <div class="match-stat">
                <span class="stat-icon">${getIcon('mapPin', 16)}</span>
                <span>100m away • HubSpot Booth</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('users', 16)}</span>
                <span>7 mutual connections</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('briefcase', 16)}</span>
                <span>12 years experience</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('trophy', 16)}</span>
                <span>10,000+ customers</span>
              </div>
            </div>
            
            <div class="match-reasons">
              <h5>Why you match:</h5>
              <ul>
                <li>Building unified MarTech stack integrations</li>
                <li>Interest in AI-powered lead scoring</li>
                <li>Looking for ABM platform partners</li>
                <li>Discussing workflow automation solutions</li>
              </ul>
            </div>
            
            <div class="match-actions">
              <button class="btn-connect" data-name="Marcus Johnson">
                ${getIcon('userPlus', 16)}
                <span>Connect</span>
              </button>
              <button class="btn-schedule" data-name="Marcus Johnson">
                ${getIcon('calendar', 16)}
                <span>Schedule Meet</span>
              </button>
              <button class="btn-message" data-name="Marcus Johnson">
                ${getIcon('messageCircle', 16)}
                <span>Message</span>
              </button>
            </div>
          </div>
          
          <!-- Third Match -->
          <div class="match-card" data-match-id="3">
            <div class="match-score-badge">85%</div>
            <div class="match-profile">
              <div class="match-avatar" style="background: linear-gradient(135deg, #10b981, #fbbf24);">EW</div>
              <div class="match-info">
                <h4>Emma Wilson</h4>
                <p>Head of Product at Segment (Twilio)</p>
                <div class="match-tags">
                  <span class="tag">CDP</span>
                  <span class="tag">Data Pipeline</span>
                  <span class="tag">Real-time</span>
                  <span class="tag">APIs</span>
                </div>
              </div>
            </div>
            
            <div class="match-details-grid">
              <div class="match-stat">
                <span class="stat-icon">${getIcon('mapPin', 16)}</span>
                <span>75m away • CDP Pavilion</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('users', 16)}</span>
                <span>2 mutual connections</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('briefcase', 16)}</span>
                <span>5 years experience</span>
              </div>
              <div class="match-stat">
                <span class="stat-icon">${getIcon('award', 16)}</span>
                <span>IGF nominated 2024</span>
              </div>
            </div>
            
            <div class="match-reasons">
              <h5>Why you match:</h5>
              <ul>
                <li>Expert in real-time data pipelines</li>
                <li>Looking for MAP integration partners</li>
                <li>Both using event-driven architecture</li>
                <li>Shared focus on customer data unification</li>
              </ul>
            </div>
            
            <div class="match-actions">
              <button class="btn-connect" data-name="Emma Wilson">
                ${getIcon('userPlus', 16)}
                <span>Connect</span>
              </button>
              <button class="btn-schedule" data-name="Emma Wilson">
                ${getIcon('calendar', 16)}
                <span>Schedule Meet</span>
              </button>
              <button class="btn-message" data-name="Emma Wilson">
                ${getIcon('messageCircle', 16)}
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    
    // Attach event handlers after DOM creation
    this.attachEventHandlers();
  }
  
  attachEventHandlers() {
    console.log('[ProximityNetworking] Attaching event handlers...');
    
    // Close button handler
    const closeBtn = document.querySelector('.proximity-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }
    
    // Backdrop click handler
    const backdrop = document.querySelector('.proximity-backdrop');
    if (backdrop) {
      backdrop.onclick = () => this.close();
    }
    
    // Make entire time slot clickable, not just the button
    document.querySelectorAll('.time-slot').forEach(slot => {
      const time = slot.dataset.time;
      slot.style.cursor = 'pointer';
      slot.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[ProximityNetworking] Slot clicked:', time);
        this.toggleSlot(time);
      };
    });
    
    // Submit calendar button
    const submitBtn = document.querySelector('.btn-submit-calendar');
    if (submitBtn) {
      submitBtn.onclick = (e) => {
        e.preventDefault();
        console.log('[ProximityNetworking] Submit button clicked');
        this.submitCalendar();
      };
    }
    
    // Duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
      const duration = parseInt(btn.dataset.duration);
      btn.onclick = (e) => {
        e.preventDefault();
        console.log('[ProximityNetworking] Duration selected:', duration);
        this.selectDuration(duration);
      };
    });
    
    // Granularity buttons
    document.querySelectorAll('.granularity-btn').forEach(btn => {
      const level = btn.dataset.level;
      btn.onclick = (e) => {
        e.preventDefault();
        console.log('[ProximityNetworking] Granularity selected:', level);
        this.selectGranularity(level);
      };
    });
    
    // GPS confirmation button
    const gpsBtn = document.querySelector('.btn-confirm-gps');
    if (gpsBtn) {
      gpsBtn.onclick = (e) => {
        e.preventDefault();
        this.confirmGPSSharing();
      };
    }
    
    // Location refresh button
    const refreshBtn = document.querySelector('.location-refresh');
    if (refreshBtn) {
      refreshBtn.onclick = (e) => {
        e.preventDefault();
        this.detectLocation();
      };
    }
    
    // Match action buttons - handle all connect/schedule/message buttons
    document.querySelectorAll('.btn-connect').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const name = btn.dataset.name;
        this.sendConnection(name, btn);
      };
    });
    
    document.querySelectorAll('.btn-schedule').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const name = btn.dataset.name;
        this.scheduleMeeting(name, btn);
      };
    });
    
    document.querySelectorAll('.btn-message').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const name = btn.dataset.name;
        this.sendMessage(name, btn);
      };
    });
    
    console.log('[ProximityNetworking] Event handlers attached. Found', document.querySelectorAll('.time-slot').length, 'time slots');
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

  toggleSlot(time) {
    console.log('[ProximityNetworking] toggleSlot called with time:', time);
    const slot = document.querySelector(`.time-slot[data-time="${time}"]`);
    if (!slot) {
      console.error('[ProximityNetworking] Slot not found for time:', time);
      return;
    }

    const isSelected = slot.classList.toggle('selected');
    const toggleIcon = slot.querySelector('.toggle-icon');
    
    if (toggleIcon) {
      if (isSelected) {
        toggleIcon.textContent = '●';
        this.openSlots.set(time, {
          time: time,
          date: 'August 21, 2025',
          status: 'open'
        });
        this.addToTimeline(time);
      } else {
        toggleIcon.textContent = '○';
        this.openSlots.delete(time);
        this.removeFromTimeline(time);
      }
    }

    console.log('[ProximityNetworking] Slot', time, 'is now', isSelected ? 'selected' : 'unselected');
    console.log('[ProximityNetworking] Total selected slots:', this.openSlots.size);

    // Update count and button state
    this.updateCalendarUI();

    // Haptic feedback
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  addToTimeline(time) {
    const timelineSelected = document.getElementById('timeline-selected');
    if (!timelineSelected) return;
    
    const hourMap = {
      '11:30': { top: '25%', height: '5%' },  // 11:30 AM - between existing events
      '13:00': { top: '40%', height: '7.5%' }, // 1:00 PM - after lunch
      '15:00': { top: '60%', height: '5%' },  // 3:00 PM - free slot
      '17:00': { top: '80%', height: '10%' }  // 5:00 PM - after day events
    };
    
    const position = hourMap[time];
    if (position) {
      const block = document.createElement('div');
      block.className = 'selected-block';
      block.dataset.time = time;
      block.style.top = position.top;
      block.style.height = position.height;
      block.innerHTML = `<span>Available</span>`;
      timelineSelected.appendChild(block);
    }
  }

  removeFromTimeline(time) {
    const block = document.querySelector(`.selected-block[data-time="${time}"]`);
    if (block) {
      block.remove();
    }
  }

  updateCalendarUI() {
    const count = this.openSlots.size;
    const countElement = document.getElementById('slot-count');
    const submitBtn = document.querySelector('.btn-submit-calendar');
    
    console.log('[ProximityNetworking] Updating calendar UI. Count:', count);
    
    if (countElement) {
      countElement.textContent = count;
    }
    
    if (submitBtn) {
      submitBtn.disabled = count === 0;
      console.log('[ProximityNetworking] Submit button', submitBtn.disabled ? 'disabled' : 'enabled');
    }
  }

  submitCalendar() {
    if (this.openSlots.size === 0) return;
    
    // Animate submit button
    const submitBtn = document.querySelector('.btn-submit-calendar');
    submitBtn.innerHTML = `${getIcon('check', 20)}<span>Submitted!</span>`;
    submitBtn.classList.add('submitted');
    submitBtn.disabled = true;
    
    // Show success feedback
    this.showToast(`${this.openSlots.size} time slots confirmed!`);
    
    // Transition to GPS sharing after a delay
    setTimeout(() => {
      this.showGPSOptions();
    }, 1500);
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  showGPSOptions() {
    // Hide calendar section with fade
    const calendarSection = document.querySelector('.calendar-slots-section');
    if (calendarSection) {
      calendarSection.style.transition = 'opacity 300ms ease';
      calendarSection.style.opacity = '0.5';
    }
    
    // Show GPS sharing section
    const gpsSection = document.querySelector('.gps-sharing-section');
    if (gpsSection) {
      gpsSection.style.display = 'block';
      gpsSection.style.animation = 'slideInFromBottom 500ms ease-out';
      
      // Ensure it's visible in the viewport
      setTimeout(() => {
        gpsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 100);
    }
  }

  selectDuration(hours) {
    // Update active state
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.duration-btn[data-duration="${hours}"]`)?.classList.add('active');
    
    this.selectedDuration = hours;
    
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  selectGranularity(level) {
    // Update active state
    document.querySelectorAll('.granularity-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.granularity-btn[data-level="${level}"]`)?.classList.add('active');
    
    this.selectedGranularity = level;
    
    if (window.haptic) {
      window.haptic.selection();
    }
  }

  confirmGPSSharing() {
    const duration = this.selectedDuration || 4;
    const granularity = this.selectedGranularity || 'precise';
    
    // Update button to show confirmation
    const confirmBtn = document.querySelector('.btn-confirm-gps');
    if (confirmBtn) {
      confirmBtn.innerHTML = `${getIcon('check', 20)}<span>Location Sharing Active</span>`;
      confirmBtn.classList.add('confirmed');
      confirmBtn.disabled = true;
    }
    
    // Show confirmation toast
    const granularityText = {
      precise: 'precise location',
      room: 'room-level location',
      building: 'building area'
    };
    
    this.showToast(`Sharing ${granularityText[granularity]} for ${duration} hour${duration > 1 ? 's' : ''}`); 
    
    // After GPS confirmation, proceed to matchmaking
    setTimeout(() => {
      this.startMatchmaking();
    }, 1500);
    
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  // Legacy function for backward compatibility
  markSlotOpen(time) {
    this.toggleSlot(time);
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
      { id: 1, name: 'Sarah Chen', role: 'VP Marketing Ops', company: 'Salesforce', distance: 50, score: 98 },
      { id: 2, name: 'Marcus Johnson', role: 'Director Growth', company: 'HubSpot', distance: 100, score: 89 },
      { id: 3, name: 'Emma Wilson', role: 'Head of Product', company: 'Segment', distance: 75, score: 85 },
      { id: 4, name: 'Alex Kumar', role: 'CTO', company: '6sense', distance: 200, score: 76 },
      { id: 5, name: 'Lisa Park', role: 'VP Analytics', company: 'Tableau', distance: 150, score: 82 }
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
    console.log('[ProximityNetworking] Starting matchmaking process');
    
    const matchmakingSection = document.querySelector('.matchmaking-section');
    if (matchmakingSection) {
      matchmakingSection.style.display = 'block';
      matchmakingSection.style.animation = 'fadeIn 500ms ease-out';
      
      // Scroll to matchmaking section
      setTimeout(() => {
        matchmakingSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 100);
    }

    // Show finding matches toast
    this.showToast('Finding nearby matches...');

    // Detect location automatically
    this.detectLocation();

    // Animate radar sweep
    const sweep = document.querySelector('.radar-sweep');
    if (sweep) {
      sweep.style.animation = 'radarSweep 2s linear infinite';
    }

    // Show results after animation
    setTimeout(() => {
      this.showToast('3 perfect matches found!');
      this.showMatchResults();
    }, 3500);
  }

  showMatchResults() {
    console.log('[ProximityNetworking] Showing match results section');
    
    // Try both possible selectors for results section
    let resultsSection = document.querySelector('.proximity-results');
    if (!resultsSection) {
      resultsSection = document.querySelector('.match-results');
    }
    
    if (resultsSection) {
      resultsSection.style.display = 'block';
      resultsSection.style.animation = 'slideInFromBottom 600ms ease-out';

      // Scroll to results with better positioning
      setTimeout(() => {
        resultsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',  // Show from the top of the results
          inline: 'nearest'
        });
        
        // Also ensure the container scrolls
        const container = document.querySelector('.proximity-container');
        if (container) {
          container.scrollTop = resultsSection.offsetTop - 100;
        }
      }, 100);
      
      // Animate match cards if they exist
      const matchCards = document.querySelectorAll('.match-card');
      matchCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
          card.style.transition = 'all 0.5s ease-out';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 200 + index * 150);
      });
    } else {
      console.error('[ProximityNetworking] Results section not found!');
    }

    // Haptic celebration
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  sendConnection(name, btn) {
    this.showToast(`Connection request sent to ${name || 'match'}!`);
    
    // Update button
    if (btn) {
      btn.innerHTML = `${getIcon('check', 16)}<span>Sent</span>`;
      btn.disabled = true;
      btn.classList.add('sent');
    }
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }

  scheduleMeeting(name, btn) {
    // Add to calendar
    const meeting = {
      title: `Coffee with ${name || 'match'}`,
      location: 'Food Court',
      time: '11:30 AM',
      date: 'August 21, 2025'
    };

    // Show confirmation
    this.showToast(`Meeting with ${name || 'match'} scheduled!`);
    
    // Update UI
    if (btn) {
      btn.innerHTML = `${getIcon('check', 16)}<span>Scheduled</span>`;
      btn.disabled = true;
      btn.classList.add('scheduled');
    }
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.notification('success');
    }
  }
  
  sendMessage(name, btn) {
    // Create and show messaging interface
    this.openMessagingInterface(name);
    
    // Update button to show it's active
    if (btn) {
      btn.innerHTML = `${getIcon('messageCircle', 16)}<span>Chatting</span>`;
      btn.classList.add('active');
    }
    
    // Haptic feedback
    if (window.haptic) {
      window.haptic.impact('light');
    }
  }
  
  openMessagingInterface(name) {
    // Create messaging modal
    const modal = document.createElement('div');
    modal.className = 'messaging-modal active';
    modal.innerHTML = `
      <div class="messaging-container">
        <div class="messaging-header">
          <button class="btn-back">${getIcon('arrowLeft', 20)}</button>
          <div class="messaging-contact">
            <div class="contact-avatar">${name.split(' ').map(n => n[0]).join('')}</div>
            <div class="contact-info">
              <h4>${name}</h4>
              <span class="contact-status">🟢 Active now</span>
            </div>
          </div>
          <button class="btn-video">${getIcon('video', 20)}</button>
        </div>
        
        <div class="messaging-chat">
          <!-- Pinned Team MAU Messages -->
          <div class="pinned-messages">
            <div class="pinned-header">
              <span class="pin-icon">📌</span>
              <span>Team MAU Announcements</span>
            </div>
            <div class="message team-mau pinned">
              <div class="message-content">
                <div class="mau-badge">Team MAU</div>
                <p>🎯 <strong>Keynote Alert:</strong> Salesforce announcing new Einstein AI for Marketing Cloud at 2pm - Hall A. Perfect for attribution modeling!</p>
                <span class="message-time">10:15 AM</span>
              </div>
            </div>
            <div class="message team-mau pinned">
              <div class="message-content">
                <div class="mau-badge">Team MAU</div>
                <p>🚀 <strong>Hot Demo:</strong> HubSpot showing their new ABM integration with 6sense at Booth #423. Real-time intent data + lead scoring!</p>
                <span class="message-time">9:45 AM</span>
              </div>
            </div>
            <div class="message team-mau pinned">
              <div class="message-content">
                <div class="mau-badge">Team MAU</div>
                <p>💡 <strong>Exclusive:</strong> Segment (Twilio) launching Reverse ETL feature - sync CDP data back to your MAP. Private preview signup at CDP Pavilion!</p>
                <span class="message-time">9:30 AM</span>
              </div>
            </div>
          </div>
          
          <div class="messages-divider">
            <span>Conversation with ${name}</span>
          </div>
          
          <div class="chat-messages" id="chat-messages">
            <div class="message received">
              <div class="message-content">
                <p>Hi! I saw we both work in marketing automation. We're launching a new CDP integration with Segment. Are you using a CDP currently?</p>
                <span class="message-time">11:28 AM</span>
              </div>
            </div>
            <div class="message sent">
              <div class="message-content">
                <p>Yes! We're evaluating CDPs right now. Currently using HubSpot for MAP but need better data unification. How does your integration handle real-time event streaming?</p>
                <span class="message-time">11:29 AM</span>
              </div>
            </div>
            <div class="message received">
              <div class="message-content">
                <p>Great timing! We handle 10M+ events/day with sub-second latency. I'm at booth #423 near the Salesforce pavilion if you want a demo, or we can schedule for tomorrow?</p>
                <span class="message-time">11:30 AM</span>
              </div>
            </div>
          </div>
          
          <div class="messaging-input">
            <input type="text" placeholder="Type a message..." class="message-input" id="message-input">
            <button class="btn-send">${getIcon('send', 20)}</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle back button
    modal.querySelector('.btn-back').addEventListener('click', () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
      
      // If from FTUE, continue to networking
      if (window.smartOnboarding && window.smartOnboarding.isActive) {
        this.continueFromFTUE();
      }
    });
    
    // Handle send button
    const input = modal.querySelector('#message-input');
    const sendBtn = modal.querySelector('.btn-send');
    const messagesContainer = modal.querySelector('#chat-messages');
    
    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      
      // Add message to chat
      const messageEl = document.createElement('div');
      messageEl.className = 'message sent';
      messageEl.innerHTML = `
        <div class="message-content">
          <p>${text}</p>
          <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
        </div>
      `;
      messagesContainer.appendChild(messageEl);
      
      // Clear input and scroll to bottom
      input.value = '';
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Simulate response after delay
      setTimeout(() => {
        const responses = [
          "Excellent! We just integrated with Salesforce Marketing Cloud. Would love to show you the attribution dashboard.",
          "That's our specialty! Our ABM platform integrates with 6sense for intent data. When can you stop by?",
          "Perfect use case for us! We help Klaviyo users optimize their email deliverability. Let's discuss your open rates.",
          "Great question! Our CDP unifies data from HubSpot, Segment, and Google Analytics. I'll show you the real-time dashboard.",
          "Interesting! We're launching an iPaaS solution with MuleSoft. No-code integrations for your entire martech stack.",
          "That aligns perfectly! Our AI-powered personalization beats Optimizely's conversion rates by 23%. Demo at 3pm?",
          "Fantastic! Our attribution model covers all touchpoints from first click to closed-won. Using Tableau or Looker?",
          "Love it! We help Marketo users reduce their CAC by 40%. What's your current lead scoring model?"
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        const responseEl = document.createElement('div');
        responseEl.className = 'message received';
        responseEl.innerHTML = `
          <div class="message-content">
            <p>${response}</p>
            <span class="message-time">${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        `;
        messagesContainer.appendChild(responseEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Haptic feedback for received message
        if (window.haptic) {
          window.haptic.notification('success');
        }
      }, 2000 + Math.random() * 2000);
      
      // Haptic feedback for sent message
      if (window.haptic) {
        window.haptic.impact('light');
      }
    };
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    
    // Focus input
    setTimeout(() => input.focus(), 100);
  }
  
  continueFromFTUE() {
    // Transition from FTUE to live networking experience
    console.log('[ProximityNetworking] Continuing from FTUE to live experience');
    
    // Hide FTUE if active
    if (window.smartOnboarding && window.smartOnboarding.isActive) {
      window.smartOnboarding.complete();
    }
    
    // Show main app
    const heroLanding = document.getElementById('hero-landing');
    const app = document.getElementById('app');
    
    if (heroLanding) {
      heroLanding.style.display = 'none';
    }
    
    if (app) {
      app.style.display = 'block';
      
      // Navigate to smart networking section
      setTimeout(() => {
        // Open the proximity panel
        this.open();
        
        // Show welcome message
        this.showToast('Welcome to Smart Networking! Your matches are ready.');
        
        // Show match results
        this.showMatchResults();
      }, 500);
    }
  }
  
  showMatchResults() {
    console.log('[ProximityNetworking] Showing match results with animation');
    
    // Make sure the results section is visible
    const resultsSection = document.querySelector('.proximity-results');
    if (resultsSection) {
      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Trigger match card animations
    const matchCards = document.querySelectorAll('.match-card');
    matchCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.5s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });
    
    // Haptic feedback for each card appearance
    if (window.haptic) {
      matchCards.forEach((card, index) => {
        setTimeout(() => {
          window.haptic.impact('light');
        }, index * 150);
      });
    }
  }

  startDemo() {
    // Auto-mark a slot that doesn't conflict
    setTimeout(() => {
      this.markSlotOpen('11:30');
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
    
    // Re-attach event handlers when opening (in case DOM was recreated)
    this.attachEventHandlers();

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
      /* Messaging Modal */
      .messaging-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .messaging-modal.active {
        opacity: 1;
        pointer-events: all;
      }
      
      .messaging-container {
        background: var(--color-surface, #1a1a1a);
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        height: 80vh;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(20px);
        transition: transform 0.3s ease;
      }
      
      .messaging-modal.active .messaging-container {
        transform: translateY(0);
      }
      
      .messaging-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--color-bg, #0f0f0f);
        border-bottom: 1px solid var(--color-border, #2a2a2a);
      }
      
      .messaging-header .btn-back,
      .messaging-header .btn-video {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--color-surface, #1a1a1a);
        border: none;
        color: var(--color-text, #ffffff);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .messaging-header .btn-back:hover,
      .messaging-header .btn-video:hover {
        background: var(--color-accent, #7c3aed);
        transform: scale(1.05);
      }
      
      .messaging-contact {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .contact-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #10b981);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        color: white;
      }
      
      .contact-info h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text, #ffffff);
      }
      
      .contact-status {
        font-size: 12px;
        color: var(--color-text-dim, #9ca3af);
      }
      
      .messaging-chat {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Pinned Messages Section */
      .pinned-messages {
        background: var(--color-bg, #0f0f0f);
        border-bottom: 2px solid var(--color-accent, #7c3aed);
        padding: 16px 20px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .pinned-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--color-text-dim, #9ca3af);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }
      
      .message.team-mau {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(16, 185, 129, 0.1));
        border-left: 3px solid var(--color-accent, #7c3aed);
        margin-bottom: 12px;
      }
      
      .mau-badge {
        display: inline-block;
        background: var(--color-accent, #7c3aed);
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        margin-bottom: 8px;
      }
      
      .messages-divider {
        padding: 12px 20px;
        background: var(--color-surface, #1a1a1a);
        border-bottom: 1px solid var(--color-border, #2a2a2a);
        text-align: center;
        font-size: 13px;
        color: var(--color-text-dim, #9ca3af);
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .message {
        display: flex;
        max-width: 70%;
        animation: messageSlide 0.3s ease-out;
      }
      
      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .message.sent {
        align-self: flex-end;
      }
      
      .message.received {
        align-self: flex-start;
      }
      
      .message-content {
        background: var(--color-surface, #1a1a1a);
        padding: 12px 16px;
        border-radius: 16px;
        position: relative;
      }
      
      .message.sent .message-content {
        background: var(--color-accent, #7c3aed);
        border-bottom-right-radius: 4px;
      }
      
      .message.received .message-content {
        background: var(--color-surface-elevated, #2a2a2a);
        border-bottom-left-radius: 4px;
      }
      
      .message-content p {
        margin: 0;
        color: var(--color-text, #ffffff);
        font-size: 14px;
        line-height: 1.4;
      }
      
      .message-time {
        display: block;
        font-size: 11px;
        color: var(--color-text-dim, #9ca3af);
        margin-top: 4px;
        opacity: 0.7;
      }
      
      .messaging-input {
        display: flex;
        gap: 12px;
        padding: 16px;
        background: var(--color-bg, #0f0f0f);
        border-top: 1px solid var(--color-border, #2a2a2a);
      }
      
      .message-input {
        flex: 1;
        background: var(--color-surface, #1a1a1a);
        border: 1px solid var(--color-border, #2a2a2a);
        border-radius: 24px;
        padding: 12px 20px;
        color: var(--color-text, #ffffff);
        font-size: 14px;
        outline: none;
        transition: all 0.2s ease;
      }
      
      .message-input:focus {
        border-color: var(--color-accent, #7c3aed);
        background: var(--color-surface-elevated, #2a2a2a);
      }
      
      .btn-send {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--color-accent, #7c3aed);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .btn-send:hover {
        transform: scale(1.05);
        background: var(--color-accent-hover, #6b2fc3);
      }
      
      .btn-send:active {
        transform: scale(0.95);
      }
      
      /* Animation for continuing from FTUE */
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* Smart Network Button - inherits positioning from floating-buttons-unified.css */
      .smart-network-btn {
        /* Position, size, and effects handled by floating-buttons-unified.css */
        /* Just override the background color */
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      }
      
      /* Mobile and hover styles handled by floating-buttons-unified.css */
      
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
      
      /* Enhanced Calendar Section */
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
      
      .calendar-container {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 32px;
        align-items: start;
      }
      
      /* Visual Timeline */
      .visual-timeline {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px;
      }
      
      .timeline-header {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16px;
        text-align: center;
      }
      
      .timeline-track {
        position: relative;
        height: 400px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.02) 0%,
          rgba(255, 255, 255, 0.01) 100%
        );
        border-left: 2px solid rgba(255, 255, 255, 0.1);
        margin-left: 60px;
      }
      
      .timeline-hour {
        position: absolute;
        left: -60px;
        width: 50px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-align: right;
      }
      
      .timeline-hour[data-hour="9"] { top: 0%; }
      .timeline-hour[data-hour="10"] { top: 10%; }
      .timeline-hour[data-hour="11"] { top: 20%; }
      .timeline-hour[data-hour="12"] { top: 30%; }
      .timeline-hour[data-hour="13"] { top: 40%; }
      .timeline-hour[data-hour="14"] { top: 50%; }
      .timeline-hour[data-hour="15"] { top: 60%; }
      .timeline-hour[data-hour="16"] { top: 70%; }
      .timeline-hour[data-hour="17"] { top: 80%; }
      .timeline-hour[data-hour="18"] { top: 90%; }
      
      .event-block,
      .selected-block {
        position: absolute;
        left: 0;
        right: 0;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 11px;
        color: white;
        display: flex;
        align-items: center;
      }
      
      .event-block {
        background: rgba(239, 68, 68, 0.2);
        border-left: 3px solid #ef4444;
      }
      
      .selected-block {
        background: rgba(16, 185, 129, 0.2);
        border-left: 3px solid #10b981;
        animation: fadeIn 300ms ease;
      }
      
      .selected-slots {
        position: absolute;
        inset: 0;
      }
      
      /* Slot Selection */
      .slot-selection {
        flex: 1;
      }
      
      .time-slots {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      
      .time-slot {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 200ms ease;
        cursor: pointer;
      }
      
      .time-slot:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      .time-slot.selected {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      .time-slot > div {
        flex: 1;
      }
      
      .slot-time {
        font-size: 16px;
        font-weight: 600;
        color: white;
        display: block;
      }
      
      .slot-duration {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        display: block;
        margin-top: 2px;
      }
      
      .slot-toggle {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 200ms ease;
        pointer-events: none; /* Let parent handle clicks */
      }
      
      .slot-toggle:hover {
        border-color: rgba(16, 185, 129, 0.5);
      }
      
      .time-slot.selected .slot-toggle {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
      }
      
      .toggle-icon {
        font-size: 18px;
        color: #10b981;
        line-height: 1;
      }
      
      /* Calendar Actions */
      .calendar-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .selected-count {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
      }
      
      .selected-count #slot-count {
        font-weight: 600;
        color: #10b981;
        font-size: 18px;
      }
      
      .btn-submit-calendar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #10b981, #059669);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .btn-submit-calendar:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
      }
      
      .btn-submit-calendar:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .btn-submit-calendar.submitted {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
      
      .btn-submit-calendar svg {
        width: 20px;
        height: 20px;
      }
      
      /* GPS Sharing Section */
      .gps-sharing-section {
        padding: 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .gps-sharing-section h3 {
        font-size: 20px;
        font-weight: 600;
        color: white;
        margin-bottom: 8px;
      }
      
      .gps-options {
        margin-top: 24px;
      }
      
      .option-group {
        margin-bottom: 32px;
      }
      
      .option-group label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16px;
      }
      
      .duration-options,
      .granularity-options {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      
      .duration-btn,
      .granularity-btn {
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        cursor: pointer;
        transition: all 200ms ease;
        text-align: center;
      }
      
      .duration-btn:hover,
      .granularity-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .duration-btn.active,
      .granularity-btn.active {
        background: rgba(99, 102, 241, 0.1);
        border-color: #6366f1;
      }
      
      .duration-btn svg,
      .granularity-btn svg {
        width: 20px;
        height: 20px;
        color: #6366f1;
        margin-bottom: 8px;
      }
      
      .duration-btn span,
      .granularity-btn span {
        display: block;
        color: white;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .duration-btn small,
      .granularity-btn small {
        display: block;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
      }
      
      .privacy-notice {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: rgba(99, 102, 241, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        margin-bottom: 24px;
      }
      
      .privacy-notice svg {
        width: 20px;
        height: 20px;
        color: #6366f1;
        flex-shrink: 0;
      }
      
      .privacy-notice span {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.4;
      }
      
      .btn-confirm-gps {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 24px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
      }
      
      .btn-confirm-gps:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
      }
      
      .btn-confirm-gps.confirmed {
        background: rgba(99, 102, 241, 0.2);
        color: #6366f1;
      }
      
      .btn-confirm-gps svg {
        width: 20px;
        height: 20px;
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
        margin-bottom: 8px;
        text-align: center;
      }
      
      .match-subtitle {
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 32px;
      }
      
      .match-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        position: relative;
        margin-bottom: 24px;
        transition: all 200ms ease;
      }
      
      .match-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
      
      .match-card.featured {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
        border-color: rgba(16, 185, 129, 0.2);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
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
      
      /* Match Details Grid */
      .match-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 20px 0;
        padding: 16px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
      }
      
      .match-stat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .stat-icon {
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
      }
      
      .stat-icon svg {
        width: 16px;
        height: 16px;
      }
      
      .match-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      
      .btn-connect,
      .btn-schedule,
      .btn-message {
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .btn-connect svg,
      .btn-schedule svg,
      .btn-message svg {
        width: 16px;
        height: 16px;
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
      
      .btn-message {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
      }
      
      .btn-message:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
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
        
        .calendar-container {
          grid-template-columns: 1fr;
          gap: 24px;
        }
        
        .visual-timeline {
          display: none; /* Hide timeline on mobile for space */
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
        
        .duration-options,
        .granularity-options {
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