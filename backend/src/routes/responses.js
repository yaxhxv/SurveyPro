const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getPublicSurvey,
  submitResponse,
  getSurveyResponses
} = require('../controllers/responses');

// Public routes
router.get('/:id/public', getPublicSurvey);
router.post('/:id/responses', submitResponse);

// Protected routes
router.get('/:id/responses', authenticateToken, getSurveyResponses);

module.exports = router; 