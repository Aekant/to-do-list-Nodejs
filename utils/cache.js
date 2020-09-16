const redis = require('redis');

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
module.exports.setCache = (key, expireTime, data) => {
  // data must be a string
  client.setex(key, expireTime, data);
}

// this function will be called before any route in which we have implemented cache
module.exports.cached = (key, req, res, next) => {
  client.get(key, (err, cachedData) => {
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

module.exports.cachedId = (key, req, res, next) => {
  client.get(key, (err, cachedData) => {
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