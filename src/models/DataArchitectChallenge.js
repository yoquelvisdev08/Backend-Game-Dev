const mongoose = require('mongoose');

// Definir sub-esquemas para reutilización
const indexSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    columns: {
        type: [String],
        required: true
    },
    type: {
        type: String,
        enum: ['UNIQUE', 'INDEX', 'FULLTEXT'],
        default: 'INDEX'
    }
}, { _id: false });

const columnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    constraints: [String],
    description: String
}, { _id: false });

const tableSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    columns: [columnSchema],
    constraints: [String],
    indexes: [indexSchema]
}, { _id: false });

const relationshipSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['1:N', 'N:M', '1:1'],
        required: true
    },
    tables: [String],
    description: String
}, { _id: false });

const testCaseSchema = new mongoose.Schema({
    input: String,
    expected_output: String
}, { _id: false });

const dataArchitectChallengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    category: {
        type: String,
        enum: ['normalization', 'constraints', 'indexing', 'views', 'design'],
        required: true
    },
    type: {
        type: String,
        enum: [
            // Normalización
            '1NF_to_2NF', '2NF_to_3NF', '3NF_to_BCNF', 'many_to_many',
            // Constraints
            'primary_key', 'foreign_key', 'unique', 'check', 'not_null',
            // Indexación
            'performance_optimization', 'join_optimization', 'composite_indexes', 'covering_indexes',
            // Vistas
            'reporting_views', 'materialized_views', 'security_views', 'aggregation_views',
            // Diseño
            'entity_relationship', 'data_warehouse', 'temporal_data', 'audit_tracking'
        ],
        required: true
    },
    initialSchema: {
        tables: [tableSchema],
        relationships: [relationshipSchema]
    },
    task: {
        objective: String,
        requirements: [String],
        hints: [String]
    },
    expectedSolution: {
        tables: [tableSchema],
        relationships: [relationshipSchema],
        sql_statements: [String],
        explanation: String
    },
    validation: {
        test_cases: [testCaseSchema],
        success_criteria: [String]
    },
    metadata: {
        points: Number,
        estimated_time: String,
        prerequisites: [String],
        related_concepts: [String]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DataArchitectChallenge', dataArchitectChallengeSchema); 