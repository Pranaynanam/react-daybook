import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { fmtDate, fmtLongDate, fmtTime, todayISO } from '../utils/dates'
import { entryHours, fmtHours, reportHours, statusLabel } from '../utils/hours'

// Panel that slides in from the right when a calendar day is clicked.
// own = the signed-in person's own day (shows the Edit button); who = employee name when a manager looks.
export default function DayDrawer({ iso, report, holiday, own, who, onClose, onEdit }) {
  const [leaving, setLeaving] = useState(false)
  const closeBtn = useRef(null)
  const canFill = own && iso <= todayISO()

  const close = useCallback(() => {
    if (leaving) return
    setLeaving(true)
    setTimeout(onClose, 190)
  }, [leaving, onClose])

  useEffect(() => {
    document.body.classList.add('drawer-open')
    if (closeBtn.current) closeBtn.current.focus({ preventScroll: true })
    return () => document.body.classList.remove('drawer-open')
  }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close])

  let body
  if (!report && holiday) {
    body = (
      <div className="dr-empty">
        <Icon name="sun" size={34} />
        <div className="big">{holiday}</div>
        <div>Public holiday — no report is needed{own ? '. If you worked anyway you can still add one.' : '.'}</div>
      </div>
    )
  } else if (!report) {
    body = (
      <div className="dr-empty">
        <Icon name="calendar" size={34} />
        <div className="big">No report for this day</div>
        <div>{own ? 'Nothing was submitted on ' : 'Nothing was submitted by ' + (who || 'this person') + ' on '}{fmtDate(iso)}.</div>
      </div>
    )
  } else if (report.status === 'leave') {
    body = (
      <>
        <div className="drawer-summary">
          <span className="badge leave">Leave</span>
          <span className="mono">{report.leaveType || ''}</span>
        </div>
        <div className="drawer-label">Reason</div>
        <div className="dr-quote">{report.leaveReason || 'No reason given.'}</div>
      </>
    )
  } else {
    const entries = report.entries || []
    body = (
      <>
        <div className="drawer-summary">
          <span className={'badge ' + report.status}>{statusLabel(report.status)}</span>
          <div className="drawer-hours">{fmtHours(reportHours(report))}<small>hours logged</small></div>
        </div>
        <div className="drawer-label">Work log · {entries.length} {entries.length === 1 ? 'entry' : 'entries'}</div>
        {entries.length ? entries.map((e, i) => (
          <div className="dr-entry" key={i}>
            <span className="dr-time">{e.start}–{e.end}</span>
            <span className="dr-desc">{e.description}</span>
            <span className="dr-dur">{fmtHours(entryHours(e))}h</span>
          </div>
        )) : <div className="hint">No entries logged.</div>}
      </>
    )
  }

  return (
    <div className={'drawer-layer ' + (leaving ? 'leaving' : 'enter')} id="drawer-layer">
      <div className="drawer-scrim" id="drawer-scrim" onClick={close} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={'Details for ' + fmtDate(iso)}>
        <header className="drawer-head">
          <div>
            <div className="drawer-eyebrow">{holiday ? 'Holiday · ' : ''}{own ? 'Your day' : who || ''}</div>
            <h3 className="drawer-title">{fmtLongDate(iso)}</h3>
          </div>
          <button className="drawer-close" id="drawer-close" ref={closeBtn} aria-label="Close details" onClick={close}><Icon name="close" size={16} /></button>
        </header>
        <div className="drawer-body">
          {report && holiday ? <div className="dr-holiday"><Icon name="sun" size={16} /><span>Public holiday — {holiday}</span></div> : null}
          {body}
          {report && report.submittedAt ? (
            <div className="dr-meta">Submitted{report.managerName ? ' to ' + report.managerName : ''} at {fmtTime(report.submittedAt)}</div>
          ) : null}
        </div>
        <footer className="drawer-foot">
          <button className="btn btn-ghost" id="drawer-close-2" onClick={close}>Close</button>
          {own && (report || canFill) ? (
            <button className="btn btn-primary" id="ts-edit-day" onClick={() => onEdit(iso, report)}>
              {report ? 'Edit this day' : holiday ? 'I worked this day' : 'Fill in this day'}
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  )
}
