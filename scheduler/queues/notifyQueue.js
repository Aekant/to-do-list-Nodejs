const Queue = require('bull');

// creates a new queue
const notifyQueue = new Queue('notify-queue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

notifyQueue.process(require('./../processes/notifyProcess'));

notifyQueue.on('completed', job => {
  console.log('Job Completed!');
  job.remove();
});

notifyQueue.on('failed', function (job, err) {
  console.log(err.message);
  job.remove();
});

module.exports = notifyQueue;