const dotenv = require('dotenv');
dotenv.config({ path: `${__dirname}/../config.env` });
const mongoose = require('mongoose');
const fs = require('fs');
const Task = require(`${__dirname}/../models/taskModel`)

// Reading data
const data = JSON.parse(
  fs.readFileSync(`${__dirname}/devData.json`, 'utf-8')
);

const DB = process.env.LOCAL_STRING.replace('<DATABASE>', process.env.DATABASE);

// Connecting to Database
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(con => {
  console.log('Connection to Database was successfull');

  // Calling the method
  if (process.argv[2] === '--import') {
    loadData();
  } else {
    console.log(`${process.argv[2]} is not defined`);
    process.exit();
  }

});

// Function to upload the data
const loadData = async () => {
  try {
    await Task.create(data);
    console.log('Data Loaded Successfully');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
}

