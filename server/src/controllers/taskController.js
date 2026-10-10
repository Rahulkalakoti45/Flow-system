const Task = require('../models/Task');

// Every query is scoped to req.userId so users can only touch their own tasks.
// A task that exists but belongs to someone else is reported as 404, not 403,
// to avoid leaking which ids exist.

const ALLOWED_UPDATE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

function pick(source, fields) {
  return fields.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});
}

async function listTasks(req, res, next) {
  try {
    const filter = { owner: req.userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    return res.json({ tasks });
  } catch (err) {
    return next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const data = pick(req.body, ['title', 'description', 'status', 'priority', 'dueDate']);
    const task = await Task.create({ ...data, owner: req.userId });
    return res.status(201).json({ task });
  } catch (err) {
    return next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const updates = pick(req.body, ALLOWED_UPDATE_FIELDS);
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json({ task });
  } catch (err) {
    return next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
