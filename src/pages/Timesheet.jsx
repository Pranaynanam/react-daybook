import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadMonthReports } from '../services/reports'
import { showToast } from '../lib/toast'
import Calendar from '../components/Calendar'
import DayDrawer from '../components/DayDrawer'
import MonthToolbar from '../components/MonthToolbar'
import { currentMonthKey, fmtDate, shiftMonth } from '../utils/dates'
import { fmtHours, monthSummary } from '../utils/hours'
import { monthHolidayCount, pendingDays } from '../utils/holidays'
import { exportEmployeeMonthCSV } from '../utils/csv'

// "Mon, Oct 5" → "Oct 5"
const short = (iso) => fmtDate(iso).replace(/^\w+, /, '')

export default function Timesheet() {
  const { me } = useAuth()
  const { holidays, startEntry } = useApp()
  const [month, setMonth] = useState(currentMonthKey())
  const [selected, setSelected] = useState(null)
  const { data: monthData } = useAsync(() => loadMonthReports(month), [month])
  if (!monthData) return null

  const s = monthSummary(me.name, monthData)
  const holN = monthHolidayCount(holidays, month)
  const pend = pendingDays(month, me.name, monthData, holidays)
  const selectedReport = selected ? (monthData[selected] || {})[me.name] || null : null

  const go = (delta) => {
    if (delta > 0 && month >= currentMonthKey()) return
    setMonth(shiftMonth(month, delta)); setSelected(null)
  }

  return (
    <>
      <div className="card section">
        <MonthToolbar month={month} onPrev={() => go(-1)} onNext={() => go(1)} />
        <Calendar yearMonth={month} employeeName={me.name} monthData={monthData} holidays={holidays} selectedDate={selected} onSelect={setSelected} />

        <div className="ts-summary">
          <div className="stat office"><div className="num">{s.office}</div><div className="lbl">In-Office days</div></div>
          <div className="stat wfh"><div className="num">{s.wfh}</div><div className="lbl">WFH days</div></div>
          <div className="stat leave"><div className="num">{s.leave}</div><div className="lbl">Leave days</div></div>
          <div className="stat hol"><div className="num">{holN}</div><div className="lbl">Holidays</div></div>
          <div className="stat"><div className="num">{fmtHours(s.hours)}h</div><div className="lbl">Hours logged</div></div>
        </div>

        {pend.length ? (
          <div className="fill-note">
            <div className="txt">
              <strong>{pend.length} working day{pend.length === 1 ? '' : 's'}</strong> still need{pend.length === 1 ? 's' : ''} a report{' '}
              <span>— {pend.slice(0, 5).map(short).join(', ')}{pend.length > 5 ? ' …' : ''}. Holidays and weekends are skipped.</span>
            </div>
            <button className="btn btn-ghost" id="fill-next" onClick={() => startEntry({ date: pend[0] })}>Fill {short(pend[0])}</button>
          </div>
        ) : <div className="fill-note ok">You’re all caught up for this month.</div>}
        <div className="hint">Tap a day to see its details. Purple days are company holidays.</div>
      </div>

      <div className="card section" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" id="export-my-csv" onClick={() => { exportEmployeeMonthCSV(me.name, month, monthData, holidays); showToast('Timesheet downloaded') }}>Download this month (CSV)</button>
      </div>

      {selected ? (
        <DayDrawer iso={selected} report={selectedReport} holiday={holidays[selected]} own
          onClose={() => setSelected(null)}
          onEdit={(iso, report) => startEntry({ date: iso, report })} />
      ) : null}
    </>
  )
}
