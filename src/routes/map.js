// MAP-SERVICE ROUTES - MICROSERVICE DELEGATION
const express = require('express');
const router = express.Router();
const { getBounds } = require('../services/map-service/getBounds');
const { getLocationPins } = require('../services/map-service/getLocationPins');


// getBounds endpoint
router.get('/api/map/getlocationpins/getbounds', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await getBounds(params);
    
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

// getLocationPins endpoint
router.get('/api/map/getlocationpins/getlocationpins', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await getLocationPins(params);
    
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
