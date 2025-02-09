const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/notifications
router.get('/', notificationController.getAllNotifications);

// GET /api/notifications/unread
router.get('/unread', notificationController.getUnreadNotifications);

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/read-all
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 