const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');

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
    const token = socket.handshake.auth?.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            if (decoded && decoded.id) {
                onlineUsers.set(decoded.id, socket.id);
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
