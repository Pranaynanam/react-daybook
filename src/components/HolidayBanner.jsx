import { useApp } from '../context/AppContext'
import { fmtDate } from '../utils/dates'

// "Public holiday — Diwali" strip shown on Daily Entry and the roster
export default function HolidayBanner({ iso, forManager }) {
  const { holidays } = useApp()
  const name = holidays[iso]
  if (!name) return null
  return (
    <div className="banner hol-banner">
      <div>
        <div className="msg">Public holiday — {name}</div>
        <div className="sub">
          {forManager
            ? 'No reports are expected on this day.'
            : 'No report needed for ' + fmtDate(iso) + '. If you worked anyway, you can still submit one below.'}
        </div>
      </div>
    </div>
  )
}
