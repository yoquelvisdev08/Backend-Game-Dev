const axios = require('axios');
const BuggySQL = require('../models/BuggySQL');

const generatePrompt = (difficulty, category = null) => {
    const categoryPrompt = category ? `in the category ${category}` : '';
    return `Generate a SQL challenge ${categoryPrompt} at ${difficulty} difficulty level.
    The response should be a valid JSON object with this exact structure:
    {
        "buggyQuery": "an incorrect SQL query",
        "context": {
            "tableName": "name of the main table",
            "tableStructure": {
                "columns": [
                    {"name": "column name", "type": "SQL type", "description": "what this column represents"}
                ]
            },
            "expectedResult": "what the query should accomplish",
            "sampleData": "optional JSON with example data"
        },
        "options": [
            "incorrect query 1",
            "incorrect query 2",
            "correct query",
            "incorrect query 3"
        ],
        "correctAnswer": 2,
        "explanation": "detailed explanation of why the original query is wrong and why the correct option fixes it",
        "category": "one of: joins, subqueries, aggregations, group_by, where_having, performance, syntax"
    }
    
    IMPORTANT: 
    1. The buggy query should have a clear and educational problem
    2. All options should be plausible but only one correct
    3. The explanation should be detailed and educational
    4. Include realistic table and column names
    5. The SQL should follow best practices
    6. Return ONLY the JSON object, no markdown or additional text`;
};

const generateWithAI = async (difficulty, category) => {
    try {
        const response = await axios.post(
            process.env.GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: generatePrompt(difficulty, category)
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': process.env.GEMINI_API_KEY
                }
            }
        );

        const rawText = response.data.candidates[0].content.parts[0].text;
        const jsonStr = rawText.replace(/```json\n|\n```|```/g, '').trim();
        const generatedContent = JSON.parse(jsonStr);

        // Validar la estructura de la respuesta
        if (!generatedContent.buggyQuery || !generatedContent.context || 
            !generatedContent.options || !generatedContent.correctAnswer || 
            !generatedContent.explanation || !generatedContent.category) {
            throw new Error('Invalid response structure from AI');
        }

        return generatedContent;
    } catch (error) {
        console.error('Error generating with Gemini:', error);
        throw error;
    }
};

const getBuggySQLChallenges = async (req, res) => {
    const { difficulty, category, questionsCount = 1, mode = 'multiple_choice' } = req.body;

    if (!difficulty) {
        return res.status(400).json({ 
            error: 'Se requiere especificar la dificultad' 
        });
    }

    try {
        const challenges = [];
        let aiErrors = 0;
        const MAX_AI_RETRIES = 3;
        
        // Intentar generar con IA
        for (let i = 0; i < questionsCount; i++) {
            try {
                if (aiErrors >= MAX_AI_RETRIES) {
                    console.log('Demasiados errores de IA, cambiando a fallback DB');
                    break;
                }

                const challenge = await generateWithAI(difficulty, category);
                
                // Guardar en MongoDB
                const newChallenge = new BuggySQL({
                    ...challenge,
                    difficulty
                });
                await newChallenge.save();
                
                // Si el modo es direct_correction, eliminar las opciones
                if (mode === 'direct_correction') {
                    delete challenge.options;
                    delete challenge.correctAnswer;
                }
                
                challenges.push(challenge);
            } catch (error) {
                console.error('Error en generación IA, usando fallback a DB');
                aiErrors++;
                
                // Construir el query de búsqueda
                const query = { difficulty };
                if (category) query.category = category;
                
                // Fallback a MongoDB
                const fallbackChallenge = await BuggySQL.aggregate([
                    { $match: query },
                    { $sample: { size: 1 } }
                ]);

                if (fallbackChallenge.length > 0) {
                    let challenge = fallbackChallenge[0];
                    
                    // Si el modo es direct_correction, eliminar las opciones
                    if (mode === 'direct_correction') {
                        delete challenge.options;
                        delete challenge.correctAnswer;
                    }
                    
                    challenges.push(challenge);
                }
            }
        }

        if (challenges.length === 0) {
            return res.status(404).json({
                error: 'No se pudieron generar desafíos SQL y no hay desafíos almacenados'
            });
        }

        res.json({
            challenges,
            totalQuestions: challenges.length,
            mode
        });

    } catch (error) {
        console.error('Error en getBuggySQLChallenges:', error);
        res.status(500).json({ 
            error: 'Error al generar los desafíos SQL' 
        });
    }
};

module.exports = {
    getBuggySQLChallenges
}; 