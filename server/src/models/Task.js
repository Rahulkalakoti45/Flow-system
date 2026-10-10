const mongoose = require('mongoose');

const TASK_STATUSES = ['todo', 'in-progress', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Most list queries filter by owner and sort newest first.
taskSchema.index({ owner: 1, createdAt: -1 });

taskSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
