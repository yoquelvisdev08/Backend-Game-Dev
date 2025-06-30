const express = require('express');
const router = express.Router();
const { generateCode } = require('../controllers/codeGeneratorController');

router.post('/generate', generateCode);

module.exports = router; 