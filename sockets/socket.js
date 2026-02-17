const socketIO = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        // Join a meeting room
        socket.on('join-room', (roomId, userId) => {
            console.log(`User ${userId} joined room ${roomId}`);
            socket.join(roomId);
            socket.to(roomId).emit('user-connected', userId);

            // Disconnect event within room
            socket.on('disconnect', () => {
                console.log(`User ${userId} disconnected from room ${roomId}`);
                socket.to(roomId).emit('user-disconnected', userId);
            });
        });

        // WebRTC Signaling
        socket.on('offer', (payload) => {
            console.log(`Signal: offer from ${payload.senderId} to ${payload.target}`);
            io.to(payload.target).emit('offer', payload);
        });

        socket.on('answer', (payload) => {
            console.log(`Signal: answer from ${socket.id} to ${payload.target}`);
            io.to(payload.target).emit('answer', payload);
        });

        socket.on('ice-candidate', (incoming) => {
            console.log(`Signal: ice-candidate from ${socket.id} to ${incoming.target}`);
            io.to(incoming.target).emit('ice-candidate', incoming.candidate);
        });

        socket.on('end-call', (payload) => {
            console.log(`Signal: end-call from ${socket.id} to ${payload.target}`);
            io.to(payload.target).emit('end-call');
        });

        // Chat Messaging
        socket.on('send-message', async (payload) => {
            // payload = { senderId, receiverId, content }
            try {
                // Save to database
                const Message = require('../models/Message');
                const newMessage = await Message.create({
                    sender: payload.senderId,
                    receiver: payload.receiverId,
                    content: payload.content,
                    isRead: false
                });

                // Emit to receiver
                socket.to(payload.receiverId).emit('receive-message', {
                    senderId: payload.senderId,
                    content: payload.content,
                    createdAt: newMessage.createdAt
                });
            } catch (error) {
                console.error('Error saving message via socket:', error);
            }
        });

        // Register user socket mapping
        socket.on('register-user', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} registered for private messages`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
        });
    });
};

module.exports = socketIO;
