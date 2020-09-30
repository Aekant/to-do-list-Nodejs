const winston = require('winston');

// creating options for File transport and Console transport
const options = {
  File: {
    level: 'info',
    filename: `${__dirname}/../logs/app.log`,
    json: true,
    maxsize: 10485760, //10 Mb after that a new file will be created with a suffix
    colorize: true
  },
  Console: {
    level: 'debug',
    json: false,
    colorize: true
  }
}

// creating our own logger with two transports, 1 will be a log file
// 2 console
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.File),
    new winston.transports.Console(options.Console)
  ],
  exitOnError: false
});

logger.stream = {
  write: function (message) {
    logger.info(message);
  }
}

module.exports = logger;