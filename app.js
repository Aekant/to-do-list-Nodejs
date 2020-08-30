const express = require('express');
const app = express();
const taskRouter = require('./routers/taskRouter');

app.use('/tasks', taskRouter);

// exporting the app
module.exports = app;