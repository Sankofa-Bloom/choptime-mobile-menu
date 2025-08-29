/**
 * LOGGER UTILITY
 * Structured logging with different levels and transports
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'server', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level based on environment
const CURRENT_LEVEL = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()]
  : (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

/**
 * Format log message
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  if (process.env.LOG_FORMAT === 'simple') {
    return `[${timestamp}] ${level}: ${message}`;
  }

  return JSON.stringify(logEntry);
}

/**
 * Write to file
 */
function writeToFile(filename, content) {
  const filePath = path.join(logsDir, filename);
  fs.appendFileSync(filePath, content + '\n');
}

/**
 * Logger class
 */
class Logger {
  constructor() {
    this.level = CURRENT_LEVEL;
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formatted = formatMessage('ERROR', message, meta);
      console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
      writeToFile('error.log', formatted);
    }
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formatted = formatMessage('WARN', message, meta);
      console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
      writeToFile('combined.log', formatted);
    }
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = formatMessage('INFO', message, meta);
      console.info(`\x1b[36m${formatted}\x1b[0m`); // Cyan
      writeToFile('combined.log', formatted);
    }
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formatted = formatMessage('DEBUG', message, meta);
      console.debug(`\x1b[35m${formatted}\x1b[0m`); // Magenta
      writeToFile('debug.log', formatted);
    }
  }

  /**
   * Log security event
   */
  security(message, meta = {}) {
    const formatted = formatMessage('SECURITY', message, meta);
    console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
    writeToFile('security.log', formatted);
  }

  /**
   * Log request
   */
  request(req, res, responseTime) {
    if (this.level >= LOG_LEVELS.INFO) {
      const meta = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      this.info('HTTP Request', meta);
    }
  }
}

// Create singleton logger instance
const logger = new Logger();

// Export logger instance and utilities
module.exports = {
  logger,
  Logger,
  LOG_LEVELS
};