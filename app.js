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
const morgan = require('morgan');
const winston = require('./utils/logger');
const cookieParser = require('cookie-parser');
require('./strategies/googleAuth')(passport);


const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'You are rate limited please try again'
});

app.use(helmet());

// using the limiter middleware on every route
app.use('/', limiter);

// since both of the routes that is users and tasks will require the 
// data to be parsed onto a body object therefore we are specifying the
// middleware here to  avoid code repetition
app.use(express.json());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(morgan('combined', { stream: winston.stream }))
app.use(cookieParser());

app.use('/tasks', taskRouter);
app.use('/users', userRouter);


// exporting the app
module.exports = app;