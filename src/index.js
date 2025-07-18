const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Import routes
const codeGeneratorRoutes = require('./routes/codeGenerator');
const bugChallengeRoutes = require('./routes/bugChallenge');
const buggySQLRoutes = require('./routes/buggySQL');
const dataArchitectRoutes = require('./routes/dataArchitect');

// Load environment variables
dotenv.config();

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/code-generator', codeGeneratorRoutes);
app.use('/api/bug-challenges', bugChallengeRoutes);
app.use('/api/buggy-sql', buggySQLRoutes);
app.use('/api/data-architect', dataArchitectRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
}); 