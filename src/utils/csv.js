import { daysInMonth, isoOf } from './dates'
import { fmtHours, monthSummary, reportHours, statusLabel } from './hours'
import { monthHolidayCount } from './holidays'

export function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map((cell) => {
    const s = String(cell == null ? '' : cell)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportEmployeeMonthCSV(employeeName, yearMonth, monthData, holidays) {
  const total = daysInMonth(yearMonth)
  const rows = [['Date', 'Day', 'Status', 'Hours', 'Details']]
  for (let day = 1; day <= total; day++) {
    const iso = isoOf(yearMonth, day)
    const rep = (monthData[iso] || {})[employeeName]
    const dow = new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
    if (!rep) {
      const h = holidays[iso]
      rows.push([iso, dow, h ? 'Holiday' : '', '', h || ''])
      continue
    }
    if (rep.status === 'leave') {
      rows.push([iso, dow, statusLabel(rep.status), '', (rep.leaveType || '') + ' — ' + (rep.leaveReason || '')])
    } else {
      const details = (rep.entries || []).map((e) => `${e.start}-${e.end} ${e.description}`).join(' | ')
      rows.push([iso, dow, statusLabel(rep.status), fmtHours(reportHours(rep)), details])
    }
  }
  const s = monthSummary(employeeName, monthData)
  rows.push([])
  rows.push(['Summary', '', '', '', ''])
  rows.push(['In-Office days', s.office])
  rows.push(['WFH days', s.wfh])
  rows.push(['Leave days', s.leave])
  rows.push(['Public holidays', monthHolidayCount(holidays, yearMonth)])
  rows.push(['Total hours logged', fmtHours(s.hours)])
  downloadCSV(`${employeeName.replace(/\s+/g, '_')}_timesheet_${yearMonth}.csv`, rows)
}

export function exportTeamMonthCSV(yearMonth, monthData, members) {
  const rows = [['Employee', 'In-Office days', 'WFH days', 'Leave days', 'Total hours']]
  members.forEach((name) => {
    const s = monthSummary(name, monthData)
    if (s.total > 0) rows.push([name, s.office, s.wfh, s.leave, fmtHours(s.hours)])
  })
  downloadCSV(`team_timesheet_${yearMonth}.csv`, rows)
}
