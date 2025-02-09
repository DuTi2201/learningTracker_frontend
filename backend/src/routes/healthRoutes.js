const express = require('express');
const router = express.Router();
const os = require('os');
const db = require('../config/database');

// Kiểm tra kết nối database
const checkDatabase = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1', (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const dbStatus = await checkDatabase();
    
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: os.cpus(),
        loadAvg: os.loadavg()
      },
      database: {
        status: dbStatus ? 'connected' : 'disconnected'
      }
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },
      system: {
        loadAvg: os.loadavg(),
        totalMem: os.totalmem(),
        freeMem: os.freemem(),
        cpus: os.cpus().length
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 