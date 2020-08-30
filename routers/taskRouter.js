const express = require('express');
const app = require('../app');
const taskController = require('../controllers/taskController');
const router = express.Router();

// middleware
router.use(express.json());

// routes
router
  .route('/')
  .get(taskController.getAll)
  .post(taskController.create);

router
  .route('/:id')
  .get(taskController.getById)
  .patch(taskController.updateById)
  .delete(taskController.deleteById);


module.exports = router;