const express = require('express');
const router = express.Router();
const { getDataArchitectChallenge } = require('../controllers/dataArchitectController');

router.post('/generate', getDataArchitectChallenge);

module.exports = router; 