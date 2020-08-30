// Importing the Task Model to create a task
const Task = require('./../models/taskModel');

// GET routes handlers
module.exports.getAll = async (req, res) => {
  try {
    // Task.find() returns a query
    let query = Task.find();
    // this returns a query which can be chained with a number of methods
    // only when it is awaited it will be passed to the mongo server

    // Filtering
    // conditioning the query string
    // removing fields such as limit page which are for pagination etc
    let queryObj = { ...req.query };
    const excluded = ['limit', 'page', 'sort', 'fields'];
    excluded.forEach(el => delete queryObj[el]);
    // removes all the fields which won't be in the documents

    // conditing the operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    queryObj = JSON.parse(queryStr);
    query = query.find(queryObj);

    // Sorting if there is a sort query
    if (req.query.sort) {
      // at this point sort is property of req object which has a string value
      // the string is a comma separated list of values by which we want to sort
      // the documents therefore 
      let sortStr = req.query.sort.split(',').join(' ');
      query = query.sort(sortStr);
    } else {
      // adding a default sort
      query = query.sort('-createdAt');
    }

    // Limiting fields if there is a fields query
    if (req.query.fields) {
      let fieldsStr = req.query.fields.split(',').join(' ');
      query = query.select(fieldsStr);
    } else {
      query = query.select('-__v')
    }

    // Pagination
    let limit = req.query.limit * 1 || 3
    // if the limit exists then fine otherwise the default results 
    // per page are 3
    let page = req.query.page * 1 || 1;
    // default page is 1
    query = query.skip((page - 1) * limit).limit(limit);

    // we are awaiting the resolved value for the query
    // it is only when we await the query, it is sent to the database
    const tasks = await query;
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