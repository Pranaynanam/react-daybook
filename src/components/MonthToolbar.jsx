import { currentMonthKey, monthLabel } from '../utils/dates'

// Month arrows + colour legend, shared by both timesheet pages
export default function MonthToolbar({ month, onPrev, onNext, style }) {
  return (
    <div className="ts-toolbar" style={style}>
      <div className="ts-month-nav">
        <button onClick={onPrev} aria-label="Previous month">‹</button>
        <div className="ts-month-label">{monthLabel(month)}</div>
        <button onClick={onNext} disabled={month >= currentMonthKey()} style={month >= currentMonthKey() ? { opacity: 0.3, cursor: 'default' } : undefined} aria-label="Next month">›</button>
      </div>
      <div className="legend">
        <span><span className="dot office" />In-Office</span>
        <span><span className="dot wfh" />WFH</span>
        <span><span className="dot leave" />Leave</span>
        <span><span className="dot holiday" />Holiday</span>
        <span><span className="dot none" />No report</span>
      </div>
    </div>
  )
}
