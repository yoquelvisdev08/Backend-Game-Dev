# Backend para Juegos de Programación

Este es el backend que soporta múltiples juegos de programación, incluyendo un juego de velocidad de escritura de código y un juego de encontrar bugs. Utiliza la API de Google Gemini para generar contenido y MongoDB para almacenamiento.

## 🎮 Juegos Disponibles

### 1. Juego de Velocidad de Código
- Generación de snippets de código
- Sistema de dificultad configurable
- Múltiples lenguajes de programación

### 2. Bug Finder Challenge
- Desafíos de debugging con opciones múltiples
- Explicaciones detalladas de los bugs
- Diferentes niveles de dificultad
- Soporte para múltiples lenguajes

## 🚀 Características

- Generación de contenido usando Google Gemini API
- Almacenamiento en caché con MongoDB Atlas
- Sistema de dificultad configurable
- Control de rate limiting
- Manejo de errores y reintentos
- Optimización de rendimiento (6-7 segundos por generación)
- Sistema de fallback a base de datos

## 📋 Prerrequisitos

- Node.js (v14 o superior)
- MongoDB Atlas cuenta
- API Key de Google Gemini

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd backend-game-dev
```

2. Instala las dependencias:
```bash
npm install
```

3. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

4. Configura las variables de entorno en el archivo `.env`

## ⚙️ Configuración

Asegúrate de configurar las siguientes variables de entorno en tu archivo `.env`:

- `PORT`: Puerto del servidor
- `GEMINI_API_KEY`: Tu API key de Google Gemini
- `GEMINI_API_URL`: URL de la API de Gemini
- `MONGODB_URI`: URL de conexión a MongoDB Atlas
- `MONGODB_DB_NAME`: Nombre de la base de datos
- `MONGODB_COLLECTION`: Nombre de la colección

Ver `.env.example` para todas las variables disponibles.

## 🚀 Uso

Para iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

Para iniciar el servidor en modo producción:
```bash
npm start
```

## 📡 API Endpoints

Ver [ENDPOINTS.md](ENDPOINTS.md) para la documentación detallada de todos los endpoints disponibles.

## ⚡ Rate Limits

- 30 requests por minuto
- 1500 requests por día

## 📦 Estructura del Proyecto

```
src/
  ├── config/
  │   └── database.js
  ├── controllers/
  │   ├── codeGeneratorController.js
  │   └── bugChallengeController.js
  ├── models/
  │   ├── CodeSnippet.js
  │   └── BugChallenge.js
  ├── routes/
  │   ├── codeGenerator.js
  │   └── bugChallenge.js
  └── index.js
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 