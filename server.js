const app = require('./app');
const http = require('http');
const socketio = require('socket.io');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

// Socket.io setup
const io = socketio(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Socket logic will be imported here
require('./sockets/socket')(io);

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    console.error(err.stack);
    // Close server & exit process
    // server.close(() => process.exit(1));
});
