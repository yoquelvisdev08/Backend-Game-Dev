require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const codeGeneratorRoutes = require('./routes/codeGenerator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', codeGeneratorRoutes);

// Conectar a MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
}); 