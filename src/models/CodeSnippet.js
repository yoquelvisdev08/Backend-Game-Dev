const mongoose = require('mongoose');

const codeSnippetSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    snippetLength: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    usageCount: {
        type: Number,
        default: 0
    },
    hash: {
        type: String,
        required: true,
        index: true
    }
});

// Índices compuestos para búsquedas eficientes
codeSnippetSchema.index({ language: 1, difficulty: 1, snippetLength: 1 });

module.exports = mongoose.model('CodeSnippet', codeSnippetSchema); 