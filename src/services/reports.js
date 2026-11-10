import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../config'
import { showToast } from '../lib/toast'
import { sessionInfo } from './session'
import { demo } from './demo'

export function rowToReport(row) {
  return {
    status: row.status,
    entries: row.entries || [],
    leaveType: row.leave_type,
    leaveReason: row.leave_reason,
    managerName: row.manager_name || '',
    submittedAt: row.submitted_at,
  }
}

// "my own reports, plus (for managers) reports filed under my name"
function scopeFilter() {
  const parts = ['employee_id.eq.' + sessionInfo.userId]
  const team = sessionInfo.teamName
  if (team) parts.push('manager_name.eq."' + team.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"')
  return parts.join(',')
}

// → { 'Employee Name': report }
export async function loadDayReports(date) {
  if (DEMO_MODE) {
    const out = {}
    Object.entries(demo.dayReports(date)).forEach(([name, row]) => { out[name] = rowToReport(row) })
    return out
  }
  if (!supabase || !sessionInfo.userId) return {}
  try {
    const { data, error } = await supabase.from('daily_reports').select('*').eq('report_date', date).or(scopeFilter())
    if (error) throw error
    const map = {}
    ;(data || []).forEach((r) => { map[r.employee_name] = rowToReport(r) })
    return map
  } catch (e) {
    console.error(e)
    showToast('Could not load reports — ' + (e.message || 'check your connection'))
    return {}
  }
}

// → { 'YYYY-MM-DD': { 'Employee Name': report } }
export async function loadMonthReports(yearMonth) {
  if (DEMO_MODE) {
    const map = {}
    Object.entries(demo.monthReports(yearMonth)).forEach(([date, byName]) => {
      map[date] = {}
      Object.entries(byName).forEach(([name, row]) => { map[date][name] = rowToReport(row) })
    })
    return map
  }
  if (!supabase || !sessionInfo.userId) return {}
  const [y, m] = yearMonth.split('-').map(Number)
  const first = yearMonth + '-01'
  const last = yearMonth + '-' + String(new Date(y, m, 0).getDate()).padStart(2, '0')
  try {
    const { data, error } = await supabase.from('daily_reports').select('*').gte('report_date', first).lte('report_date', last).or(scopeFilter())
    if (error) throw error
    const map = {}
    ;(data || []).forEach((r) => {
      if (!map[r.report_date]) map[r.report_date] = {}
      map[r.report_date][r.employee_name] = rowToReport(r)
    })
    return map
  } catch (e) {
    console.error(e)
    return {}
  }
}

// report = { status, entries, leaveType, leaveReason, managerName, submittedAt }
export async function saveReport(date, employeeName, report) {
  const payload = {
    employee_id: sessionInfo.userId,
    employee_name: employeeName,
    manager_name: report.managerName || null,
    report_date: date,
    status: report.status,
    entries: report.status !== 'leave' ? report.entries : null,
    leave_type: report.status === 'leave' ? report.leaveType : null,
    leave_reason: report.status === 'leave' ? report.leaveReason : null,
    submitted_at: report.submittedAt,
  }
  if (DEMO_MODE) { demo.saveReport(date, employeeName, payload); return true }
  if (!supabase || !sessionInfo.userId) { showToast('Please sign in first'); return false }
  try {
    const { error } = await supabase.from('daily_reports').upsert(payload, { onConflict: 'employee_id,report_date' })
    if (error) throw error
    return true
  } catch (e) {
    console.error(e)
    showToast('Could not save — ' + (e.message || 'check your connection'))
    return false
  }
}
