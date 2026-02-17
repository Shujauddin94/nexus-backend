const express = require('express');
const {
    getMessages,
    sendMessage,
    getConversations
} = require('../controllers/messageController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/:userId', getMessages);
router.post('/', sendMessage);

module.exports = router;
