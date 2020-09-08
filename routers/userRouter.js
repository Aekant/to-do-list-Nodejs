const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const express = require('express');

const router = express.Router();

router.route('/').get(userController.getAll);

router.
  post('/signup', authController.signUp);

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