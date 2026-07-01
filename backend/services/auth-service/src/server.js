// backend/services/auth-service/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());

// ========== DATABASE ==========
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auth-service';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log(' Auth Service connected to MongoDB'))
.catch(err => console.error(' MongoDB connection error:', err));

// ========== ROUTES ==========
app.use('/', authRoutes);

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({
        service: 'auth-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(` Auth Service running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});