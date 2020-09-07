const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');

// jwt sign token method
const signToken = (payload) => {
  return jwt.sign({
    username: payload.username,
    userId: payload._id
  },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES
    });
}

// for signUp route
module.exports.signUp = async (req, res) => {
  try {
    // here we are creating a new user
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      email: req.body.email,
      photo: req.body.photo
    });

    // since when a user is created the user is automatically logged in
    // therefore we can issue a token to the user
    // another scenario will be when a previously registered user will log in
    const access_token = signToken(user);

    // adding one more field "access_token" to the response object
    res.status(201).json({
      message: 'Success',
      access_token,
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}


// for signIn route
module.exports.login = async (req, res, next) => {

  // user will send the credentials in the body so we extract those
  const { username, password } = req.body;

  // if either of the two fields does not exist return an error response
  if (!username || !password) {
    return res.status(400).json({
      message: 'Please provide the required credentials'
    });
  }

  // now we find the user in the database by username
  // the + here means add on top of all the prop being retrieved by 
  // default
  const user = await User.findOne({ username }).select('+password');

  // we might not find the user or the password might be wrong then
  if (!user || !await user.correctPassword(password, user.password)) {
    return res.status(401).json({
      message: 'Authentication failed: Incorrect username or password'
    });
  }

  const access_token = signToken(user);
  // if everything is ok then send the token
  res.status(200).json({
    message: 'Success',
    access_token
  });
}

// gaurds
module.exports.gaurd = async (req, res, next) => {
  // this middleware checks for a valid JWT to give access to a 
  // protected route
  try {
    let token = '';
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // extract the token from the string
      token = req.headers.authorization.split(' ')[1];
    }

    // if the token doesn't exists that is the user added a header
    // with bearer as the first thing in the string but never used 
    // any token
    if (!token) {
      return res.status(401).json({
        message: 'You need to login first'
      });
    }

    // check if the token is valid
    // we use the jwt.verify method
    // if not valid it sends an error which is caught in the catch block
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // at this point we should  be done but let say
    // the user doesn't exist after the token has been issued?
    // that is the token expires in weeks and user got deleted in between that
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: 'The user belonging to the token to longer exists'
      });
    }
    // in addition to that let say user changes its password and the
    // prev token still exists. 
    if (user.verifyPasswordChange(decoded.iat)) {
      return res.status(401).json({
        message: 'User password was recently changed, please login again'
      });
    }

    req.user = user;
    // if the req made its way till here, it is going to be granted
    // permission to access the gaurded route
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// forgot password 
module.exports.forgotPassword = async (req, res, next) => {
  try {
    // find the user by email
    const user = await User.findOne({ email: req.body.email });
    // if the user is not found send an error response
    if (!user) {
      return res.status(404).json({
        message: 'No user found with the provided email'
      });
    }

    // we need to send the token in email therefore we need to assign it to 
    // a variable
    const token = await user.createPasswordResetToken();
    // the user document has two new properties set so we need to save it
    await user.save({ validateBeforeSave: false });
    // we do this to because when saving a document the validators are gonna
    // ask for all mandatory fields

    // defining the reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/users/resetPassword/${token}`;

    const message = `Forgot your Password? Please submit a PATCH request to the following URL. ${resetURL}.`;

    // Why are we creating a nested try catch block 
    // because in case the error occurs here we want to handle the
    // error response differently
    // we have to reset the two fileds in user document
    try {
      await sendEmail({
        email: user.email,
        message,
        subject: 'Password reset token (Expires in 10 mins)'
      });

      res.status(200).json({
        status: 'Success',
        message: "Token sent to user's email"
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        status: 'Failed',
        message: 'There was an error in sending email. Try again later',
        err
      });
    }
  } catch (err) {
    res.status(401).json({
      message: 'Failed',
      error: err.message
    });
  }
}