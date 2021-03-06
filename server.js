const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');

// creates a connection to Redis as soon as the server starts running
require('./utils/cache');

// schedules a background notify task every 12 AM
const notifyQueue = require('./scheduler/queues/notifyQueue');
notifyQueue.add({}, { repeat: { cron: '0 0 * * *' } });

// setting up the Database connection
const DB = process.env.DATABASE_STRING.replace('<DATABASE>', process.env.DATABASE);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  console.log('Connection to Local Database is successful');

  // starting the server
  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}....`);
  });

});
