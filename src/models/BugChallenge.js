const mongoose = require('mongoose');

const bugChallengeSchema = new mongoose.Schema({
    buggyCode: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number, // Índice de la opción correcta
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['javascript', 'python', 'java', 'cpp', 'typescript']
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BugChallenge', bugChallengeSchema); 