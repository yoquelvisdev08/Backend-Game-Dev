const mongoose = require('mongoose');

const CodeSnippetSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    language: {
        type: String,
        required: true
    },
    length: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CodeSnippet', CodeSnippetSchema); 