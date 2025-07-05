const axios = require('axios');
const DataArchitectChallenge = require('../models/DataArchitectChallenge');

// Mapeo de categorías a tipos válidos
const CATEGORY_TYPES = {
    normalization: ['1NF_to_2NF', '2NF_to_3NF', '3NF_to_BCNF', 'many_to_many'],
    constraints: ['primary_key', 'foreign_key', 'unique', 'check', 'not_null'],
    indexing: ['performance_optimization', 'join_optimization', 'composite_indexes', 'covering_indexes'],
    views: ['reporting_views', 'materialized_views', 'security_views', 'aggregation_views'],
    design: ['entity_relationship', 'data_warehouse', 'temporal_data', 'audit_tracking']
};

const generatePrompt = (difficulty, category) => {
    const validTypes = CATEGORY_TYPES[category] || [];
    const typesStr = validTypes.join(', ');

    return `Generate a database architecture challenge with the following parameters:
    - Difficulty: ${difficulty}
    - Category: ${category}
    - Valid types for this category: ${typesStr}

    The response should be a valid JSON object following this structure:
    {
        "title": "Clear, concise title describing the challenge",
        "description": "Detailed problem description",
        "category": "${category}",
        "type": "MUST BE ONE OF: ${typesStr}",
        "initialSchema": {
            "tables": [
                {
                    "name": "table name",
                    "columns": [
                        {
                            "name": "column name",
                            "type": "SQL type",
                            "constraints": ["constraints if any"],
                            "description": "what this column represents"
                        }
                    ],
                    "constraints": ["table level constraints"],
                    "indexes": ["existing indexes if any"]
                }
            ],
            "relationships": [
                {
                    "type": "1:N or N:M or 1:1",
                    "tables": ["table1", "table2"],
                    "description": "relationship description"
                }
            ]
        },
        "task": {
            "objective": "Clear statement of what needs to be done",
            "requirements": ["specific requirements"],
            "hints": ["helpful hints for solving"]
        },
        "expectedSolution": {
            "tables": [same structure as initialSchema],
            "relationships": [
                {
                    "type": "1:N or N:M or 1:1",
                    "tables": ["table1", "table2"],
                    "description": "relationship description"
                }
            ],
            "sql_statements": ["CREATE TABLE", "ALTER TABLE statements"],
            "explanation": "Detailed explanation of the solution"
        },
        "validation": {
            "test_cases": [
                {
                    "input": "sample data or query",
                    "expected_output": "expected result"
                }
            ],
            "success_criteria": ["criteria for correct solution"]
        },
        "metadata": {
            "points": number,
            "estimated_time": "estimated completion time",
            "prerequisites": ["required knowledge"],
            "related_concepts": ["related database concepts"]
        }
    }

    IMPORTANT:
    1. The 'type' field MUST be exactly one of the valid types listed above
    2. Make the challenge realistic and practical
    3. Include clear success criteria
    4. Provide helpful hints without giving away the solution
    5. Use real-world naming conventions
    6. Include proper SQL types and constraints
    7. Add appropriate indexes for performance
    8. Define relationships between tables
    9. Return ONLY the JSON object, no markdown or additional text`;
};

// Función auxiliar para generar índices
const generateIndexes = (table) => {
    const indexes = [];
    
    // Índices para claves foráneas
    table.columns.forEach(column => {
        if (column.constraints && column.constraints.includes('FOREIGN KEY')) {
            indexes.push({
                name: `idx_${table.name.toLowerCase()}_${column.name.toLowerCase()}`,
                columns: [column.name],
                type: 'INDEX'
            });
        }
    });

    // Índices compuestos para tablas de relación
    const fkColumns = table.columns
        .filter(c => c.constraints && c.constraints.includes('FOREIGN KEY'))
        .map(c => c.name);
    
    if (fkColumns.length > 1) {
        indexes.push({
            name: `idx_${table.name.toLowerCase()}_composite`,
            columns: fkColumns,
            type: 'INDEX'
        });
    }

    // Índices para columnas frecuentemente buscadas
    const commonSearchColumns = ['name', 'code', 'date', 'status', 'type'];
    table.columns.forEach(column => {
        const columnNameLower = column.name.toLowerCase();
        if (commonSearchColumns.some(searchCol => columnNameLower.includes(searchCol.toLowerCase()))) {
            indexes.push({
                name: `idx_${table.name.toLowerCase()}_${columnNameLower}`,
                columns: [column.name],
                type: 'INDEX'
            });
        }
    });

    return indexes;
};

const validateGeneratedContent = (content, category) => {
    const validTypes = CATEGORY_TYPES[category] || [];
    
    if (!validTypes.includes(content.type)) {
        throw new Error(`Invalid type "${content.type}" for category "${category}". Valid types are: ${validTypes.join(', ')}`);
    }

    // Validar campos requeridos
    if (!content.title || !content.description || 
        !content.initialSchema || !content.task || 
        !content.expectedSolution) {
        throw new Error('Missing required fields in generated content');
    }

    // Enriquecer el contenido con relaciones e índices
    if (content.expectedSolution.tables && content.expectedSolution.tables.length > 0) {
        content.expectedSolution.relationships = content.expectedSolution.relationships || [];
        
        // Analizar las tablas para inferir relaciones
        const tables = content.expectedSolution.tables;
        for (const table of tables) {
            // Generar índices para la tabla
            table.indexes = generateIndexes(table);

            // Inferir relaciones
            for (const column of table.columns) {
                if (column.constraints && column.constraints.includes('FOREIGN KEY')) {
                    const refTableName = column.name.replace('ID', '');
                    const refTable = tables.find(t => t.name === refTableName + 's');
                    
                    if (refTable) {
                        content.expectedSolution.relationships.push({
                            type: '1:N',
                            tables: [refTable.name, table.name],
                            description: `${refTable.name} tiene muchos ${table.name}`
                        });
                    }
                }
            }
        }
    }

    return true;
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
        let jsonStr = rawText.replace(/```json\n|\n```|```/g, '').trim();
        
        // Asegurarse de que el string es un JSON válido
        if (!jsonStr.startsWith('{')) {
            const startIndex = jsonStr.indexOf('{');
            if (startIndex !== -1) {
                jsonStr = jsonStr.substring(startIndex);
            }
        }
        
        const generatedContent = JSON.parse(jsonStr);

        // Asegurar que los campos requeridos estén presentes
        const challenge = {
            ...generatedContent,
            difficulty,
            category
        };

        // Asegurar que las estructuras anidadas existan
        challenge.initialSchema = challenge.initialSchema || { tables: [], relationships: [] };
        challenge.task = challenge.task || { objective: '', requirements: [], hints: [] };
        challenge.expectedSolution = challenge.expectedSolution || { tables: [], sql_statements: [], explanation: '' };
        challenge.validation = challenge.validation || { test_cases: [], success_criteria: [] };
        challenge.metadata = challenge.metadata || { 
            points: 0, 
            estimated_time: '', 
            prerequisites: [], 
            related_concepts: [] 
        };

        // Validar la estructura y tipos
        validateGeneratedContent(challenge, category);

        return challenge;
    } catch (error) {
        console.error('Error generating with Gemini:', error);
        throw error;
    }
};

const getDataArchitectChallenge = async (req, res) => {
    const { difficulty, category } = req.body;

    if (!difficulty || !category) {
        return res.status(400).json({ 
            error: 'Se requieren dificultad y categoría' 
        });
    }

    if (!CATEGORY_TYPES[category]) {
        return res.status(400).json({
            error: `Categoría inválida. Categorías válidas: ${Object.keys(CATEGORY_TYPES).join(', ')}`
        });
    }

    try {
        let challenge;
        let aiErrors = 0;
        const MAX_AI_RETRIES = 3;

        // Intentar generar con IA
        while (aiErrors < MAX_AI_RETRIES && !challenge) {
            try {
                challenge = await generateWithAI(difficulty, category);
                
                // Guardar en MongoDB
                const newChallenge = new DataArchitectChallenge(challenge);
                await newChallenge.save();
                
                return res.json(challenge);
            } catch (error) {
                console.error('Error en generación IA:', error);
                aiErrors++;
                
                if (aiErrors >= MAX_AI_RETRIES) {
                    console.log('Demasiados errores de IA, usando fallback DB');
                    // Fallback a MongoDB
                    const fallbackChallenge = await DataArchitectChallenge.aggregate([
                        { 
                            $match: { 
                                difficulty,
                                category
                            }
                        },
                        { $sample: { size: 1 } }
                    ]);

                    if (fallbackChallenge.length > 0) {
                        return res.json(fallbackChallenge[0]);
                    }

                    // Si no hay desafíos en la DB, crear uno predeterminado
                    const defaultChallenge = createDefaultChallenge(difficulty, category);
                    const newChallenge = new DataArchitectChallenge(defaultChallenge);
                    await newChallenge.save();
                    
                    return res.json(defaultChallenge);
                }
            }
        }
    } catch (error) {
        console.error('Error en getDataArchitectChallenge:', error);
        res.status(500).json({ 
            error: 'Error al generar el desafío de arquitectura de datos' 
        });
    }
};

const createDefaultChallenge = (difficulty, category) => {
    const type = CATEGORY_TYPES[category][0]; // Usar el primer tipo válido de la categoría
    
    const defaultChallenges = {
        normalization: {
            title: "Normalización de Tabla de Empleados",
            description: "La tabla actual tiene problemas de redundancia de datos. Necesitamos aplicar la segunda forma normal.",
            type: "2NF_to_3NF",
            difficulty,
            category,
            initialSchema: {
                tables: [{
                    name: "empleados",
                    columns: [
                        {
                            name: "id",
                            type: "INT",
                            constraints: ["PRIMARY KEY"],
                            description: "ID único del empleado"
                        },
                        {
                            name: "nombre",
                            type: "VARCHAR(100)",
                            description: "Nombre del empleado"
                        },
                        {
                            name: "departamento_nombre",
                            type: "VARCHAR(100)",
                            description: "Nombre del departamento"
                        },
                        {
                            name: "departamento_ubicacion",
                            type: "VARCHAR(100)",
                            description: "Ubicación del departamento"
                        }
                    ]
                }],
                relationships: []
            },
            task: {
                objective: "Normalizar la tabla para eliminar la redundancia de datos del departamento",
                requirements: [
                    "Crear una tabla separada para departamentos",
                    "Establecer las relaciones correctas",
                    "Mantener la integridad referencial"
                ],
                hints: [
                    "Piensa en qué datos se están repitiendo",
                    "Considera cómo relacionar las tablas"
                ]
            },
            expectedSolution: {
                tables: [
                    {
                        name: "departamentos",
                        columns: [
                            {
                                name: "id",
                                type: "INT",
                                constraints: ["PRIMARY KEY"],
                                description: "ID único del departamento"
                            },
                            {
                                name: "nombre",
                                type: "VARCHAR(100)",
                                description: "Nombre del departamento"
                            },
                            {
                                name: "ubicacion",
                                type: "VARCHAR(100)",
                                description: "Ubicación del departamento"
                            }
                        ]
                    },
                    {
                        name: "empleados",
                        columns: [
                            {
                                name: "id",
                                type: "INT",
                                constraints: ["PRIMARY KEY"],
                                description: "ID único del empleado"
                            },
                            {
                                name: "nombre",
                                type: "VARCHAR(100)",
                                description: "Nombre del empleado"
                            },
                            {
                                name: "departamento_id",
                                type: "INT",
                                constraints: ["FOREIGN KEY"],
                                description: "ID del departamento"
                            }
                        ]
                    }
                ],
                sql_statements: [
                    "CREATE TABLE departamentos (id INT PRIMARY KEY, nombre VARCHAR(100), ubicacion VARCHAR(100));",
                    "CREATE TABLE empleados_new (id INT PRIMARY KEY, nombre VARCHAR(100), departamento_id INT, FOREIGN KEY (departamento_id) REFERENCES departamentos(id));"
                ],
                explanation: "Se separó la información del departamento en su propia tabla para eliminar la redundancia. Se mantiene la relación entre empleados y departamentos mediante una clave foránea."
            },
            validation: {
                test_cases: [
                    {
                        input: "SELECT * FROM empleados WHERE departamento_id = 1;",
                        expected_output: "Debe retornar todos los empleados del departamento 1"
                    }
                ],
                success_criteria: [
                    "No hay datos redundantes de departamentos",
                    "Existe una relación correcta entre empleados y departamentos",
                    "Se mantiene la integridad referencial"
                ]
            },
            metadata: {
                points: 100,
                estimated_time: "30 minutos",
                prerequisites: ["Conceptos básicos de SQL", "Primera Forma Normal"],
                related_concepts: ["Segunda Forma Normal", "Dependencias Funcionales"]
            }
        }
        // Agregar más desafíos predeterminados para otras categorías según sea necesario
    };

    return defaultChallenges[category] || {
        title: `Desafío de ${category}`,
        description: "Por favor, intenta de nuevo más tarde.",
        type,
        difficulty,
        category,
        initialSchema: {
            tables: [],
            relationships: []
        },
        task: {
            objective: "Objetivo por definir",
            requirements: [],
            hints: []
        },
        expectedSolution: {
            tables: [],
            sql_statements: [],
            explanation: "Solución por definir"
        },
        validation: {
            test_cases: [],
            success_criteria: []
        },
        metadata: {
            points: 0,
            estimated_time: "N/A",
            prerequisites: [],
            related_concepts: []
        }
    };
};

module.exports = {
    getDataArchitectChallenge
}; 