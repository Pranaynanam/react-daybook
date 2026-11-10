export function timeToHours(t) {
  if (!t || !t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  return h + (m || 0) / 60
}
export function entryHours(e) {
  const s = timeToHours(e.start), en = timeToHours(e.end)
  if (s === null || en === null || en <= s) return 0
  return en - s
}
export function reportHours(report) {
  if (!report || report.status === 'leave') return 0
  return (report.entries || []).reduce((sum, e) => sum + entryHours(e), 0)
}
export function fmtHours(h) {
  return (Math.round(h * 10) / 10).toString()
}
export function statusLabel(s) {
  return s === 'office' ? 'In-Office' : s === 'wfh' ? 'WFH' : 'Leave'
}
// monthData = { 'YYYY-MM-DD': { 'Employee Name': report } }
export function monthSummary(employeeName, monthData) {
  let office = 0, wfh = 0, leave = 0, hours = 0
  Object.values(monthData || {}).forEach((dayObj) => {
    const rep = dayObj[employeeName]
    if (!rep) return
    if (rep.status === 'office') office++
    else if (rep.status === 'wfh') wfh++
    else if (rep.status === 'leave') leave++
    hours += reportHours(rep)
  })
  return { office, wfh, leave, hours, total: office + wfh + leave }
}
