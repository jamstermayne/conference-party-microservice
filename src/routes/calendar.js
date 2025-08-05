// CALENDAR-SERVICE ROUTES - MICROSERVICE DELEGATION
const express = require('express');
const router = express.Router();
const { getCalendarView } = require('../services/calendar-service/getCalendarView');
const { syncCalendar } = require('../services/calendar-service/syncCalendar');


// getCalendarView endpoint
router.get('/api/calendar/getcalendarview', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await getCalendarView(params);
    
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

// syncCalendar endpoint
router.get('/api/calendar/synccalendar', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body, ...req.params };
    const result = await syncCalendar(params);
    
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
