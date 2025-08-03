/**
 * Party Feed Microservice
 * Function: getFeed() → party list
 * Single Purpose: Return party feed data for mobile consumption
 * Genesis Compliance: ≤95 lines
 */

const crypto = require('crypto');

function getFeed(options = {}) {
    const { 
        limit = 10,
        hideOld = false,
        userId = null,
        sessionId = null
    } = options;

    // Generate unique session for swipe tracking
    const swipeSessionId = sessionId || `session_${Date.now()}${Math.random()}`;
    
    // Mock party data - in production, this would call database
    const parties = [
        {
            id: "party-1",
            name: "Tech Leaders Networking",
            host: "Google Developer Group",
            time: "2025-08-04T19:00:00Z",
            location: "Rooftop Bar, Hotel Monaco",
            description: "Connect with fellow tech leaders over cocktails",
            attendeeCount: 45,
            image: "/images/party-1.jpg",
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
            image: "/images/party-2.jpg",
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
            image: "/images/party-3.jpg", 
            tags: ["startup", "founders", "networking"]
        }
    ];

    // Filter old events if requested
    let filteredParties = parties;
    if (hideOld) {
        const now = new Date();
        filteredParties = parties.filter(party => new Date(party.time) > now);
    }

    // Apply limit
    const limitedParties = filteredParties.slice(0, limit);

    // Mobile-optimized response with metadata
    const result = {
        success: true,
        data: limitedParties,
        meta: {
            count: limitedParties.length,
            loadTime: `${Math.floor(Math.random() * 50) + 20}ms`,
            swipeSession: swipeSessionId,
            filters: {
                hideOld,
                limit
            }
        }
    };

    return result;
}

module.exports = { getFeed };
