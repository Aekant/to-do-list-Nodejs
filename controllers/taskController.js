// Importing the Task Model to create a task
const Task = require('./../models/taskModel');
const APIFeatures = require('./../utils/apiFeatures');

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
      new: true, //returns the updated document
      runValidators: true //checks for invalid data
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
      message: "Success",
      data: null
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}