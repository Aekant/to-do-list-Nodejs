
// the job to be executed is on the mongo database on a particular collection
// we can require the Task model over here but that would cause a circular dependency
// where this process file requires the Task model and inside the task model file 
// we will adding jobs in the queue which requires the task queue file which indeed 
// requires task process. Therefore we will assume here that with the job object we will be
// getting a task id and the Model
module.exports = async function (job) {
  try {
    // using findByIdAndUpdate does not uses .save() so no validators or save hooks will be
    // called
    const Task = require('./../../models/taskModel');
    await Task.findByIdAndUpdate(job.data.taskId, { status: 'OVERDUE' });
    // return resolved if everything is fine
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}