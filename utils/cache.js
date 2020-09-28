const redis = require('redis');
const logger = require('./logger');

// setting up redis connection
const client = redis.createClient(6379);
client.on('connect', () => {
  console.log('Connection to Redis server is successful');
});
client.on('error', (err) => {
  console.log(err.message);
});

module.exports.client = client;

// this function will be called in any route where we want to do cache
module.exports.setCache = (req, expireTime, data) => {
  // data must be a string
  client.setex(key(req), expireTime, data);
}

// this function will be called before any route in which we have implemented cache
module.exports.cached = (req, res, next) => {
  client.get(key(req), (err, cachedData) => {
    if (err) {
      return res.status(400).json({
        message: 'Failed',
        error: err.message
      })
    }

    if (cachedData) {
      res.status(200).json({
        message: 'Success',
        source: 'cache',
        data: JSON.parse(cachedData)
      })
    } else {
      next();
    }
  });
}

module.exports.cachedId = (req, res, next) => {
  // its hardcoded here to check if all tasks are in cache or not
  // if there are then retrieve from cache
  client.get(`${req.user.id}/tasks`, (err, cachedData) => {
    if (err) {
      return res.status(400).json({
        message: 'Failed',
        error: err.message
      })
    }

    if (cachedData) {
      const task = JSON.parse(cachedData).find(el => el.id === req.params.id);
      res.status(200).json({
        message: 'Success',
        source: 'cache',
        data: task
      })
    } else {
      next();
    }
  });
}

// will be used before patch, post and delete task routes
// will check if a key userId/tasks exists, if such a key exists and such a user access the post
// patch or delete routes then the cache is not valid
module.exports.removeKey = (req, res, next) => {

  // this method will execute after any post, patch or delete route a user made
  // this will delete all the cached data for that particular user who made such a req
  client.keys(`${req.user.id}*`, (err, vals) => {

    // if any error occurs in deleting cache then since the user updated, deleted or created new data
    // the cache data won't be valid for sometime therefore notify the user about that
    if (err) {
      logger.error(`Error in finding keys \n${err.message}`);
      return
    }
    // if no keys are found it returns an empty array instead of null or undefined
    // therefore this check fails and client.del get an empty array for an array of
    // keys which throws an invalid argument error
    if (vals.length > 0) {
      client.del(vals, (err, response) => {
        if (err) {
          return logger.error(`Error in deleting keys \n${err.message}`);
        }
        if (response) {
          logger.info('deleted cached keys');
          next();
        }
      });
    }
    logger.debug('no keys existed to delete');
    next();
  });
}


const key = (req) => {
  // we can make this even more complex let say we had a URL
  // /tasks?limit=4&sort=deadline
  // /tasks?sort=deadline&limit=4
  // both of these will return exactly same results but since the 
  // keys are very different therefore two separate caches will be made
  return `${req.user._id}${req.originalUrl}`;
}
