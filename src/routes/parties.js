/**
 * Party Routes - Microservice Delegation
 * Purpose: Route HTTP requests to party microservices
 * Pattern: Routes → Microservices (1 function = 1 result)
 * Genesis Compliance: ≤95 lines
 */

const express = require('express');
const { getFeed } = require('../services/party-service/get-party-feed');
const { processSwipe } = require('../services/party-service/process-swipe');

const router = express.Router();

// GET /api/parties/feed - Delegate to getFeed microservice
router.get('/feed', async (req, res) => {
    try {
        const options = {
            limit: parseInt(req.query.limit) || 10,
            hideOld: req.query.hideOld === 'true',
            userId: req.query.userId || null,
            sessionId: req.query.sessionId || null
        };

        // Call microservice - single function, single result
        const result = getFeed(options);
        
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get party feed',
            details: error.message
        });
    }
});

// POST /api/parties/swipe - Delegate to processSwipe microservice  
router.post('/swipe', async (req, res) => {
    try {
        const swipeData = {
            userId: req.body.userId,
            partyId: req.body.partyId,
            action: req.body.action,
            sessionId: req.body.sessionId || null
        };

        // Call microservice - single function, single result
        const result = processSwipe(swipeData);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to process swipe',
            details: error.message
        });
    }
});

// GET /api/parties/interested/:userId - Delegate to future microservice
router.get('/interested/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // This would delegate to getUserInterests microservice
        // For now, return mock data following same pattern
        const result = {
            success: true,
            userId: userId,
            interests: [],
            meta: {
                count: 0,
                message: "No interested parties yet"
            }
        };

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get user interests',
            details: error.message
        });
    }
});

module.exports = router;
