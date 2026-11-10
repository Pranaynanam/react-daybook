import { useApp } from '../context/AppContext'
import { fmtDate, todayISO } from '../utils/dates'

export default function DateBar() {
  const { entryDate, changeEntryDate } = useApp()
  return (
    <div className="card section" style={{ padding: '14px 22px' }}>
      <div className="date-row">
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>Date</label>
        <input type="date" id="date-picker" value={entryDate} max={todayISO()} onChange={(e) => e.target.value && changeEntryDate(e.target.value)} />
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginLeft: 4 }}>{fmtDate(entryDate)}</span>
      </div>
    </div>
  )
}
