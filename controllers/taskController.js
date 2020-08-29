// Importing the Task Model to create a task
const Task = require('./../models/taskModel');

// GET routes handlers
module.exports.getAllTasks = async (req, res) => {
  try {
    // Task.find() returns a query
    // we are awaiting the resolved value for the query
    let tasks = await Task.find();
    res.status(200).json({
      message: 'Success',
      data: {
        tasks
      }
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// POST routes handlers
module.exports.createTask = async (req, res) => {
  try {
    // Task.create() returns a promise
    // we will await the resolved value of this promise
    let task = await Task.create(req.body);
    res.status(201).json({
      message: 'Success',
      data: {
        task
      }
    });
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// PATCH route handlers