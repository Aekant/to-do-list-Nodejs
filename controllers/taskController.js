// Importing the Task Model to create a task
const Task = require('./../models/taskModel');
const APIFeatures = require('./../utils/apiFeatures');
const cache = require('./../utils/cache');

// GET routes handlers
module.exports.getAll = async (req, res) => {
  try {
    // gets only the tasks which belongs to this logged in user
    const filter = { userId: req.user.id };
    // Task.find() returns a query
    const features = new APIFeatures(Task.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    // this returns a query which can be chained with a number of methods
    // only when it is awaited it will be passed to the mongo server

    // we are awaiting the resolved value for the query
    // it is only when we await the query, it is sent to the database
    const tasks = await features.query;

    // caching
    // this method makes use of key method defined in cache.js to automatically
    // create keys from the req object
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify(tasks));

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
    // this make sures that a logged in user cannot access the task
    // he/she never created
    let query = Task.find({ _id: req.params.id, userId: req.user.id });
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
module.exports.create = async (req, res, next) => {
  try {
    // since this is a gaurded route we have a user object on the req object
    req.body.userId = req.user.id;
    // Task.create() returns a promise
    // we will await the resolved value of this promise
    let task = await Task.create(req.body);
    res.status(201).json({
      message: 'Success',
      data: {
        task
      }
    });
    next();
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// PATCH routes handlers
module.exports.updateById = async (req, res, next) => {
  try {
    // for this we will use the method provided by mongoose on Model
    // Model.findByIdAndUpdate()
    // it takes an id, the object to patch/update with
    // and a few config options such as running validators again
    // to ensure that user did not enter any invalid data
    // let query = Task.findOneAndUpdate({
    //   _id: req.params.id, userId: req.user.id
    // }, req.body, {
    //   // returns the updated document
    //   new: true,
    //   // checks for invalid data
    //   // since  we are using the update method, here the validator wont
    //   // have access to the document being update using this keyword
    //   // In order to run a full fledge validation check (one in which we check
    //   // other field values too) we should instead use findOne() by ID and then
    //   // replace the fields manually and then do .save() method. This will 
    //   // trigger the validator and will have access to the document using this
    //   runValidators: true,

    //   // setting this option will enable us to access the underlying query
    //   // object when running update validators
    //   // doesn't work
    //   // context: 'query'
    // });

    // returns the document which we want to update
    const query = Task.findOne({ _id: req.params.id, userId: req.user.id });
    const task = await query;

    if (!task) {
      return res.status(400).json({
        message: 'Failed',
        error: 'No such task exists'
      });
    }
    // fields to be updated can be title, deadline, description, status
    const fields = Object.keys(req.body);
    fields.forEach(el => {
      if (req.body[el]) {
        task[el] = req.body[el];
      }
    });
    // now one would add extra fields in the object to update with but before saving
    // these all are going to be validated against the defined schema therefore, there 
    // is no way an additional field that can be added here

    // since we are using .save() here all the pre and post save hooks along with
    // the validators defined in schema will be executed
    await task.save({ validateModifiedOnly: true });

    res.status(200).json({
      message: 'Success',
      data: {
        task
      }
    });
    next();
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// Delete routes handlers
module.exports.deleteById = async (req, res, next) => {
  try {

    // in the documentation it says that this method triggers the findOneAndDelete middleware well I tried
    // and it worked, now in the POST Hook we need to check if a task is scheduled for this document? If yes,
    // then remove it from queue
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(204).json({
      message: 'Success',
      data: null
    });
    next();
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
        $match: {
          // here userId is of type ObjectId if we use the conventional getter
          // id for _id then it would return us a string and in aggregation
          // pipeline mongoDB does not cast a string to ObjectId therefore,
          // userId: req.user.id will return 0 documents
          userId: req.user._id
        }
      }
      ,
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

    // setting cache for stats
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify(stats));
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

module.exports.lateCompleted = async (req, res) => {
  try {
    let aggr = Task.aggregate([
      {
        $match: { $and: [{ status: 'LATE-COMPLETION' }, { userId: req.user._id }] }
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

    // setting cache
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify(stats));
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

module.exports.maxTaskCompletionDate = async (req, res) => {
  try {
    let aggr = Task.aggregate([
      {
        $match: { userId: req.user._id }
      },
      {
        $match: { $expr: { $in: ['$status', ['COMPLETED', 'LATE-COMPLETION']] } }
      },
      {
        $addFields: {
          completedAt: {
            $dateToString: {
              format: "%Y-%m-%d", date: '$completedAt'
            }
          },
        }
      },
      {
        $group: {
          _id: '$completedAt',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$count',
          date: { $push: '$_id' }
        }
      },
      {
        $addFields: { maxCount: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $sort: { maxCount: -1 }
      },
      {
        $limit: 1
      }
    ]);

    const stats = await aggr;

    // setting cache
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify(stats));
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

module.exports.tasksCreatedEveryDay = async (req, res) => {
  try {
    let aggr = Task.aggregate([
      {
        $match: { userId: req.user._id }
      },
      {
        $group: {
          _id: null,
          Sunday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 1] }, 1, 0] } },
          Monday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 2] }, 1, 0] } },
          Tuesday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 3] }, 1, 0] } },
          Wednesday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 4] }, 1, 0] } },
          Thursday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 5] }, 1, 0] } },
          Friday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 6] }, 1, 0] } },
          Saturday: { $sum: { $cond: [{ $eq: [{ $dayOfWeek: '$createdAt' }, 7] }, 1, 0] } }
        }
      },
      {
        $project: { _id: 0 }
      }
    ]);

    const stats = await aggr;
    // setting cache
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify(stats));
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

module.exports.averageTasksCompleted = async (req, res) => {
  try {
    // finds out the time since the account was created in number of days
    let timeSinceAccCreation = (new Date().getTime() - req.user.createdAt.getTime()) / (1 * 24 * 60 * 60 * 1000);
    timeSinceAccCreation = Math.round(timeSinceAccCreation);
    if (!timeSinceAccCreation) {
      // if there are zero days since account creation just append 1 to it so that division by zero is handled
      timeSinceAccCreation += 1;
    }

    let aggr = Task.aggregate([
      {
        $match: { userId: req.user._id }
      },
      {
        $match: { $expr: { $in: ['$status', ['COMPLETED', 'LATE-COMPLETION']] } }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    const stats = await aggr;

    let average = 0;
    if (stats[0].count) {
      // if the count exists then 
      average = stats[0].count / timeSinceAccCreation;
    }
    // setting cache
    cache.setCache(req, process.env.CACHE_EXPIRE, JSON.stringify({ average }));
    res.status(200).json({
      message: 'Success',
      data: {
        average
      }
    });
  } catch (err) {
    res.status(404).json({
      message: 'Failed',
      error: err.message
    });
  }
}
