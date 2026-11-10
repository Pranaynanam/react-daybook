import { useAuth } from '../context/AuthContext'
import { useApp, blankEntry, draftFromReport } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { loadDayReports, saveReport } from '../services/reports'
import { showToast } from '../lib/toast'
import DateBar from '../components/DateBar'
import HolidayBanner from '../components/HolidayBanner'
import Icon from '../components/Icon'
import { fmtDate, fmtTime, todayISO } from '../utils/dates'
import { entryHours, fmtHours, reportHours, statusLabel, timeToHours } from '../utils/hours'

const STATUSES = [
  ['office', 'In-Office', 'Working from the office'],
  ['wfh', 'WFH', 'Working remotely today'],
  ['leave', 'Leave', 'Taking the day / part-day off'],
]
const LEAVE_TYPES = ['Full day', 'Half day — morning', 'Half day — afternoon', 'Sick leave', 'Casual leave']

export default function DailyEntry() {
  const { me, managers, updateManagerSelection } = useAuth()
  const { entryDate, editing, setEditing, draft, setDraft } = useApp()
  const { data: reports, reload } = useAsync(() => loadDayReports(entryDate), [entryDate])
  if (!reports) return null
  const mine = reports[me.name] || null

  if (mine && !editing) {
    return (
      <>
        <HolidayBanner iso={entryDate} />
        <SubmittedCard report={mine} onEdit={() => { setDraft(draftFromReport(mine)); setEditing(true) }} managerName={me.managerName} date={entryDate} />
      </>
    )
  }

  const setStatus = (status) => setDraft((d) => ({
    ...d, status, entries: status !== 'leave' && d.entries.length === 0 ? [blankEntry()] : d.entries,
  }))
  const updateEntry = (id, patch) => setDraft((d) => ({ ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const addEntry = () => setDraft((d) => ({ ...d, entries: [...d.entries, blankEntry()] }))
  const removeEntry = (id) => setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }))
  const total = draft.entries.reduce((sum, e) => sum + entryHours(e), 0)

  async function submit() {
    const d = draft
    if (!me.managerId) { showToast('Please select who you report to before submitting'); return }
    if (d.status === 'leave') {
      if (!d.leaveReason || !d.leaveReason.trim()) { showToast('Please enter a reason for your leave'); return }
    } else {
      const touched = d.entries.filter((e) => e.start || e.end || (e.description && e.description.trim()))
      if (touched.length === 0) { showToast('Add at least one work entry'); return }
      if (touched.some((e) => !e.start || !e.end || !(e.description && e.description.trim()))) {
        showToast('Every entry needs a start time, end time and description'); return
      }
      if (touched.some((e) => timeToHours(e.end) <= timeToHours(e.start))) { showToast('End time must be after start time'); return }
    }
    const report = {
      status: d.status,
      entries: d.status !== 'leave' ? d.entries.filter((e) => e.description && e.description.trim()) : [],
      leaveType: d.status === 'leave' ? d.leaveType : null,
      leaveReason: d.status === 'leave' ? d.leaveReason.trim() : null,
      managerName: me.managerName || '',
      submittedAt: new Date().toISOString(),
    }
    const ok = await saveReport(entryDate, me.name, report)
    if (!ok) return
    setEditing(false)
    showToast('Report submitted to ' + (me.managerName || 'your manager'))
    reload()
  }

  return (
    <>
      <HolidayBanner iso={entryDate} />
      <div className="card section" style={{ padding: '14px 22px' }}>
        <div className="profile-row" style={{ alignItems: 'center' }}>
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="pf-manager-inline">Reporting to</label>
            <select id="pf-manager-inline" value={me.managerId} onChange={(e) => updateManagerSelection(e.target.value)}>
              <option value="">{managers.length ? '— Select manager —' : 'No managers registered yet'}</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <DateField />
        </div>
      </div>

      <div className="card section">
        <h2>Today's status</h2>
        <div className="status-grid">
          {STATUSES.map(([key, name, desc]) => (
            <button type="button" key={key} className={'status-card ' + key + (draft.status === key ? ' selected' : '')} onClick={() => setStatus(key)}>
              <div className="check" />
              <div className="icon"><Icon name={key} size={16} /></div>
              <div className="name">{name}</div>
              <div className="desc">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {draft.status !== 'leave' ? (
        <div className="card section">
          <h2>Work log</h2>
          <div className="ledger" id="ledger">
            {draft.entries.map((e) => {
              const hrs = entryHours(e)
              return (
                <div className="ledger-row" key={e.id} data-id={e.id}>
                  <input type="time" className="e-start" aria-label="Start time" value={e.start || ''} onChange={(ev) => updateEntry(e.id, { start: ev.target.value })} />
                  <input type="time" className="e-end" aria-label="End time" value={e.end || ''} onChange={(ev) => updateEntry(e.id, { end: ev.target.value })} />
                  <input type="text" className="e-desc" placeholder="What did you work on?" value={e.description || ''} onChange={(ev) => updateEntry(e.id, { description: ev.target.value })} />
                  <div className={'e-hours' + (hrs > 0 ? ' has-val' : '')}>{hrs > 0 ? fmtHours(hrs) + 'h' : '—'}</div>
                  <button type="button" className="btn-danger-text remove-entry" title="Remove" aria-label="Remove entry" onClick={() => removeEntry(e.id)}>✕</button>
                </div>
              )
            })}
          </div>
          <button type="button" className="add-row-btn" id="add-entry" onClick={addEntry}>+ Add time entry</button>
          <div className="ledger-total">Total logged today<strong id="today-total-hrs">{fmtHours(total)}h</strong></div>
          <div className="hint">Log what you worked on and when — e.g. 09:00–10:30, "Fixed login bug on auth service". Start, end and description are all required so your hours show up correctly on the timesheet.</div>
        </div>
      ) : (
        <div className="card section">
          <h2>Leave details</h2>
          <div className="field" style={{ marginBottom: 12, maxWidth: 220 }}>
            <label htmlFor="leave-type">Leave type</label>
            <select id="leave-type" value={draft.leaveType} onChange={(e) => setDraft((d) => ({ ...d, leaveType: e.target.value }))}>
              {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="leave-reason">Reason for leave <span className="req">*</span></label>
            <textarea id="leave-reason" placeholder="Briefly describe the reason for your leave..." value={draft.leaveReason} onChange={(e) => setDraft((d) => ({ ...d, leaveReason: e.target.value }))} />
          </div>
        </div>
      )}

      <div className="card section" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        {mine ? <button className="btn btn-ghost" id="cancel-edit" onClick={() => setEditing(false)}>Cancel</button> : null}
        <button className="btn btn-primary" id="submit-report" onClick={submit}>{mine ? 'Save changes' : 'Submit to manager'}</button>
      </div>
    </>
  )
}

// the compact date picker inside the "Reporting to" card
function DateField() {
  const { entryDate, changeEntryDate } = useApp()
  return (
    <div className="date-row" style={{ flex: 1 }}>
      <label htmlFor="date-picker" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>Date</label>
      <input type="date" id="date-picker" value={entryDate} max={todayISO()} onChange={(e) => e.target.value && changeEntryDate(e.target.value)} />
    </div>
  )
}

function SubmittedCard({ report, onEdit, managerName, date }) {
  const isLeave = report.status === 'leave'
  const label = statusLabel(report.status)
  return (
    <>
      <div className={'banner' + (isLeave ? ' leave-banner' : '')}>
        <div>
          <div className="msg">Submitted to {managerName || 'your manager'} — marked {label} for {fmtDate(date)}</div>
          <div className="sub">Sent at {fmtTime(report.submittedAt)}</div>
        </div>
        <button className="btn btn-ghost" id="edit-report" onClick={onEdit}>Edit</button>
      </div>
      <DateBar />
      <div className="card section">
        <h2>Your report — {fmtDate(date)}</h2>
        <span className={'badge ' + report.status} style={{ marginBottom: 14, display: 'inline-block' }}>{label}</span>
        {!isLeave ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--ink-soft)', marginLeft: 10 }}>{fmtHours(reportHours(report))}h logged</span> : null}
        {isLeave ? (
          <div style={{ marginTop: 10 }}>
            <div className="hint" style={{ marginTop: 0, fontWeight: 600, color: 'var(--ink)' }}>{report.leaveType}</div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6 }}>{report.leaveReason}</p>
          </div>
        ) : (
          <div className="timeline">
            {(report.entries || []).length ? report.entries.map((e, i) => (
              <div className="tl-item" key={i}>
                <div className="tl-time">{e.start}–{e.end}</div>
                <div className="tl-desc">{e.description}</div>
              </div>
            )) : <div className="hint">No entries logged.</div>}
          </div>
        )}
      </div>
    </>
  )
}
