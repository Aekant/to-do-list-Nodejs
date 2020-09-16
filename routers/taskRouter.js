const express = require('express');
const taskController = require('../controllers/taskController');
const authController = require('./../controllers/authController');
const router = express.Router();
const cache = require('./../utils/cache');

// middleware for this route
router.use(authController.gaurd);

// routes
// calling a cached function to check if the data is cached then save the
// hassle of mongo query
router
  .route('/')
  .get((req, res, next) => cache.cached(`${req.user.id}/tasks`, req, res, next), taskController.getAll)
  .post(taskController.create);

// If I place this route below the :id one then
// what it will do is pass the stats as the value of id
// so we have to make sure this route is placed before the 
// :id one
router
  .route('/stats')
  .get(taskController.getStats);

router
  .route('/stats2')
  .get(taskController.getStats2);

router
  .route('/:id')
  .get(taskController.getById)
  .patch(taskController.updateById)
  .delete(taskController.deleteById);

module.exports = router;