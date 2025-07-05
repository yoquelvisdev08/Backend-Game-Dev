const express = require('express');
const router = express.Router();
const { getBuggySQLChallenges } = require('../controllers/buggySQLController');

router.post('/generate', getBuggySQLChallenges);

module.exports = router; 