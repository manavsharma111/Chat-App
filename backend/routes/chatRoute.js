const express = require('express')
const chatController = require('../controller/chatController')
const response = require('../utlis/responseHandler')
const authMiddleware = require('../middlewares/authMiddleware')
const { multerMiddleware } = require('../config/cloudinary')

const router = express.Router()

// send message
router.post('/send-message', authMiddleware, multerMiddleware, chatController.sendMessage)
// get all conversation
router.get('/conversations', authMiddleware, chatController.getAllConversation)
// get messages
router.get('/conversations/:conversationId/messages', authMiddleware, chatController.getMessages)
// mark as read
router.put('/messages/read', authMiddleware, chatController.markAsRead)
// delete message
router.delete('/messages/:messageId/delete', authMiddleware, chatController.deleteMessage)
// edit message
router.put('/messages/:messageId/edit', authMiddleware, chatController.editMessage)

module.exports = router

