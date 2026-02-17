const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Message = require('../models/Message');

// @desc    Get all messages between two users
// @route   GET /api/v1/messages/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
    const messages = await Message.find({
        $or: [
            { sender: req.user.id, receiver: req.params.userId },
            { sender: req.params.userId, receiver: req.user.id }
        ]
    }).sort('createdAt').populate('sender receiver', 'name avatarUrl role');

    const mappedMessages = messages.map(msg => {
        if (!msg.sender || !msg.receiver) return null;
        return {
            id: msg._id,
            senderId: msg.sender._id,
            senderName: msg.sender.name,
            senderAvatar: msg.sender.avatarUrl,
            receiverId: msg.receiver._id,
            content: msg.content,
            timestamp: msg.createdAt,
            isRead: msg.isRead
        };
    }).filter(msg => msg !== null);

    res.status(200).json({
        success: true,
        count: mappedMessages.length,
        data: mappedMessages
    });
});

// @desc    Send a message (REST fallback/history)
// @route   POST /api/v1/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { receiverId, content } = req.body;

    const message = await Message.create({
        sender: req.user.id,
        receiver: receiverId,
        content
    });

    res.status(201).json({
        success: true,
        data: {
            id: message._id,
            senderId: message.sender,
            receiverId: message.receiver,
            content: message.content,
            timestamp: message.createdAt,
            isRead: message.isRead
        }
    });
});

// @desc    Get current user's conversations
// @route   GET /api/v1/messages/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
    const messages = await Message.find({
        $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    }).sort('-createdAt').populate('sender receiver', 'name avatarUrl role');

    console.log(`Debug: Found ${messages.length} messages for user ${req.user.id}`);

    const conversationMap = new Map();

    messages.forEach(msg => {
        if (!msg.sender || !msg.receiver) {
            console.log(`Debug: Message ${msg._id} has null sender or receiver.`);
            return;
        }

        const senderId = msg.sender._id.toString();
        const receiverId = msg.receiver._id.toString();

        const partner = senderId === req.user.id ? msg.receiver : msg.sender;
        if (!partner || !partner._id) return;

        const partnerId = partner._id.toString();

        if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, {
                partnerId,
                partnerName: partner.name,
                partnerAvatar: partner.avatarUrl,
                partnerRole: partner.role,
                lastMessage: {
                    id: msg._id,
                    senderId: msg.sender._id,
                    receiverId: msg.receiver._id,
                    content: msg.content,
                    timestamp: msg.createdAt,
                    isRead: msg.isRead
                }
            });
        }
    });

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({
        success: true,
        data: conversations
    });
});
