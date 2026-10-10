import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' };

/**
 * Create/edit form. Pass `initial` to edit an existing task.
 * `onSubmit` receives a normalised payload that matches the API contract.
 */
export default function TaskForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...EMPTY,
          ...initial,
          dueDate: initial.dueDate ? initial.dueDate.slice(0, 10) : '',
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        // An empty date input means "no due date", which the API accepts as null.
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} maxLength={120} autoFocus />
      </label>
      <label>
        Description
        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
      </label>
      <div className="row">
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To do</option>
            <option value="in-progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Due date
          <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
