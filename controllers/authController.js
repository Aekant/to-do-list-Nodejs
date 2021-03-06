const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

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

// sign token and send with response
const sendTokenResponse = (res, statusCode, user) => {
  const access_token = signToken(user);
  // setting cookie options
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 86400000
    ),
    httpOnly: true
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // sending out a cookie
  res.cookie('jwt', access_token, cookieOptions);
  // we have enabled select to false but at the time of creation that does not
  // apply, this undefined does not make the password in the database undefined but
  // only in response in postman or whatever
  user.password = undefined;
  res.status(statusCode).json({
    message: 'Success',
    access_token,
    data: {
      user
    }
  });
}

// doing so because we want to use this function to send token in case of
// oauth and we cannot use exported methods inside the modules thats why
// exporting it separately
module.exports.sendTokenResponse = sendTokenResponse;

// for signUp route
module.exports.signUp = async (req, res) => {
  try {

    // creating a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // here we are creating a new user
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      email: req.body.email,
      accountVerificationToken: hashed
    });

    // since when a user is created the user is automatically logged in
    // therefore we can issue a token to the user
    // another scenario will be when a previously registered user will log in

    // defining the reset URL
    const verifyURL = `${req.protocol}://${req.get('host')}/users/verifyAccount/${verificationToken}`;

    const message = `Please submit a GET request to the following URL to activate your account. \n ${verifyURL}.`;

    // Why are we creating a nested try catch block 
    // because in case the error occurs here we want to handle the
    // error response differently
    // we have to reset the two fileds in user document
    try {
      await sendEmail({
        email: user.email,
        message,
        subject: 'Verify Your to-do-list Account'
      });

      res.status(200).json({
        status: 'Success',
        message: 'Verification email sent, please verify to continue logging in'
      });
    } catch (err) {
      user.accountVerificationToken = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        status: 'Failed',
        message: 'There was an error in sending email. Try again later',
        err
      });
    }
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// account verification
module.exports.verifyAccount = async (req, res) => {
  try {
    const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      accountVerificationToken: hash,
      verified: false
    });

    if (!user) {
      return res.status(400).json({
        message: 'Bad Request'
      });
    }

    user.accountVerificationToken = undefined;
    user.verified = true;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      message: 'Account verified, to continue please login through the registered username and password'
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
  try {
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
    const user = await User.findOne({ username, verified: true }).select('+password');
    // now this password field can be null too because let say a google
    // authenticated user tries to login using a random  password, but in the
    // database its null so we have to check it right here
    // we might not find the user or the password might be wrong then
    if (!user || !user.password || !await user.correctPassword(password, user.password)) {
      return res.status(401).json({
        message: 'Authentication failed: Incorrect username or password'
      });
    }

    // if everything is ok then send the token
    sendTokenResponse(res, 200, user);
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
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
    // make sure to await all the functions which are async
    // 

    // well the if statement wont even bother to evaluate the second condition if first
    // fails so no error
    if (user.provider === 'local' && await user.verifyPasswordChange(decoded.iat)) {
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

// forgot password and reset
module.exports.forgotPassword = async (req, res, next) => {
  try {
    // find the user by email
    const user = await User.findOne({ email: req.body.email, verified: true });
    // if the user is not found send an error response
    // oauth users would never pass this check
    if (!user || user.provider !== 'local') {
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
    // ask for all mandatory fields in which case they will run for password fields
    // too, also we have access to this keyword in this case because create uses
    // save behind the scenes.

    // defining the reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/users/resetPassword/${token}`;

    const message = `Forgot your Password? Please submit a PATCH request to the following URL. \n ${resetURL}.`;

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
        message: 'Token sent to user\'s email'
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

module.exports.resetPassword = async (req, res) => {
  try {
    // we query the user using the token but the token stored in database is 
    // in hashed form therefore we need to generate the hash first
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() }
    });
    // if the token is wrong or there was no token at all
    // or if the time is expired we wont get anything

    if (!user) {
      return res.status(400).json({
        message: 'Bad Request'
      });
    }

    // if we reach this point then it means the user exists
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    // we want all the validators to run this time 
    // because we need to make sure the two pass are same
    // also before saving the document we want to add passwordChangedAt 
    // timestamp so we do it in the pre hook

    // Apparently JWT is issued after this await query yet, the issue time
    // of JWT sometimes is lower than password reset resulting in failing
    // a check in gaurd 
    // work around is to subtract some milliseconds from passwordChangedAt 
    // timeStamp
    await user.save();

    // issuing a JWT to immediately sign in user after pass reset
    // send out the JWT with the response
    sendTokenResponse(res, 200, user);
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}

// update password for logged in users
module.exports.updatePassword = async (req, res) => {
  try {
    // since this route is only accessible to logged in users therefore, there
    // is a gaurd middleware before this function on this route
    // hence we can assume the req object has the user property on it

    const user = await User.findById(req.user._id).select('+password');

    if (user.provider !== 'local') {
      return res.status(400).json({
        message: 'Bad Request'
      });
    }

    if (!await user.correctPassword(req.body.passwordCurrent, user.password)) {
      return res.status(401).json({
        message: 'Authentication failed: Incorrect password'
      });
    }

    // the validators will check if the two passwords are same 
    // the pre hook will hash the new password
    // the pre hook for timeSstamp is also going to run
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // send out a new token to the user
    // the prev token won't be valid because the timeStamp of password change
    // is greater than the issue time of previous token
    sendTokenResponse(res, 200, user);
  } catch (err) {
    res.status(400).json({
      message: 'Failed',
      error: err.message
    });
  }
}