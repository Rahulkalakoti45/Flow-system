const express = require('express');
const { body, param, query } = require('express-validator');
const { listTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../models/Task');

const router = express.Router();

const idParam = param('id').isMongoId().withMessage('Invalid task id');

// Shared rules. On create, `title` is required; on update it is optional.
const titleRule = body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 });
const optionalFieldRules = [
  body('description').optional().isString().isLength({ max: 2000 }),
  body('status').optional().isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(', ')}`),
  body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('dueDate must be an ISO 8601 date'),
];

router.use(requireAuth);

router.get(
  '/',
  [
    query('status').optional().isIn(TASK_STATUSES),
    query('priority').optional().isIn(TASK_PRIORITIES),
  ],
  handleValidation,
  listTasks
);

router.post(
  '/',
  [titleRule, ...optionalFieldRules],
  handleValidation,
  createTask
);

router.patch('/:id', [idParam, titleRule.optional(), ...optionalFieldRules], handleValidation, updateTask);
router.delete('/:id', [idParam], handleValidation, deleteTask);

module.exports = router;
