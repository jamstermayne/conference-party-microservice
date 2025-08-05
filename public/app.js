// Conference Party PWA - Main App Logic

let parties = [];
let currentPartyIndex = 0;

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const partiesEl = document.getElementById('parties');

// Load parties from Firebase Function or fallback
async function loadParties() {
    try {
        // Try Firebase Function first
        const response = await fetch('https://us-central1-conference-party-app.cloudfunctions.net/api/parties/feed');
        
        if (response.ok) {
            const data = await response.json();
            parties = data.data || [];
            hideLoading();
            renderParties();
        } else {
            throw new Error('API unavailable');
        }
    } catch (error) {
        console.log('Using fallback data:', error);
        // Fallback data for offline experience
        parties = [
            {
                id: "party-1",
                name: "Tech Leaders Networking",
                host: "Google Developer Group",
                time: "2025-08-04T19:00:00Z",
                location: "Rooftop Bar, Hotel Monaco",
                description: "Connect with fellow tech leaders over cocktails",
                attendeeCount: 45,
                tags: ["networking", "tech", "cocktails"]
            },
            {
                id: "party-2",
                name: "Designer After Party",
                host: "Design Systems Inc",
                time: "2025-08-04T21:30:00Z",
                location: "Studio 42, Downtown",
                description: "Celebrate great design with music and drinks",
                attendeeCount: 32,
                tags: ["design", "music", "creative"]
            },
            {
                id: "party-3",
                name: "Startup Founder Mixer",
                host: "Venture Capital Collective",
                time: "2025-08-05T18:00:00Z",
                location: "Innovation Hub, Building 7",
                description: "Meet fellow entrepreneurs and potential co-founders",
                attendeeCount: 28,
                tags: ["startup", "founders", "networking"]
            }
        ];
        
        showError();
        hideLoading();
        renderParties();
    }
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function showError() {
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function renderParties() {
    partiesEl.innerHTML = parties.map(party => `
        <div class="party-card" onclick="selectParty('${party.id}')">
            <h3>${party.name}</h3>
            <div class="host">Hosted by ${party.host}</div>
            <div class="time">${formatDate(party.time)}</div>
            <div class="location">📍 ${party.location}</div>
            <div class="description">${party.description}</div>
            <div style="margin-top: 1rem; opacity: 0.8;">
                ${party.attendeeCount} attending • ${party.tags.join(' • ')}
            </div>
        </div>
    `).join('');
}

function selectParty(partyId) {
    // Add haptic feedback on mobile
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    const party = parties.find(p => p.id === partyId);
    if (party) {
        // In a real app, this would navigate to party details
        alert(`Selected: ${party.name}\n\nIn a full app, this would show party details, RSVP options, and calendar integration!`);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadParties();
});

// Handle offline/online events
window.addEventListener('online', () => {
    console.log('Back online, refreshing data...');
    loadParties();
});

window.addEventListener('offline', () => {
    console.log('Offline mode - using cached data');
});
// Conference Party PWA - Main App Logic
let parties = [];

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const partiesEl = document.getElementById('parties');

// Load parties from Firebase Function or fallback
async function loadParties() {
    try {
        // Try Firebase Function first
        const response = await fetch('https://us-central1-conference-party-app.cloudfunctions.net/api/parties/feed');
        
        if (response.ok) {
            const data = await response.json();
            parties = data.data || [];
            hideLoading();
            renderParties();
        } else {
            throw new Error('API unavailable');
        }
    } catch (error) {
        console.log('Using fallback data:', error);
        // Fallback data for offline experience
        parties = [
            {
                id: "party-1",
                name: "Tech Leaders Networking",
                host: "Google Developer Group",
                time: "2025-08-04T19:00:00Z",
                location: "Rooftop Bar, Hotel Monaco",
                description: "Connect with fellow tech leaders over cocktails",
                attendeeCount: 45,
                tags: ["networking", "tech", "cocktails"]
            },
            {
                id: "party-2",
                name: "Designer After Party",
                host: "Design Systems Inc",
                time: "2025-08-04T21:30:00Z",
                location: "Studio 42, Downtown",
                description: "Celebrate great design with music and drinks",
                attendeeCount: 32,
                tags: ["design", "music", "creative"]
            }
        ];
        
        showError();
        hideLoading();
        renderParties();
    }
}

function hideLoading() {
    loadingEl.style.display = 'none';
}

function showError() {
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function renderParties() {
    partiesEl.innerHTML = parties.map(party => `
        <div class="party-card" onclick="selectParty('${party.id}')">
            <h3>${party.name}</h3>
            <div class="host">Hosted by ${party.host}</div>
            <div class="time">${formatDate(party.time)}</div>
            <div class="location">📍 ${party.location}</div>
            <div class="description">${party.description}</div>
        </div>
    `).join('');
}

function selectParty(partyId) {
    const party = parties.find(p => p.id === partyId);
    if (party) {
        alert(`Selected: ${party.name}`);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadParties();
});
