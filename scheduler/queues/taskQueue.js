const Queue = require('bull');
const logger = require('./../../utils/logger');

// creates a queue for jobs to be executed on task documents
const taskQueue = new Queue('task-queue', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

// defining the process to be executed for the jobs
// the actual process is defined in the file being required over here.
taskQueue.process(require('./../processes/taskProcess'));

// assuming the process function returns a complete or error message 
// adding two event listeners
taskQueue.on('completed', job => {
  // remove whatever job which got completed from the task-queue
  logger.info(`Status for task with id ${job.data.taskId} set to OVERDUE`);
  job.remove();
});

taskQueue.on('failed', function (job, err) {
  logger.error(err.message);
  job.remove();
});


// exports the queue maintained in redis
module.exports = taskQueue;
