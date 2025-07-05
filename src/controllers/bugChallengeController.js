const axios = require('axios');
const BugChallenge = require('../models/BugChallenge');

const generatePrompt = (language, difficulty) => {
    return `You are a programming challenge generator. Create a bug finding challenge for ${language} programming language at ${difficulty} difficulty level. 
    Return ONLY a JSON object with the following structure, without any markdown formatting or additional text:
    {
        "buggyCode": "code with a bug",
        "options": ["option1", "option2", "option3", "option4"],
        "correctAnswer": 0,
        "explanation": "explanation of the bug and why the correct answer fixes it"
    }
    The bug should be subtle but findable, and all options should be plausible but only one correct.
    IMPORTANT: Return ONLY the JSON object, no markdown, no backticks, no additional text.`;
};

const generateWithAI = async (language, difficulty) => {
    try {
        const response = await axios.post(
            process.env.GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: generatePrompt(language, difficulty)
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
        // Limpiar cualquier formato markdown o texto adicional
        const jsonStr = rawText.replace(/```json\n|\n```|```/g, '').trim();
        const generatedContent = JSON.parse(jsonStr);
        
        // Validar la estructura de la respuesta
        if (!generatedContent.buggyCode || !generatedContent.options || 
            !generatedContent.correctAnswer || !generatedContent.explanation) {
            throw new Error('Invalid response structure from AI');
        }

        return generatedContent;
    } catch (error) {
        console.error('Error generating with Gemini:', error);
        throw error;
    }
};

const getBugChallenges = async (req, res) => {
    const { language, difficulty, questionsCount } = req.body;

    if (!language || !difficulty || !questionsCount) {
        return res.status(400).json({ 
            error: 'Se requieren lenguaje, dificultad y cantidad de preguntas' 
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

                const challenge = await generateWithAI(language, difficulty);
                
                // Guardar en MongoDB
                const newChallenge = new BugChallenge({
                    ...challenge,
                    language,
                    difficulty
                });
                await newChallenge.save();
                
                challenges.push(challenge);
            } catch (error) {
                console.error('Error en generación IA, usando fallback a DB');
                aiErrors++;
                
                // Fallback a MongoDB si la IA falla
                const fallbackChallenge = await BugChallenge.aggregate([
                    { $match: { language, difficulty } },
                    { $sample: { size: 1 } }
                ]);

                if (fallbackChallenge.length > 0) {
                    challenges.push(fallbackChallenge[0]);
                }
            }
        }

        // Si no hay suficientes desafíos, intentar obtener más de la DB
        if (challenges.length < questionsCount) {
            const remainingCount = questionsCount - challenges.length;
            const fallbackChallenges = await BugChallenge.aggregate([
                { $match: { language, difficulty } },
                { $sample: { size: remainingCount } }
            ]);
            
            challenges.push(...fallbackChallenges);
        }

        if (challenges.length === 0) {
            return res.status(404).json({
                error: 'No se pudieron generar desafíos y no hay desafíos almacenados'
            });
        }

        res.json({
            challenges,
            totalQuestions: challenges.length
        });

    } catch (error) {
        console.error('Error en getBugChallenges:', error);
        res.status(500).json({ 
            error: 'Error al generar los desafíos de debugging' 
        });
    }
};

module.exports = {
    getBugChallenges
}; 