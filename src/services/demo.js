// Sample data for "npm run demo" — everything lives in memory and resets on refresh.
import { uid } from '../utils/dates'

const YOU = { id: 'demo-you', name: 'Aisha Khan', email: 'aisha@demo.daybook' }
const HEAD = { id: 'rahul@demo.daybook', name: 'Rahul Verma' } // Aisha's own manager
const TEAM = [
  { id: 'demo-emp-1', full_name: 'Meera Nair' },
  { id: 'demo-emp-2', full_name: 'Vikram Shah' },
  { id: 'demo-emp-3', full_name: 'Priya Menon' },
  { id: 'demo-emp-4', full_name: 'Arjun Rao' }, // deliberately has not reported today
]

function isoOffset(offsetDays) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export const demoUser = {
  session: { user: { id: YOU.id, email: YOU.email } },
  profile: { id: YOU.id, full_name: YOU.name, role: 'manager', manager_name: HEAD.name },
  managers: [{ id: HEAD.id, full_name: HEAD.name }],
}

// reports[date][employeeName] = row
const reports = {}
function seed(offsetDays, name, status, extra) {
  const date = isoOffset(offsetDays)
  if (!reports[date]) reports[date] = {}
  reports[date][name] = {
    employee_id: name === YOU.name ? YOU.id : (TEAM.find((e) => e.full_name === name) || {}).id,
    employee_name: name,
    manager_name: name === YOU.name ? HEAD.name : YOU.name,
    report_date: date,
    status,
    submitted_at: new Date().toISOString(),
    ...extra,
  }
}
seed(0, 'Meera Nair', 'office', { entries: [{ start: '09:15', end: '12:00', description: 'Client proposal draft' }, { start: '13:00', end: '17:00', description: 'Design review and revisions' }] })
seed(0, 'Vikram Shah', 'wfh', { entries: [{ start: '09:00', end: '12:30', description: 'Bug fixes on checkout flow' }, { start: '14:00', end: '17:30', description: 'Code review for release' }] })
seed(0, 'Priya Menon', 'leave', { leave_type: 'Sick leave', leave_reason: 'Not feeling well, resting today.' })
seed(-1, YOU.name, 'office', { entries: [{ start: '09:00', end: '11:00', description: 'Reviewed team timesheets' }, { start: '11:30', end: '13:00', description: '1:1s with Meera and Vikram' }, { start: '14:00', end: '17:30', description: 'Hiring panel' }] })
seed(-1, 'Meera Nair', 'office', { entries: [{ start: '09:00', end: '13:00', description: 'Sprint planning' }, { start: '14:00', end: '18:00', description: 'Client call and follow-ups' }] })
seed(-1, 'Vikram Shah', 'office', { entries: [{ start: '09:30', end: '17:00', description: 'Onboarded new API integration' }] })
seed(-1, 'Arjun Rao', 'wfh', { entries: [{ start: '10:00', end: '18:00', description: 'Quarterly analytics report' }] })
seed(-2, 'Priya Menon', 'wfh', { entries: [{ start: '10:00', end: '16:00', description: 'Content calendar for next quarter' }] })
seed(-2, YOU.name, 'wfh', { entries: [{ start: '09:00', end: '12:00', description: 'Budget review' }, { start: '13:00', end: '16:00', description: 'Roadmap planning' }] })
seed(-3, 'Arjun Rao', 'office', { entries: [{ start: '09:00', end: '17:30', description: 'Dashboard QA and fixes' }] })
seed(-4, YOU.name, 'office', { entries: [{ start: '09:30', end: '18:00', description: 'Quarterly review prep' }] })
seed(-5, 'Meera Nair', 'leave', { leave_type: 'Full day', leave_reason: 'Family event.' })

let tasks = [
  { id: 't1', manager_id: YOU.id, employee_id: 'demo-emp-1', employee_name: 'Meera Nair', title: 'Finalize client proposal', description: 'Incorporate the pricing feedback from last review.', due_date: isoOffset(2), status: 'in_progress', created_at: new Date(Date.now() - 3e5).toISOString() },
  { id: 't2', manager_id: YOU.id, employee_id: 'demo-emp-2', employee_name: 'Vikram Shah', title: 'Fix checkout bug on mobile', description: '', due_date: isoOffset(-1), status: 'todo', created_at: new Date(Date.now() - 2e5).toISOString() },
  { id: 't3', manager_id: YOU.id, employee_id: 'demo-emp-3', employee_name: 'Priya Menon', title: 'Draft next quarter content plan', description: 'Coordinate with design for graphics.', due_date: isoOffset(5), status: 'done', created_at: new Date(Date.now() - 1e5).toISOString() },
  { id: 't5', manager_id: YOU.id, employee_id: 'demo-emp-4', employee_name: 'Arjun Rao', title: 'Send weekly analytics summary', description: '', due_date: isoOffset(3), status: 'todo', created_at: new Date(Date.now() - 5e4).toISOString() },
  { id: 't4', manager_id: 'head', employee_id: YOU.id, employee_name: YOU.name, title: 'Send monthly team summary', description: 'Include hours logged and any blockers.', due_date: isoOffset(1), status: 'todo', created_at: new Date().toISOString() },
  { id: 't6', manager_id: 'head', employee_id: YOU.id, employee_name: YOU.name, title: 'Review Q4 headcount plan', description: '', due_date: isoOffset(6), status: 'in_progress', created_at: new Date().toISOString() },
]

const holidays = {}
;(function () {
  const y = new Date().getFullYear()
  holidays[y + '-01-01'] = 'New Year’s Day'
  holidays[y + '-01-26'] = 'Republic Day'
  holidays[y + '-08-15'] = 'Independence Day'
  holidays[y + '-10-02'] = 'Gandhi Jayanti'
  holidays[y + '-12-25'] = 'Christmas'
  holidays[isoOffset(-3)] = 'Company Foundation Day'
  holidays[isoOffset(4)] = 'Regional Festival'
})()

export const demo = {
  team: () => TEAM.slice().sort((a, b) => a.full_name.localeCompare(b.full_name)),

  dayReports: (date) => Object.assign({}, reports[date] || {}),
  monthReports: (yearMonth) => {
    const map = {}
    Object.keys(reports).forEach((date) => {
      if (date.startsWith(yearMonth)) map[date] = Object.assign({}, reports[date])
    })
    return map
  },
  saveReport: (date, profileName, payload) => {
    if (!reports[date]) reports[date] = {}
    reports[date][profileName] = { employee_id: YOU.id, employee_name: profileName, report_date: date, ...payload }
  },

  myTasks: () => tasks.filter((t) => t.employee_id === YOU.id),
  assignedTasks: () => tasks.filter((t) => t.manager_id === YOU.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  createTasks: (employeeIds, employees, title, description, dueDate) => {
    employeeIds.forEach((empId) => {
      const emp = employees.find((e) => e.id === empId)
      tasks.push({
        id: 'demo-' + uid(), manager_id: YOU.id, employee_id: empId, employee_name: emp ? emp.full_name : '',
        title: title.trim(), description: description.trim() || '', due_date: dueDate || null,
        status: 'todo', created_at: new Date().toISOString(),
      })
    })
  },
  updateTaskStatus: (id, status) => { const t = tasks.find((x) => x.id === id); if (t) t.status = status },
  deleteTask: (id) => { tasks = tasks.filter((t) => t.id !== id) },

  holidays: () => Object.assign({}, holidays),
  saveHolidays: (rows) => { rows.forEach((r) => { holidays[r.date] = r.name }) },
  deleteHoliday: (iso) => { delete holidays[iso] },
}
