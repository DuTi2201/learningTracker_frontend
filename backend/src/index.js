require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const cron = require('node-cron');
const NotificationService = require('./services/notificationService');

// Import routes
const materialRoutes = require('./routes/materialRoutes');
const eventRoutes = require('./routes/eventRoutes');
const goalRoutes = require('./routes/goalRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  abortOnLimit: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/materials', materialRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);

// Cron jobs
// Chạy kiểm tra deadline mỗi giờ
cron.schedule('0 * * * *', async () => {
  console.log('Running deadline check...');
  await NotificationService.checkDeadlines();
});

// Chạy kiểm tra và gửi thông báo mỗi phút
cron.schedule('* * * * *', async () => {
  console.log('Processing scheduled notifications...');
  const notifications = await NotificationService.processScheduledNotifications();
  if (notifications.length > 0) {
    console.log(`Processed ${notifications.length} notifications`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});