const express = require('express');
const taskController = require('../controllers/taskController');
const taskQueue = require('../scheduler/queues/taskQueue');
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
  .get((req, res, next) => cache.cached(req, res, next), taskController.getAll)
  .post(taskController.create, cache.removeKey);

// If I place this route below the :id one then
// what it will do is pass the stats as the value of id
// so we have to make sure this route is placed before the 
// :id one
router
  .route('/reports/stats')
  .get((req, res, next) => cache.cached(req, res, next), taskController.getStats);

router
  .route('/reports/lateCompletion')
  .get((req, res, next) => cache.cached(req, res, next), taskController.lateCompleted);

router
  .route('/reports/maxTaskCompletionDate')
  .get((req, res, next) => cache.cached(req, res, next), taskController.maxTaskCompletionDate);

router
  .route('/reports/tasksCreatedEveryDay')
  .get((req, res, next) => cache.cached(req, res, next), taskController.tasksCreatedEveryDay);

router
  .route('/reports/averageTasksCompleted')
  .get((req, res, next) => cache.cached(req, res, next), taskController.averageTasksCompleted);

router
  .route('/:id')
  .get((req, res, next) => cache.cachedId(req, res, next), taskController.getById)
  .patch(taskController.updateById, cache.removeKey)
  .delete(taskController.deleteById, cache.removeKey);

module.exports = router;