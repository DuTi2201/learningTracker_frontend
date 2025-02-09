const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

// Log middleware để debug
router.use((req, res, next) => {
  console.log('AI Assistant Route được gọi:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
});

// Chat history routes
router.get('/chats', aiAssistantController.getChats);
router.post('/chats', aiAssistantController.createChat);
router.get('/chats/:id', aiAssistantController.getChatById);
router.delete('/chats/:id', aiAssistantController.deleteChat);
router.put('/chats/:id/pin', aiAssistantController.togglePinChat);
router.get('/chats/search', aiAssistantController.searchChats);

// Chat message route
router.post('/messages', aiAssistantController.chat);

module.exports = router; 