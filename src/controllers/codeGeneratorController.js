const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const CodeSnippet = require('../models/CodeSnippet');

// Cargar variables de entorno
dotenv.config();

// Configuración desde variables de entorno
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API = process.env.GEMINI_API_URL;
const TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 10000;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RATE_LIMIT = {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM) || 30,
    requestsPerDay: parseInt(process.env.RATE_LIMIT_DAILY) || 1500
};

// Configuración de generación
const GENERATION_CONFIG = {
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    topK: parseInt(process.env.TOP_K) || 40,
    topP: parseFloat(process.env.TOP_P) || 0.95,
    maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS) || 1024,
};

const difficultyPrompts = {
    beginner: "simple and basic",
    intermediate: "moderate complexity with some logic",
    advanced: "complex and challenging"
};

const generatePrompt = (language, difficulty, snippetLength, count) => {
    return `Generate ${count} different ${difficultyPrompts[difficulty]} ${language} code snippets. 
    Each snippet should be approximately ${snippetLength} lines long.
    Each snippet should be syntactically correct and demonstrate good programming practices.
    Separate each snippet with three dashes like this: ---
    Do not include any markdown code block markers, comments or explanations.
    Make sure each snippet is a complete and working piece of code that makes sense on its own.
    Return only the raw code snippets separated by ---.`;
};

const cleanCodeSnippet = (snippet) => {
    // Eliminar marcadores de markdown (```)
    let cleaned = snippet.replace(/```[\w]*\n?|\n```/g, '');
    
    // Eliminar comentarios
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Eliminar líneas vacías múltiples
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Eliminar espacios en blanco al inicio y final
    cleaned = cleaned.trim();
    
    return cleaned;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateBatch = async (language, difficulty, snippetLength, batchSize, retryCount = 0) => {
    try {
        console.log(`\n📦 Generando batch de ${batchSize} snippets...`);
        const prompt = generatePrompt(language, difficulty, snippetLength, batchSize);
        
        const response = await axios.post(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: GENERATION_CONFIG
        }, { 
            timeout: TIMEOUT,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const content = response.data.candidates[0].content;
            if (content && content.parts && content.parts[0]) {
                const rawSnippets = content.parts[0].text.split('---').map(s => s.trim()).filter(Boolean);
                console.log(`✅ Batch completado: ${rawSnippets.length} snippets recibidos`);
                return rawSnippets.map(snippet => cleanCodeSnippet(snippet)).filter(Boolean);
            }
        }
        return [];
    } catch (error) {
        // Si es error de rate limit y no hemos excedido los reintentos
        if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
            const waitTime = Math.ceil(60000 / RATE_LIMIT.requestsPerMinute); // Tiempo entre peticiones basado en RPM
            console.warn(`⚠️ Rate limit alcanzado, reintentando en ${waitTime/1000} segundos... (intento ${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(waitTime);
            return generateBatch(language, difficulty, snippetLength, batchSize, retryCount + 1);
        }
        
        console.error('❌ Error en batch:', error.message);
        return [];
    }
};

// Función para generar un hash del código
const generateHash = (code) => {
    return crypto.createHash('md5').update(code).digest('hex');
};

// Función para buscar snippets en la base de datos
const findStoredSnippets = async (language, difficulty, snippetLength, count) => {
    try {
        const snippets = await CodeSnippet.aggregate([
            {
                $match: {
                    language,
                    difficulty,
                    snippetLength: { $gte: snippetLength - 2, $lte: snippetLength + 2 }
                }
            },
            { $sample: { size: count } }
        ]);
        
        return snippets.map(s => s.code);
    } catch (error) {
        console.error('❌ Error buscando snippets en DB:', error);
        return [];
    }
};

// Función para guardar snippets en la base de datos
const storeSnippets = async (snippets, language, difficulty, snippetLength) => {
    try {
        const operations = snippets.map(code => ({
            updateOne: {
                filter: { hash: generateHash(code) },
                update: {
                    $setOnInsert: {
                        code,
                        language,
                        difficulty,
                        snippetLength,
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        const result = await CodeSnippet.bulkWrite(operations);
        console.log(`💾 Snippets guardados en DB: ${result.upsertedCount} nuevos, ${snippets.length - result.upsertedCount} existentes`);
    } catch (error) {
        console.error('❌ Error guardando snippets en DB:', error);
    }
};

const generateCode = async (req, res) => {
    const startTime = Date.now();
    try {
        // Verificar que tenemos las credenciales necesarias
        if (!GEMINI_API_KEY || !GEMINI_API) {
            throw new Error('Missing required environment variables: GEMINI_API_KEY or GEMINI_API_URL');
        }

        console.log('\n🚀 Nueva solicitud de generación de código recibida:');
        const { language, difficulty, snippetLength, count = 10 } = req.body;
        console.log('📝 Parámetros recibidos:', {
            language,
            difficulty,
            snippetLength,
            count
        });

        if (!language || !difficulty || !snippetLength) {
            console.error('❌ Error: Faltan parámetros requeridos');
            return res.status(400).json({ 
                error: 'Language, difficulty and snippetLength are required' 
            });
        }

        // Primero intentar obtener snippets de la base de datos
        console.log('🔍 Buscando snippets en la base de datos...');
        const storedSnippets = await findStoredSnippets(language, difficulty, snippetLength, count);
        
        if (storedSnippets.length >= count) {
            console.log(`✨ Encontrados ${storedSnippets.length} snippets en la base de datos`);
            return res.json({
                success: true,
                data: storedSnippets.slice(0, count),
                metadata: {
                    language,
                    difficulty,
                    snippetLength,
                    totalGenerated: storedSnippets.length,
                    uniqueGenerated: storedSnippets.length,
                    timeElapsedSeconds: (Date.now() - startTime) / 1000,
                    source: "database"
                }
            });
        }

        // Si no hay suficientes snippets en la DB, generar nuevos
        const remainingCount = count - storedSnippets.length;
        const batches = Math.ceil(remainingCount / BATCH_SIZE);
        console.log(`\n🎯 Generando ${batches} batches de ${BATCH_SIZE} snippets cada uno...`);
        
        let allSnippets = [...storedSnippets];
        for (let i = 0; i < batches; i++) {
            const remainingForBatch = remainingCount - (i * BATCH_SIZE);
            const currentBatchSize = Math.min(BATCH_SIZE, remainingForBatch);
            
            console.log(`\n🔄 Procesando batch ${i + 1}/${batches} (${currentBatchSize} snippets)`);
            const batchSnippets = await generateBatch(language, difficulty, snippetLength, currentBatchSize);
            allSnippets = allSnippets.concat(batchSnippets);
            
            console.log(`📊 Progreso: ${allSnippets.length}/${count} snippets generados`);
            
            // Guardar los nuevos snippets en la base de datos
            await storeSnippets(batchSnippets, language, difficulty, snippetLength);
            
            // Esperar entre batches basado en el rate limit
            if (i < batches - 1) {
                const waitTime = Math.ceil(60000 / (RATE_LIMIT.requestsPerMinute * 2));
                await sleep(waitTime);
            }
        }

        // Filtrar snippets duplicados
        const uniqueSnippets = [...new Set(allSnippets)];
        
        const endTime = Date.now();
        const timeElapsed = (endTime - startTime) / 1000;
        
        console.log(`\n🎉 Generación completada en ${timeElapsed.toFixed(2)} segundos.`);
        console.log(`📊 Estadísticas finales:
        - Snippets solicitados: ${count}
        - Snippets de DB: ${storedSnippets.length}
        - Snippets generados: ${allSnippets.length - storedSnippets.length}
        - Snippets únicos: ${uniqueSnippets.length}
        - Tiempo promedio por snippet: ${(timeElapsed / allSnippets.length).toFixed(2)} segundos
        - Rate limits: ${RATE_LIMIT.requestsPerMinute} RPM / ${RATE_LIMIT.requestsPerDay} por día`);
        
        res.json({
            success: true,
            data: uniqueSnippets,
            metadata: {
                language,
                difficulty,
                snippetLength,
                totalGenerated: allSnippets.length,
                uniqueGenerated: uniqueSnippets.length,
                timeElapsedSeconds: timeElapsed,
                batchesProcessed: batches,
                fromDatabase: storedSnippets.length,
                fromAPI: allSnippets.length - storedSnippets.length,
                model: "gemini-2.0-flash-lite"
            }
        });

    } catch (error) {
        const timeElapsed = (Date.now() - startTime) / 1000;
        console.error(`\n❌ Error en la generación de código (${timeElapsed.toFixed(2)} segundos):`, error);
        console.error('Detalles del error:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Error generating code snippets',
            details: error.message,
            timeElapsedSeconds: timeElapsed
        });
    }
};

module.exports = {
    generateCode
}; 