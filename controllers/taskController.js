// Importing the Task Model to create a task
const Task = require('./../models/taskModel');
const APIFeatures = require('./../utils/apiFeatures');
const { Query } = require('mongoose');

// GET routes handlers
module.exports.getAll = async (req, res) => {
  try {
    // Task.find() returns a query
    const features = new APIFeatures(Task.find(), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    // this returns a query which can be chained with a number of methods
    // only when it is awaited it will be passed to the mongo server

    // we are awaiting the resolved value for the query
    // it is only when we await the query, it is sent to the database
    const tasks = await features.query;
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

module.exports.getById = async (req, res) => {
  try {
    // behind the scenes it is equivalent to
    // db.collection.findOne({id: req.params.id})
    let query = Task.findById(req.params.id);
    const task = await query;
    res.status(200).json({
      message: 'Success',
      data: {
        task
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
module.exports.create = async (req, res) => {
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

// PATCH routes handlers
module.exports.updateById = async (req, res) => {
  try {
    // for this we will use the method provided by mongoose on Model
    // Model.findByIdAndUpdate()
    // it takes an id, the object to patch/update with
    // and a few config options such as running validators again
    // to ensure that user did not enter any invalid data
    let query = Task.findByIdAndUpdate(req.params.id, req.body, {
      // returns the updated document
      new: true,
      // checks for invalid data
      // since  we are using the update method, here the validator wont
      // have access to the document being update using this keyword
      // In order to run a full fledge validation check (one in which we check
      // other field values too) we should instead use findOne() by ID and then
      // replace the fields manually and then do .save() method. This will 
      // trigger the validator and will have access to the document using this
      runValidators: true,

      // setting this option will enable us to access the underlying query
      // object when running update validators
      // doesn't work
      // context: 'query'
    });
    const task = await query;
    res.status(200).json({
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

// Delete routes handlers
module.exports.deleteById = async (req, res) => {
  try {
    let query = Task.findByIdAndDelete(req.params.id);
    const task = await query;
    res.status(204).json({
      message: 'Success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// Report generation routes
module.exports.getStats = async (req, res) => {
  try {
    let aggr = Task.aggregate([
      {
        $group: {
          // we don't want to group them by anything, we want to check all of
          // them
          _id: null,
          // since we aren't grouping by anything there would be a single group
          // all docs fall in a single group
          // for each doc falling in this group we increment the total by 1
          total: { $sum: 1 },
          // $in : [<expression to check for>, [<array of values to check from>]]
          // $cond : [<condition>, <true value>, <false value>]
          completed: { $sum: { $cond: [{ $in: ['$status', ['COMPLETED', 'LATE-COMPLETION']] }, 1, 0] } },
          remaining: { $sum: { $cond: [{ $in: ['$status', ['NEW', 'IN-PROGRESS', 'OVERDUE']] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    let stats = await aggr;
    res.status(200).json({
      message: 'Success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}

module.exports.getStats2 = async (req, res) => {
  try {
    let aggr = Task.aggregate([
      {
        $match: { status: 'LATE-COMPLETION' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          tasks: { $push: { id: '$_id', title: '$title', deadline: '$deadline', completedAt: '$completedAt' } }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);
    const stats = await aggr;
    res.status(200).json({
      message: 'Success',
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.messages
    });
  }
}