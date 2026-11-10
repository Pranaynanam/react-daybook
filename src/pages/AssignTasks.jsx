import { useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { loadTeamMembersFull } from '../services/team'
import { createTasks, deleteTask, loadAssignedTasks } from '../services/tasks'
import { showToast } from '../lib/toast'
import TaskCard from '../components/TaskCard'
import { todayISO } from '../utils/dates'
import { isOverdue, taskStatusLabel } from '../utils/tasks'

const BLANK = { employeeIds: [], title: '', description: '', dueDate: '' }

export default function AssignTasks() {
  const [draft, setDraft] = useState(BLANK)
  const [filter, setFilter] = useState('all')
  const { data: employees } = useAsync(loadTeamMembersFull, [])
  const { data: assigned, reload } = useAsync(loadAssignedTasks, [])
  if (!employees || !assigned) return null

  if (employees.length === 0) {
    return (
      <div className="card section"><div className="task-empty">
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No direct reports yet</div>
        <div>Once someone selects you as their manager, you can assign tasks to them here.</div>
      </div></div>
    )
  }

  const openN = assigned.filter((t) => t.status !== 'done').length
  const overN = assigned.filter((t) => isOverdue(t.dueDate, t.status)).length
  const doneN = assigned.length - openN
  const filtered = filter === 'all' ? assigned : assigned.filter((t) => t.status === filter)
  const cnt = (f) => (f === 'all' ? assigned.length : assigned.filter((t) => t.status === f).length)
  const allSelected = employees.every((e) => draft.employeeIds.includes(e.id))
  const n = draft.employeeIds.length

  const toggle = (id) => setDraft((d) => ({
    ...d, employeeIds: d.employeeIds.includes(id) ? d.employeeIds.filter((x) => x !== id) : [...d.employeeIds, id],
  }))
  const toggleAll = () => setDraft((d) => ({ ...d, employeeIds: allSelected ? [] : employees.map((e) => e.id) }))

  async function assign() {
    const title = draft.title.trim()
    if (!title) { showToast('Step 1: give the task a title'); document.getElementById('task-title')?.focus(); return }
    if (draft.employeeIds.length === 0) { showToast('Step 3: choose who it’s for'); return }
    const count = draft.employeeIds.length
    const ok = await createTasks(draft.employeeIds, employees, title, draft.description, draft.dueDate)
    if (ok) {
      setDraft(BLANK); setFilter('all')
      showToast('Task assigned to ' + count + (count === 1 ? ' person' : ' people'))
      reload()
      setTimeout(() => document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }
  const remove = async (id) => { await deleteTask(id); reload() }

  return (
    <>
      <div className="card section form-card">
        <h2 className="form-title">New task</h2>
        <p className="form-sub">Four quick steps. The task lands in each person’s My Tasks right away.</p>

        <div className="step">
          <label className="step-label" htmlFor="task-title"><span className="step-n">1</span>Task title <span className="req">*</span></label>
          <input type="text" id="task-title" className="control lg" value={draft.title} placeholder="e.g. Finish Q3 report draft" autoComplete="off"
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        </div>

        <div className="step">
          <label className="step-label" htmlFor="task-desc"><span className="step-n">2</span>Description <span className="opt">optional</span></label>
          <textarea id="task-desc" className="control" placeholder="Add context, links or what “done” looks like…" value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        </div>

        <div className="step">
          <div className="step-label"><span className="step-n">3</span>Assign to <span className="req">*</span>
            <button type="button" className="btn-text step-aside" id="assign-all" onClick={toggleAll}>{allSelected ? 'Clear all' : 'Select all'}</button>
          </div>
          <div className="assignee-grid">
            {employees.map((e) => {
              const on = draft.employeeIds.includes(e.id)
              return (
                <label key={e.id} className={'assignee-check' + (on ? ' checked' : '')}>
                  <input type="checkbox" className="assignee-box" checked={on} onChange={() => toggle(e.id)} />
                  {e.full_name}
                </label>
              )
            })}
          </div>
        </div>

        <div className="step">
          <label className="step-label" htmlFor="task-due"><span className="step-n">4</span>Due date <span className="opt">optional</span></label>
          <input type="date" id="task-due" className="control date-control" value={draft.dueDate} min={todayISO()}
            onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} />
        </div>

        <div className="form-actions">
          <div className="assign-summary" id="assign-summary">
            {n ? <>Will be assigned to <strong>{n} {n === 1 ? 'person' : 'people'}</strong></> : 'Choose at least one person in step 3'}
          </div>
          <button className="btn btn-primary btn-lg" id="assign-task-btn" onClick={assign}>Assign task</button>
        </div>
      </div>

      <div className="card section" id="tracker">
        <div className="tracker-head"><h2>Tasks you’ve assigned</h2></div>
        <div className="tracker-sum">
          <span><b>{openN}</b> open</span>
          <span className={overN ? 'warn' : ''}><b>{overN}</b> overdue</span>
          <span><b>{doneN}</b> done</span>
        </div>
        <div className="filter-row" style={{ marginBottom: 14 }}>
          {['all', 'todo', 'in_progress', 'done'].map((f) => (
            <button key={f} className={'chip' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : taskStatusLabel(f)}<span className="cnt">{cnt(f)}</span>
            </button>
          ))}
        </div>
        {filtered.length
          ? filtered.map((t) => <TaskCard key={t.id} task={t} canDelete onDelete={remove} />)
          : <div className="hint">No tasks in this filter.</div>}
      </div>
    </>
  )
}
