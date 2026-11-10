import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadMonthReports } from '../services/reports'
import { loadTeamMembers } from '../services/team'
import { showToast } from '../lib/toast'
import Calendar from '../components/Calendar'
import DayDrawer from '../components/DayDrawer'
import MonthToolbar from '../components/MonthToolbar'
import { currentMonthKey, shiftMonth } from '../utils/dates'
import { fmtHours, monthSummary } from '../utils/hours'
import { exportEmployeeMonthCSV, exportTeamMonthCSV } from '../utils/csv'

export default function ManagerTimesheets() {
  const { holidays } = useApp()
  const [month, setMonth] = useState(currentMonthKey())
  const [employee, setEmployee] = useState('')
  const [selected, setSelected] = useState(null)
  const { data: members } = useAsync(loadTeamMembers, [])
  const { data: monthData } = useAsync(() => loadMonthReports(month), [month])

  useEffect(() => { if (members && members.length && !employee) setEmployee(members[0]) }, [members, employee])

  if (!members || !monthData) return null
  if (!members.length) {
    return <div className="card section"><div className="empty-state"><div className="big">No team members yet</div><div>Once employees submit a daily report, they'll appear here.</div></div></div>
  }

  const s = employee ? monthSummary(employee, monthData) : { office: 0, wfh: 0, leave: 0, hours: 0 }
  const selectedReport = selected && employee ? (monthData[selected] || {})[employee] || null : null
  const go = (delta) => {
    if (delta > 0 && month >= currentMonthKey()) return
    setMonth(shiftMonth(month, delta)); setSelected(null)
  }

  return (
    <>
      <div className="card section">
        <div className="profile-row" style={{ marginBottom: 4 }}>
          <div className="field" style={{ maxWidth: 240 }}>
            <label htmlFor="mgr-employee">Employee</label>
            <select id="mgr-employee" value={employee} onChange={(e) => { setEmployee(e.target.value); setSelected(null) }}>
              {members.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost" id="export-team-csv" style={{ marginLeft: 'auto' }}
            onClick={() => { exportTeamMonthCSV(month, monthData, members); showToast('Team timesheet downloaded') }}>Export whole team (CSV)</button>
        </div>
        <MonthToolbar month={month} onPrev={() => go(-1)} onNext={() => go(1)} style={{ marginTop: 14 }} />
        <Calendar yearMonth={month} employeeName={employee} monthData={monthData} holidays={holidays} selectedDate={selected} onSelect={setSelected} />

        <div className="ts-summary">
          <div className="stat office"><div className="num">{s.office}</div><div className="lbl">In-Office days</div></div>
          <div className="stat wfh"><div className="num">{s.wfh}</div><div className="lbl">WFH days</div></div>
          <div className="stat leave"><div className="num">{s.leave}</div><div className="lbl">Leave days</div></div>
          <div className="stat"><div className="num">{fmtHours(s.hours)}h</div><div className="lbl">Hours logged</div></div>
        </div>

        <div className="hint">Tap a day to see {employee || 'their'}'s log.</div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost" id="export-emp-csv"
            onClick={() => { if (!employee) return; exportEmployeeMonthCSV(employee, month, monthData, holidays); showToast('Timesheet downloaded') }}>
            Download {employee || 'employee'}'s month (CSV)
          </button>
        </div>
      </div>

      {selected ? (
        <DayDrawer iso={selected} report={selectedReport} holiday={holidays[selected]} own={false} who={employee} onClose={() => setSelected(null)} />
      ) : null}
    </>
  )
}
