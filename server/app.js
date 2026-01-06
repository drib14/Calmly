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

module.exports = app;
