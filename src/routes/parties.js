const express = require('express');
const router = express.Router();

// Mock data (TODO: Replace with Firestore)
const mockParties = [
  {
    id: 'party-1', name: 'Tech Leaders Networking', host: 'Google Developer Group',
    time: '2025-08-04T19:00:00Z', location: 'Rooftop Bar, Hotel Monaco',
    description: 'Connect with fellow tech leaders over cocktails',
    attendeeCount: 45, image: '/images/party-1.jpg', tags: ['networking', 'tech', 'cocktails']
  },
  {
    id: 'party-2', name: 'Designer After Party', host: 'Design Systems Inc',
    time: '2025-08-04T21:30:00Z', location: 'Studio 42, Downtown', 
    description: 'Celebrate great design with music and drinks',
    attendeeCount: 32, image: '/images/party-2.jpg', tags: ['design', 'music', 'creative']
  }
];

// Party feed for swiping (Tinder-style)
router.get('/feed', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockParties,
      meta: { count: mockParties.length, loadTime: '45ms', swipeSession: `session_${Date.now()}` }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parties', message: error.message });
  }
});

// Swipe action (interested/pass)
router.post('/swipe', async (req, res) => {
  try {
    const { userId, partyId, action, sessionId } = req.body;
    
    if (!['interested', 'pass'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action', allowed: ['interested', 'pass'] });
    }

    const swipeResult = {
      id: `swipe_${Date.now()}`, userId, partyId, action,
      timestamp: new Date().toISOString(), sessionId
    };

    const responses = {
      interested: { message: 'Party saved!', nextAction: 'calendar_sync_available' },
      pass: { message: 'Party dismissed', nextAction: 'continue_swiping' }
    };

    res.json({
      success: true,
      swipe: swipeResult,
      ...responses[action]
    });

  } catch (error) {
    res.status(500).json({ error: 'Swipe failed', message: error.message });
  }
});

// User's interested parties (for calendar sync)
router.get('/interested/:userId', async (req, res) => {
  try {
    const mockInterested = [
      { id: 'party-1', name: 'Tech Leaders Networking', time: '2025-08-04T19:00:00Z', calendarAdded: false }
    ];

    res.json({
      success: true,
      data: mockInterested,
      meta: {
        count: mockInterested.length,
        readyForCalendarSync: mockInterested.filter(p => !p.calendarAdded).length
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interested parties', message: error.message });
  }
});

module.exports = router;