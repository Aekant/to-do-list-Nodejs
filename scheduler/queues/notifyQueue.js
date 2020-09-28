const Queue = require('bull');
const logger = require('../../utils/logger');

// creates a new queue
const notifyQueue = new Queue('notify-queue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

notifyQueue.process(require('./../processes/notifyProcess'));

notifyQueue.on('completed', job => {
  logger.info('Notifying Email sent to users!!');
  job.remove();
});

notifyQueue.on('failed', function (job, err) {
  logger.error(err.message);
  job.remove();
});

module.exports = notifyQueue;