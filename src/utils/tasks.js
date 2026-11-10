import { todayISO, fmtDate } from './dates'

export function taskStatusLabel(s) {
  return s === 'todo' ? 'To do' : s === 'in_progress' ? 'In progress' : 'Done'
}
export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false
  return dueDate < todayISO()
}
export function taskDueLabel(t) {
  if (!t.dueDate) return 'No due date'
  return (isOverdue(t.dueDate, t.status) ? 'Overdue · ' : 'Due ') + fmtDate(t.dueDate)
}
export function sortByDue(list) {
  return list.slice().sort((a, b) => ((a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1))
}
