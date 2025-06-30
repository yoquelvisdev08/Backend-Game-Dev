const express = require('express');
const router = express.Router();
const { generateCode } = require('../controllers/codeGeneratorController');

// POST /api/code-generator/generate
// Body: { language, difficulty, snippetLength, count }
router.post('/generate', generateCode);

module.exports = router; 