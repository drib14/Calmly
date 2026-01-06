const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
    'http://localhost:5173',
    'https://calmly-web.vercel.app',
    process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : null
].filter(Boolean);

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/identities', require('./routes/identityRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/journal', require('./routes/journalRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));

app.get('/', (req, res) => {
  res.send('Calmly API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    // Ensure we return JSON and not default HTML for 500s
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        error: process.env.NODE_ENV === 'production' ? null : err
    });
});

module.exports = app;
