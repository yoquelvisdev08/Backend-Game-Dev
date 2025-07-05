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
        enum: [
            // Categorías básicas
            'joins', 'subqueries', 'aggregations', 'group_by', 
            'where_having', 'performance', 'syntax',
            
            // Optimización
            'index_usage', 'query_planning', 'redundant_joins',
            
            // Manipulación de datos
            'window_functions', 'cte_usage', 'data_transformation',
            
            // Integridad de datos
            'constraints', 'transactions', 'null_handling',
            
            // Casos especiales
            'date_time', 'string_operations', 'recursive_queries'
        ]
    },
    skillLevel: {
        type: String,
        required: true,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner'
    },
    topics: [{
        type: String,
        enum: [
            'performance', 'security', 'data_integrity',
            'code_style', 'best_practices', 'optimization'
        ]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BuggySQL', buggySQLSchema); 