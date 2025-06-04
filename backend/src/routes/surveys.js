const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllSurveys,
  createSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey
} = require('../controllers/surveys');

// All routes require authentication
router.use(authenticateToken);

// Get all surveys
router.get('/', getAllSurveys);

// Create a new survey
router.post('/', createSurvey);

// Get a specific survey
router.get('/:id', getSurvey);

// Update a survey
router.put('/:id', updateSurvey);

// Delete a survey
router.delete('/:id', deleteSurvey);

// Publish a survey
router.post('/:id/publish', publishSurvey);

module.exports = router; 