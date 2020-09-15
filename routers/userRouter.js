const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const express = require('express');
const passport = require('passport');

const router = express.Router();

router.route('/').get(userController.getAll);

// Sign Up Local
router.
  post('/signup', authController.signUp);

// Sign Up/ Sign In with Google Auth
router.
  get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.
  get('/auth/google/redirect', passport.authenticate('google', { failureRedirect: '/auth/google', session: false }), (req, res) => { authController.sendTokenResponse(res, 200, req.user) });

router.
  post('/login', authController.login);

router.
  post('/forgotPassword', authController.forgotPassword);

router.
  patch('/resetPassword/:token', authController.resetPassword);

router.
  patch('/updateMyPassword', authController.gaurd, authController.updatePassword);

router.
  delete('/deactivate', authController.gaurd, userController.delete);

module.exports = router;