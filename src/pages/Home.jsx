import { useEffect } from 'react'
import Icon from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadDayReports, loadMonthReports } from '../services/reports'
import { loadMyTasks, loadAssignedTasks } from '../services/tasks'
import { loadTeamMembers } from '../services/team'
import { currentMonthKey, fmtDate, fmtTime, initials, monthLabel, todayISO } from '../utils/dates'
import { fmtHours, monthSummary, reportHours, statusLabel } from '../utils/hours'
import { isWorkDay } from '../utils/holidays'
import { isOverdue, sortByDue, taskDueLabel } from '../utils/tasks'

export default function Home() {
  const { me } = useAuth()
  const { inManagerMode, holidays, goPage, startEntry, setCounts } = useApp()
  const today = todayISO()

  const { data } = useAsync(async () => {
    const [todayReports, monthData, myTasks] = await Promise.all([
      loadDayReports(today), loadMonthReports(currentMonthKey()), loadMyTasks(),
    ])
    let team = [], assigned = []
    if (inManagerMode) [team, assigned] = await Promise.all([loadTeamMembers(), loadAssignedTasks()])
    return { todayReports, monthData, myTasks, team, assigned }
  }, [inManagerMode])

  const openTasks = data ? sortByDue(data.myTasks.filter((t) => t.status !== 'done')) : []
  const awaitingNames = data && inManagerMode
    ? data.team.filter((n) => !data.todayReports[n] && isWorkDay(today, holidays)) : []
  useEffect(() => {
    if (!data) return
    setCounts((c) => ({ ...c, tasks: openTasks.length, ...(inManagerMode ? { awaiting: awaitingNames.length } : {}) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, holidays])

  if (!data) return null
  const { todayReports, monthData, team, assigned } = data
  const mine = todayReports[me.name] || null
  const s = monthSummary(me.name, monthData)
  const overdue = openTasks.filter((t) => isOverdue(t.dueDate, t.status))
  const holToday = holidays[today]
  const mgrName = me.managerName

  let todayCard
  if (!mine && holToday) {
    todayCard = (
      <div className="card section">
        <div className="eyebrow">Today · {fmtDate(today)}</div>
        <div className="today-title">Today is a public holiday</div>
        <div className="today-line"><span className="badge" style={{ background: 'var(--hol-bg)', color: 'var(--hol)' }}>{holToday}</span></div>
        <p className="today-sub">No report needed. Enjoy the day — if you worked anyway, you can still add one.</p>
        <button className="btn btn-ghost" onClick={() => goPage('employee')}>I worked today — report anyway</button>
      </div>
    )
  } else if (mine) {
    todayCard = (
      <div className="card section">
        <div className="eyebrow">Today · {fmtDate(today)}</div>
        <div className="today-line">
          <span className={'badge ' + mine.status}>{statusLabel(mine.status)}</span>
          {mine.status !== 'leave' ? <span className="mono">{fmtHours(reportHours(mine))}h logged</span> : <span className="mono">{mine.leaveType || ''}</span>}
        </div>
        <p className="today-sub">Submitted{mgrName ? ' to ' + mgrName : ''} at {fmtTime(mine.submittedAt)}. You can still edit it today.</p>
        <button className="btn btn-ghost" onClick={() => goPage('employee')}>View or edit report</button>
      </div>
    )
  } else {
    todayCard = (
      <div className="card section">
        <div className="eyebrow">Today · {fmtDate(today)}</div>
        <div className="today-title">You haven’t reported yet</div>
        <p className="today-sub">Pick where you’re working today{mgrName ? ' — it goes to ' + mgrName : ''}.</p>
        <div className="quick-row">
          <button className="quick-btn office" onClick={() => startEntry({ status: 'office' })}><span className="qi"><Icon name="office" size={16} /></span>In-Office</button>
          <button className="quick-btn wfh" onClick={() => startEntry({ status: 'wfh' })}><span className="qi"><Icon name="wfh" size={16} /></span>WFH</button>
          <button className="quick-btn leave" onClick={() => startEntry({ status: 'leave' })}><span className="qi"><Icon name="leave" size={16} /></span>Leave</button>
        </div>
      </div>
    )
  }

  let teamBlock = null
  if (inManagerMode) {
    const c = { office: 0, wfh: 0, leave: 0 }
    team.forEach((n) => { const r = todayReports[n]; if (r && c[r.status] !== undefined) c[r.status]++ })
    const aOpen = assigned.filter((t) => t.status !== 'done')
    const aOver = aOpen.filter((t) => isOverdue(t.dueDate, t.status))
    const aDone = assigned.length - aOpen.length
    const watch = sortByDue(aOpen).slice(0, 3)
    teamBlock = (
      <>
        <div className="section-title">Your team today<span className="rule" /></div>
        <div className="home-row">
          <div className="card section">
            <div className="eyebrow">Attendance · {team.length} direct report{team.length === 1 ? '' : 's'}</div>
            <div className="tile-grid">
              <div className="tile office"><div className="num">{c.office}</div><div className="lbl">In-Office</div></div>
              <div className="tile wfh"><div className="num">{c.wfh}</div><div className="lbl">WFH</div></div>
              <div className="tile leave"><div className="num">{c.leave}</div><div className="lbl">On leave</div></div>
              <div className={'tile' + (awaitingNames.length ? ' warn' : '')}><div className="num">{awaitingNames.length}</div><div className="lbl">Not reported yet</div></div>
            </div>
            {awaitingNames.length ? (
              <div className="await-list">
                {awaitingNames.map((n) => <span className="await-chip" key={n}><span className="avatar">{initials(n)}</span>{n}</span>)}
              </div>
            ) : team.length ? (
              <div className="all-clear">Everyone has reported today.</div>
            ) : (
              <p className="today-sub" style={{ margin: '14px 0 0' }}>Nobody reports to you yet. Once people pick you as their manager they’ll appear here.</p>
            )}
            <div className="link-row"><button className="btn-text" onClick={() => goPage('roster')}>Open today’s roster →</button></div>
          </div>
          <div className="card section">
            <div className="eyebrow">Tasks you assigned</div>
            <div className="tile-grid" style={{ marginBottom: 6 }}>
              <div className="tile"><div className="num">{aOpen.length}</div><div className="lbl">Open</div></div>
              <div className={'tile' + (aOver.length ? ' warn' : '')}><div className="num">{aOver.length}</div><div className="lbl">Overdue</div></div>
            </div>
            {watch.length ? watch.map((t) => (
              <div className="mini-task" key={t.id}>
                <span className="t">{t.title}<span style={{ display: 'block', fontWeight: 400, fontSize: 12, color: 'var(--ink-soft)' }}>{t.employeeName}</span></span>
                <span className={'d' + (isOverdue(t.dueDate, t.status) ? ' overdue' : '')}>{taskDueLabel(t)}</span>
              </div>
            )) : <p className="today-sub" style={{ margin: '10px 0 0' }}>{aDone ? aDone + ' completed so far. ' : ''}No open tasks right now.</p>}
            <div className="link-row"><button className="btn-text" onClick={() => goPage('assign')}>Assign &amp; track →</button></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {inManagerMode ? <div className="section-title" style={{ marginTop: 0 }}>My day<span className="rule" /></div> : null}
      <div className="home-row">
        {todayCard}
        <div className="card section">
          <div className="eyebrow">{monthLabel(currentMonthKey())}</div>
          <div className="tile-grid">
            <div className="tile office"><div className="num">{s.office}</div><div className="lbl">In-Office days</div></div>
            <div className="tile wfh"><div className="num">{s.wfh}</div><div className="lbl">WFH days</div></div>
            <div className="tile leave"><div className="num">{s.leave}</div><div className="lbl">Leave days</div></div>
            <div className="tile"><div className="num">{fmtHours(s.hours)}h</div><div className="lbl">Hours logged</div></div>
          </div>
        </div>
      </div>
      <div className="home-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card section">
          <div className="eyebrow">
            My open tasks{openTasks.length ? ' · ' + openTasks.length : ''}
            {overdue.length ? <> · <span style={{ color: 'var(--danger)' }}>{overdue.length} overdue</span></> : null}
          </div>
          {openTasks.length ? openTasks.slice(0, 4).map((t) => (
            <div className="mini-task" key={t.id}>
              <span className="t">{t.title}</span>
              <span className={'d' + (isOverdue(t.dueDate, t.status) ? ' overdue' : '')}>{taskDueLabel(t)}</span>
            </div>
          )) : <p className="today-sub" style={{ margin: 0 }}>Nothing waiting on you. Tasks assigned by your manager will show up here.</p>}
          {openTasks.length ? <div className="link-row"><button className="btn-text" onClick={() => goPage('tasks')}>See all my tasks →</button></div> : null}
        </div>
      </div>
      {teamBlock}
    </>
  )
}
