const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');

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