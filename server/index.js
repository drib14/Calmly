const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to database:', err);
    // Ensure we exit if the database connection fails at startup
    // to prevent "buffering timed out" errors for users hitting a zombie server
    process.exit(1);
});
