const express = require('express');
const app = express();
const taskRouter = require('./router/taskRouter');

app.use('/tasks', taskRouter);

// exporting the app
module.exports = app;