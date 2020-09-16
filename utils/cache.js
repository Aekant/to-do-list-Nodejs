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

module.exports.setCache = (key, expireTime, data) => {
  // here people would do JSON.stringify(data) this would end up stringifying the tasks twice !!

  client.setex(key, expireTime, data);
}

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
        data: JSON.parse(cachedData)
      })
    } else {
      next();
    }
  });
}