const express = require('express');
const app = express();
const taskRouter = require('./routers/taskRouter');
const userRouter = require('./routers/userRouter');

// since both of the routes that is users and tasks will require the 
// data to be parsed onto a body object therefore we are specifying the
// middleware here to  avoid code repetition
app.use(express.json());

app.use('/tasks', taskRouter);
app.use('/users', userRouter);

// exporting the app
module.exports = app;