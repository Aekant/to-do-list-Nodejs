const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');

module.exports.signUp = async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      email: req.body.email,
      photo: req.body.photo
    });


    const access_token = jwt.sign({
      username: user.username,
      userId: user._id
    },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES
      });

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