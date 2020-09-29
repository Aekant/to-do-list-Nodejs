const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const express = require('express');
const passport = require('passport');
const { nextTick } = require('async');

const router = express.Router();

router.route('/').get(userController.getAll);

// Sign Up Local
router.
  post('/signup', authController.signUp);

// Sign Up/ Sign In with Google Auth
router.
  get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.
  get('/auth/google/redirect',
    // had to define a custom callback to send out a response on error, otherwise the default threw an error
    // which was supposed to be handled in global error handling middleware
    function (req, res, next) {
      passport.authenticate('google', { failureRedirect: '/auth/google', session: false }, function (err, user, info) {
        if (err) {
          return res.status(400).json({
            message: 'Failed',
            error: err.message
          });
        } else if (user) {
          req.user = user;
          next();
        }
      })(req, res, next); // passport.authenticate returns a function which I call here immediately
    },
    (req, res) => { authController.sendTokenResponse(res, 200, req.user) });

router.
  post('/login', authController.login);

router.
  post('/forgotPassword', authController.forgotPassword);

router.
  get('/verifyAccount/:token', authController.verifyAccount);

router.
  patch('/resetPassword/:token', authController.resetPassword);

router.
  patch('/updateMyPassword', authController.gaurd, authController.updatePassword);

router.
  delete('/deactivate', authController.gaurd, userController.delete);

module.exports = router;