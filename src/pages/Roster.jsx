import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadDayReports } from '../services/reports'
import { loadTeamMembers } from '../services/team'
import DateBar from '../components/DateBar'
import HolidayBanner from '../components/HolidayBanner'
import { fmtDate, fmtTime, initials, todayISO } from '../utils/dates'
import { fmtHours, reportHours, statusLabel } from '../utils/hours'
import { isWorkDay } from '../utils/holidays'

export default function Roster() {
  const { me } = useAuth()
  const { entryDate, holidays, setCounts } = useApp()
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const { data } = useAsync(async () => {
    const [raw, team] = await Promise.all([loadDayReports(entryDate), loadTeamMembers()])
    return { raw, team }
  }, [entryDate])

  const awaiting = data ? data.team.filter((n) => !data.raw[n] && n !== me.name && isWorkDay(entryDate, holidays)) : []
  useEffect(() => {
    if (data && entryDate === todayISO()) setCounts((c) => ({ ...c, awaiting: awaiting.length }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, holidays])

  if (!data) return null
  const reports = {}
  Object.keys(data.raw).forEach((n) => { if (n !== me.name) reports[n] = data.raw[n] })
  const names = Object.keys(reports)
  const counts = { office: 0, wfh: 0, leave: 0 }
  names.forEach((n) => { if (counts[reports[n].status] !== undefined) counts[reports[n].status]++ })
  const filtered = names.filter((n) => filter === 'all' || reports[n].status === filter).sort((a, b) => a.localeCompare(b))

  return (
    <>
      <HolidayBanner iso={entryDate} forManager />
      <DateBar />
      <div className="stat-bar">
        <div className="stat office"><div className="num">{counts.office}</div><div className="lbl">In-Office</div></div>
        <div className="stat wfh"><div className="num">{counts.wfh}</div><div className="lbl">WFH</div></div>
        <div className="stat leave"><div className="num">{counts.leave}</div><div className="lbl">On Leave</div></div>
        <div className="stat"><div className="num">{names.length}</div><div className="lbl">Reports in</div></div>
      </div>
      {awaiting.length ? (
        <div className="card section" style={{ padding: '14px 20px' }}>
          <div className="eyebrow" style={{ marginBottom: 0 }}>Not reported yet · {awaiting.length}</div>
          <div className="await-list">
            {awaiting.map((n) => <span className="await-chip" key={n}><span className="avatar">{initials(n)}</span>{n}</span>)}
          </div>
        </div>
      ) : null}

      <div className="filter-row">
        {['all', 'office', 'wfh', 'leave'].map((f) => (
          <button key={f} className={'chip' + (filter === f ? ' active' : '')} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : statusLabel(f)}</button>
        ))}
      </div>

      <div className="card section">
        <h2>Team roster — {fmtDate(entryDate)}</h2>
        {filtered.length ? filtered.map((n) => {
          const report = reports[n]
          const isLeave = report.status === 'leave'
          return (
            <div className="roster-item" key={n}>
              <div className="roster-head" data-name={n} onClick={() => setOpen(open === n ? null : n)}>
                <div className="roster-left">
                  <div className="avatar">{initials(n)}</div>
                  <div>
                    <div className="r-name">{n}</div>
                    <div className="r-meta">{isLeave ? report.leaveType : (report.entries || []).length + ' entries · ' + fmtHours(reportHours(report)) + 'h'} · {fmtTime(report.submittedAt)}</div>
                  </div>
                </div>
                <span className={'badge ' + report.status}>{statusLabel(report.status)}</span>
              </div>
              <div className={'roster-body' + (open === n ? ' open' : '')}>
                {isLeave ? <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>{report.leaveReason}</p> : (
                  <div className="timeline">
                    {(report.entries || []).length ? report.entries.map((e, i) => (
                      <div className="tl-item" key={i}><div className="tl-time">{e.start}–{e.end}</div><div className="tl-desc">{e.description}</div></div>
                    )) : <div className="hint">No entries logged.</div>}
                  </div>
                )}
              </div>
            </div>
          )
        }) : (
          <div className="empty-state">
            <div className="big">No reports yet for this date</div>
            <div>Once the team submits, their status will show up here.</div>
          </div>
        )}
      </div>
    </>
  )
}
