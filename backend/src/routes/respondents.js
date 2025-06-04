const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllRespondents,
  getRespondent
} = require('../controllers/respondents');

// All routes require authentication
router.use(authenticateToken);

// Get all respondents
router.get('/', getAllRespondents);

// Get a specific respondent
router.get('/:id', getRespondent);

module.exports = router; 