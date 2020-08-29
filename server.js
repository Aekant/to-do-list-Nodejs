const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const mongoose = require('mongoose');

// setting up the Database connection
const DB = process.env.LOCAL_STRING.replace('<DATABASE>', process.env.DATABASE);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useUnifiedTopology: false
}).then(con => {
  console.log('Connection to Local Database is successful');

  // starting the server
  app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}....`);
  });

});
