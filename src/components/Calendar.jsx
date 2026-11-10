import { fmtDate, daysInMonth, isoOf, todayISO } from '../utils/dates'
import { fmtHours, reportHours, statusLabel } from '../utils/hours'

const DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Month grid, coloured by one employee's reports. monthData = { date: { name: report } }
export default function Calendar({ yearMonth, employeeName, monthData, holidays, selectedDate, onSelect }) {
  const [y, m] = yearMonth.split('-').map(Number)
  const firstDow = new Date(y, m - 1, 1).getDay()
  const total = daysInMonth(yearMonth)
  const today = todayISO()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(<div key={'b' + i} className="ts-day blank" />)

  for (let day = 1; day <= total; day++) {
    const iso = isoOf(yearMonth, day)
    const rep = (monthData[iso] || {})[employeeName]
    const future = iso > today
    const status = rep ? rep.status : 'none'
    const hol = holidays[iso] || null
    const clickable = !future || !!hol
    const classes = ['ts-day', status !== 'none' ? status : '', hol && !rep ? 'holiday' : '', future ? 'future' : '', iso === today ? 'today' : '', iso === selectedDate ? 'selected' : ''].filter(Boolean).join(' ')
    const hrs = rep && rep.status !== 'leave' ? reportHours(rep) : 0
    const label = fmtDate(iso) + (hol ? ', holiday: ' + hol : '') + (rep ? ', ' + statusLabel(rep.status) : hol ? '' : ', no report')
    cells.push(
      <div
        key={iso} className={classes} data-iso={clickable ? iso : ''} title={hol || undefined}
        {...(clickable ? { tabIndex: 0, role: 'button', 'aria-label': label,
          onClick: () => onSelect(iso),
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(iso) } } } : {})}
      >
        <div className="dnum">{day}</div>
        {status !== 'none' ? <div className="dchip" /> : hol ? <div className="dchip hol" /> : null}
        {hrs > 0 ? <div className="ts-hrs">{fmtHours(hrs)}h</div> : null}
        {hol && !rep ? <div className="hol-tag">{hol}</div> : null}
        {hol && rep ? <span className="hol-mark" /> : null}
      </div>,
    )
  }

  return (
    <div className="ts-grid">
      {DOWS.map((d) => <div key={d} className="ts-dow">{d}</div>)}
      {cells}
    </div>
  )
}
