import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadMyTasks, updateTaskStatus } from '../services/tasks'
import TaskCard from '../components/TaskCard'

// "My Tasks" — what my manager assigned to me
export default function Tasks() {
  const { setCounts } = useApp()
  const { data: tasks, reload } = useAsync(loadMyTasks, [])
  useEffect(() => {
    if (tasks) setCounts((c) => ({ ...c, tasks: tasks.filter((t) => t.status !== 'done').length }))
  }, [tasks, setCounts])
  if (!tasks) return null

  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')
  const onStatus = async (id, status) => { await updateTaskStatus(id, status); reload() }
  const card = (t) => <TaskCard key={t.id} task={t} showAssignedBy editableStatus onStatus={onStatus} />

  return (
    <div className="card section">
      <h2>Your tasks</h2>
      {tasks.length === 0 ? (
        <div className="task-empty">
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, color: 'var(--ink)', marginBottom: 6 }}>No tasks assigned yet</div>
          <div>When your manager assigns you something, it'll show up here.</div>
        </div>
      ) : (
        <>
          {open.map(card)}
          {done.length ? <><div className="hint" style={{ margin: '14px 0 8px' }}>Completed</div>{done.map(card)}</> : null}
        </>
      )}
    </div>
  )
}
