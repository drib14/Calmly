const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost:5173',
    'https://calmly-web.vercel.app',
    process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : null
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Online Users Map (userId -> socketId)
const onlineUsers = new Map();

io.on('connection', (socket) => {
    // console.log('Socket connected:', socket.id);

    // Auth Handshake
    const token = socket.handshake.auth?.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Or refresh token? Usually Access.
            if (decoded && decoded.id) {
                onlineUsers.set(decoded.id, socket.id);
                // Broadcast updated list
                io.emit('online_users', Array.from(onlineUsers.keys()));

                socket.on('disconnect', () => {
                    onlineUsers.delete(decoded.id);
                    io.emit('online_users', Array.from(onlineUsers.keys()));
                });
            }
        } catch (err) {
            // console.error('Socket Auth Failed:', err.message);
        }
    }
});

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

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // For Vercel
