// USER-SERVICE ROUTES - MICROSERVICE DELEGATION
const express = require('express');
const router = express.Router();
const { getPreferences } = require('../services/user-service/getPreferences');
const { savePreferences } = require('../services/user-service/savePreferences');


// getPreferences endpoint
router.get('/api/users/getpreferences/getpreferences', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await getPreferences(params);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ROUTE_ERROR'
    });
  }
});

// savePreferences endpoint
router.get('/api/users/getpreferences/savepreferences', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await savePreferences(params);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'ROUTE_ERROR'
    });
  }
});

module.exports = router;
