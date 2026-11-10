import { fmtDate } from '../utils/dates'
import { isOverdue, taskStatusLabel } from '../utils/tasks'

// opts: showAssignedBy, editableStatus, canDelete
export default function TaskCard({ task: t, showAssignedBy, editableStatus, canDelete, onStatus, onDelete }) {
  const overdue = isOverdue(t.dueDate, t.status)
  return (
    <div className="task-card" data-task-id={t.id}>
      <div className="task-top">
        <div>
          <div className={'task-title' + (t.status === 'done' ? ' done' : '')}>{t.title}</div>
          {t.description ? <div className="task-desc">{t.description}</div> : null}
        </div>
        {canDelete ? (
          <button className="btn-danger-text task-delete" title="Delete task" aria-label={'Delete ' + t.title} onClick={() => onDelete(t.id)}>✕</button>
        ) : null}
      </div>
      <div className="task-meta">
        <span>{showAssignedBy ? 'Assigned by your manager' : 'Assigned to ' + t.employeeName}</span>
        {t.dueDate ? <span className={'task-due' + (overdue ? ' overdue' : '')}>{overdue ? 'Overdue — ' : ''}Due {fmtDate(t.dueDate)}</span> : null}
        {editableStatus ? (
          <select className={'status-pill ' + t.status} value={t.status} onChange={(e) => onStatus(t.id, e.target.value)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        ) : (
          <span className={'status-pill ' + t.status}>{taskStatusLabel(t.status)}</span>
        )}
      </div>
    </div>
  )
}
