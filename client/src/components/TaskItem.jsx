const NEXT_STATUS = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
const STATUS_LABEL = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' };

export default function TaskItem({ task, onAdvance, onEdit, onDelete }) {
  // Due dates are stored as UTC midnight, so compare and display them in UTC
  // to avoid showing the previous day in negative-offset time zones.
  const dueDay = task.dueDate ? task.dueDate.slice(0, 10) : null;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(dueDay) && task.status !== 'done' && dueDay < today;

  return (
    <li className={`task task--${task.status}`}>
      <div className="task__main">
        <h3 className="task__title">{task.title}</h3>
        {task.description && <p className="task__desc">{task.description}</p>}
        <div className="task__meta">
          <span className={`badge badge--${task.priority}`}>{task.priority}</span>
          <span>{STATUS_LABEL[task.status]}</span>
          {task.dueDate && (
            <span className={overdue ? 'overdue' : ''}>
              Due {new Date(task.dueDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              {overdue ? ' · overdue' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="task__actions">
        <button className="secondary" onClick={() => onAdvance(task, NEXT_STATUS[task.status])}>
          → {STATUS_LABEL[NEXT_STATUS[task.status]]}
        </button>
        <button className="secondary" onClick={() => onEdit(task)}>Edit</button>
        <button className="danger" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </li>
  );
}
