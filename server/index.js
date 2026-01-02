const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Added for socket auth

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/clips', require('./routes/clipRoutes'));

app.get('/', (req, res) => {
  res.send('Calmly API is running...');
});

// Socket.io Middleware for Authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        // Use ACCESS_TOKEN_SECRET if JWT_SECRET is not consistent, but env has JWT_SECRET now.
        // Fallback to ACCESS_TOKEN_SECRET just in case, as authController uses it.
        const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        socket.user = decoded; // Attach user to socket
        next();
    } catch (err) {
        console.error("Socket Auth Error:", err.message);
        next(new Error('Authentication error'));
    }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Auto-join user room based on authenticated ID
  if (socket.user && socket.user.id) {
      socket.join(socket.user.id);
      console.log(`User joined room: ${socket.user.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // For Vercel
