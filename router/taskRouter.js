const express = require('express');
const app = require('../app');
const taskController = require('./../controllers/taskController');
const router = express.Router();

// middleware
router.use(express.json());

// routes
router
  .route('/')
  .get(taskController.getAllTasks)
  .post(taskController.createTask);

module.exports = router;