const authController = require('./../controllers/authController');
const express = require('express');

const router = express.Router();

router.
  post('/signup', authController.signUp);

router.
  post('/login', authController.login);

router.
  post('/forgotPassword', authController.forgotPassword);


module.exports = router;