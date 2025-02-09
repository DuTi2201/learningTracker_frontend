const winston = require('winston');
const path = require('path');

// Định nghĩa format log
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Ghi log error vào file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Ghi tất cả log vào file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Thêm console transport trong môi trường development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Hàm helper để log với context
const logWithContext = (level, message, context = {}) => {
  logger.log({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  error: (message, context) => logWithContext('error', message, context),
  warn: (message, context) => logWithContext('warn', message, context),
  info: (message, context) => logWithContext('info', message, context),
  debug: (message, context) => logWithContext('debug', message, context),
  
  // Log request
  logRequest: (req, res, next) => {
    const startTime = Date.now();
    
    // Log khi request kết thúc
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
    });
    
    next();
  },

  // Log error
  logError: (err, req, res, next) => {
    logger.error('Request error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
      body: req.body,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
    
    next(err);
  }
}; 