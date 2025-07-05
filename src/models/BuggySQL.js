const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    description: {
        type: String
    }
});

const tableStructureSchema = new mongoose.Schema({
    columns: [columnSchema]
});

const contextSchema = new mongoose.Schema({
    tableName: {
        type: String,
        required: true
    },
    tableStructure: tableStructureSchema,
    expectedResult: {
        type: String,
        required: true
    },
    sampleData: {
        type: String // JSON string con datos de ejemplo
    }
});

const buggySQLSchema = new mongoose.Schema({
    buggyQuery: {
        type: String,
        required: true
    },
    context: {
        type: contextSchema,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    explanation: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard']
    },
    category: {
        type: String,
        required: true,
        enum: ['joins', 'subqueries', 'aggregations', 'group_by', 'where_having', 'performance', 'syntax']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BuggySQL', buggySQLSchema); 