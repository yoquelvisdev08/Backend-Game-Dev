# 🎮 API Endpoints Documentation

## 🚀 Code Generator Endpoints

### Generate Code Snippets
```http
POST /api/code-generator/generate
```

#### Request Body
```json
{
    "difficulty": "easy | medium | hard",
    "length": "number",
    "language": "string"
}
```

#### Response
```json
{
    "code": "string",
    "language": "string",
    "difficulty": "string"
}
```

## 🐛 Bug Challenge Endpoints

### Generate Bug Challenges
```http
POST /api/bug-challenges/generate
```

#### Request Body
```json
{
    "language": "javascript | python | java | cpp | typescript",
    "difficulty": "easy | medium | hard",
    "questionsCount": "number"
}
```

#### Response
```json
{
    "challenges": [
        {
            "buggyCode": "string - código con el bug",
            "options": [
                "string - opción 1",
                "string - opción 2",
                "string - opción 3",
                "string - opción 4"
            ],
            "correctAnswer": "number - índice de la respuesta correcta (0-3)",
            "explanation": "string - explicación del bug",
            "language": "string",
            "difficulty": "string"
        }
    ],
    "totalQuestions": "number"
}
```

## 📊 SQL Challenge Endpoints

### Generate SQL Challenges
```http
POST /api/buggy-sql/generate
```

#### Request Body
```json
{
    "difficulty": "easy | medium | hard",
    "category": "string (ver categorías disponibles abajo)",
    "questionsCount": "number",
    "mode": "multiple_choice | direct_correction"
}
```

#### Categorías Disponibles

1. **Categorías Básicas**:
   - `joins`: Problemas con JOINs
   - `subqueries`: Subconsultas
   - `aggregations`: Funciones de agregación
   - `group_by`: Agrupamiento
   - `where_having`: Filtrado de datos
   - `performance`: Rendimiento general
   - `syntax`: Sintaxis SQL

2. **Optimización**:
   - `index_usage`: Uso de índices
   - `query_planning`: Plan de ejecución
   - `redundant_joins`: JOINs redundantes

3. **Manipulación de Datos**:
   - `window_functions`: Funciones de ventana
   - `cte_usage`: Common Table Expressions
   - `data_transformation`: Transformación de datos

4. **Integridad de Datos**:
   - `constraints`: Restricciones y claves
   - `transactions`: Transacciones
   - `null_handling`: Manejo de NULLs

5. **Casos Especiales**:
   - `date_time`: Fechas y tiempos
   - `string_operations`: Operaciones con strings
   - `recursive_queries`: Queries recursivas

#### Response (multiple_choice mode)
```json
{
    "challenges": [
        {
            "buggyQuery": "string - query SQL incorrecta",
            "context": {
                "tableName": "string",
                "tableStructure": {
                    "columns": [
                        {
                            "name": "string",
                            "type": "string",
                            "description": "string"
                        }
                    ]
                },
                "expectedResult": "string",
                "sampleData": "string (opcional)"
            },
            "options": [
                "string - query 1",
                "string - query 2",
                "string - query 3",
                "string - query 4"
            ],
            "correctAnswer": "number (0-3)",
            "explanation": "string",
            "category": "string",
            "difficulty": "string",
            "skillLevel": "beginner | intermediate | advanced",
            "topics": ["performance", "security", "data_integrity", "code_style", "best_practices", "optimization"]
        }
    ],
    "totalQuestions": "number",
    "mode": "multiple_choice"
}
```

#### Response (direct_correction mode)
```json
{
    "challenges": [
        {
            "buggyQuery": "string - query SQL incorrecta",
            "context": {
                "tableName": "string",
                "tableStructure": {
                    "columns": [
                        {
                            "name": "string",
                            "type": "string",
                            "description": "string"
                        }
                    ]
                },
                "expectedResult": "string",
                "sampleData": "string (opcional)"
            },
            "explanation": "string",
            "category": "string",
            "difficulty": "string"
        }
    ],
    "totalQuestions": "number",
    "mode": "direct_correction"
}
```

## 💡 Detalles Importantes

### Flujo de Generación
1. **Intento Principal**: La API intenta generar el contenido usando IA (Gemini)
2. **Almacenamiento**: Si la generación es exitosa, se guarda en MongoDB
3. **Fallback**: Si la IA falla, se utilizan desafíos almacenados en MongoDB

### Límites y Restricciones
- Rate Limits: 30 requests/minuto
- Límite Diario: 1500 requests
- Timeout: 10 segundos
- Tamaño de Lote: 10 desafíos máximo

### Códigos de Error
- `400`: Parámetros inválidos o faltantes
- `404`: No se encontraron desafíos
- `429`: Rate limit excedido
- `500`: Error interno del servidor

### Recomendaciones
1. **Caché**: Implementar caché en el cliente para desafíos frecuentes
2. **Retry**: Implementar lógica de reintento con backoff exponencial
3. **Validación**: Validar parámetros antes de hacer la petición

## 🔒 Seguridad
- Todas las peticiones deben incluir headers apropiados
- CORS está habilitado para orígenes permitidos
- Rate limiting por IP 