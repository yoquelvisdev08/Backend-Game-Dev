const express = require('express');
const router = express.Router();
const { getBugChallenges } = require('../controllers/bugChallengeController');

router.post('/generate', getBugChallenges);

module.exports = router; 