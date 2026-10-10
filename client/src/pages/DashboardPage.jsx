import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../api/services';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // `editing` is null (no form), 'new', or a task object being edited.
  const [editing, setEditing] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { tasks: list } = await taskApi.list({ status: filter });
      setTasks(list);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Counts come from the full list, so they stay correct while a filter is active.
  const counts = useMemo(() => {
    const c = { todo: 0, 'in-progress': 0, done: 0 };
    tasks.forEach((t) => (c[t.status] += 1));
    return c;
  }, [tasks]);

  async function handleSave(payload) {
    if (editing && editing !== 'new') {
      await taskApi.update(editing.id, payload);
    } else {
      await taskApi.create(payload);
    }
    setEditing(null);
    await loadTasks();
  }

  async function handleAdvance(task, nextStatus) {
    // Optimistic update: flip the UI first, roll back if the request fails.
    const previous = tasks;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await taskApi.update(task.id, { status: nextStatus });
      if (filter) await loadTasks(); // the task may no longer match the filter
    } catch (err) {
      setTasks(previous);
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await taskApi.remove(task.id);
      setTasks((list) => list.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <strong>TaskFlow</strong>
        <div className="topbar__right">
          <span className="muted">{user.name}</span>
          <button className="secondary" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="container">
        <section className="summary" aria-label="Task summary">
          <div className="stat"><span>{counts.todo}</span>To do</div>
          <div className="stat"><span>{counts['in-progress']}</span>In progress</div>
          <div className="stat"><span>{counts.done}</span>Done</div>
        </section>

        <div className="toolbar">
          <div className="filters" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                role="tab"
                aria-selected={filter === f.value}
                className={filter === f.value ? 'chip chip--active' : 'chip'}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {editing !== 'new' && (
            <button onClick={() => setEditing('new')}>+ New task</button>
          )}
        </div>

        {editing && (
          <div className="card">
            <h2>{editing === 'new' ? 'New task' : 'Edit task'}</h2>
            <TaskForm
              initial={editing === 'new' ? undefined : editing}
              onSubmit={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        {loading ? (
          <p className="muted">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty muted">No tasks here yet. Add one to get started.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onAdvance={handleAdvance}
                onEdit={(t) => setEditing(t)}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
