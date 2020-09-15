const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const taskRouter = require('./routers/taskRouter');
const userRouter = require('./routers/userRouter');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const passport = require('passport');
require('./strategies/googleAuth')(passport);


const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'You are rate limited please try again'
});

app.use(helmet());

app.use('/', limiter);
// since both of the routes that is users and tasks will require the 
// data to be parsed onto a body object therefore we are specifying the
// middleware here to  avoid code repetition
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use('/tasks', taskRouter);
app.use('/users', userRouter);

// exporting the app
module.exports = app;