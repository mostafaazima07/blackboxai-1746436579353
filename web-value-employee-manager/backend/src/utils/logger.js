const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Set winston color theme
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log transports
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // Error log file transport
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error'
  }),
  
  // Combined log file transport
  new winston.transports.File({
    filename: path.join('logs', 'combined.log')
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports
});

// Add request logging middleware
logger.stream = {
  write: (message) => logger.http(message.trim())
};

// Helper functions for structured logging
const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context
  });
};

const logAPIRequest = (req, context = {}) => {
  logger.http({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    ...context
  });
};

const logCalendarEvent = (eventType, eventDetails, context = {}) => {
  logger.info({
    type: 'calendar_event',
    eventType,
    ...eventDetails,
    ...context
  });
};

const logEmailSent = (emailType, recipient, context = {}) => {
  logger.info({
    type: 'email_sent',
    emailType,
    recipient,
    ...context
  });
};

const logTaskUpdate = (taskId, updateType, changes, context = {}) => {
  logger.info({
    type: 'task_update',
    taskId,
    updateType,
    changes,
    ...context
  });
};

const logUserActivity = (userId, activityType, context = {}) => {
  logger.info({
    type: 'user_activity',
    userId,
    activityType,
    ...context
  });
};

// Export logger and helper functions
module.exports = {
  logger,
  error: logError,
  apiRequest: logAPIRequest,
  calendarEvent: logCalendarEvent,
  emailSent: logEmailSent,
  taskUpdate: logTaskUpdate,
  userActivity: logUserActivity,
  // Direct access to log levels
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  debug: logger.debug.bind(logger),
  http: logger.http.bind(logger)
};

// Catch unhandled errors and rejections
process.on('uncaughtException', (error) => {
  logError(error, { type: 'uncaughtException' });
  // Give the logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (error) => {
  logError(error, { type: 'unhandledRejection' });
});

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}
