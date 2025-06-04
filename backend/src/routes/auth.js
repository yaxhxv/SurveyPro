const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/auth');
const { authenticateToken } = require('../middleware/auth');

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get current user (protected route)
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router; 