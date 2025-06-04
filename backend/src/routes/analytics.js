const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getSurveyAnalytics,
  getQuestionAnalytics,
  getDashboardAnalytics
} = require('../controllers/analytics');

// All routes require authentication
router.use(authenticateToken);

// Get dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Get survey analytics
router.get('/surveys/:id', getSurveyAnalytics);

// Get question analytics
router.get('/surveys/:id/questions/:questionId', getQuestionAnalytics);

module.exports = router; 