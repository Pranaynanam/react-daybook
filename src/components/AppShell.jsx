import Icon from './Icon'
import Sidebar from './Sidebar'
import SetupBanner from './SetupBanner'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { firstName, greeting } from '../utils/dates'

function pageMeta(key, me) {
  const mgr = me.managerName
  const meta = {
    home: { title: 'Home', sub: greeting() + ', ' + firstName(me.name) + '. Here’s where things stand today.' },
    employee: { title: 'Daily Entry', sub: mgr ? 'Log your status and work — it goes to ' + mgr + '.' : 'Log your status and the work you did.' },
    timesheet: { title: 'My Timesheet', sub: 'Your month at a glance. Select any day to open its details.' },
    holidays: { title: 'Holidays', sub: 'Company holidays are pre-filled on every calendar — you only fill in the remaining days.' },
    tasks: { title: 'My Tasks', sub: 'Everything assigned to you, with due dates and status.' },
    roster: { title: "Today's Roster", sub: 'Who is in, remote or away — and who hasn’t reported yet.' },
    mgrts: { title: 'Employee Timesheets', sub: 'Pick a person and a month. Export one person or the whole team.' },
    assign: { title: 'Assign & Track', sub: 'Hand out tasks to your team and follow their progress.' },
  }
  return meta[key] || meta.home
}

// Sidebar + page header around whichever page is open
export default function AppShell({ children }) {
  const { me, isManagerUser } = useAuth()
  const { page, inManagerMode, navOpen, setNavOpen } = useApp()
  const meta = pageMeta(page, me)
  const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const pill = isManagerUser ? (
    <span className={'mode-pill ' + (inManagerMode ? 'manager' : 'employee')}>
      <Icon name={inManagerMode ? 'briefcase' : 'user'} size={13} />{inManagerMode ? 'Manager view' : 'Employee view'}
    </span>
  ) : null

  return (
    <div className={'shell' + (navOpen ? ' nav-open' : '')} id="shell">
      <div className="scrim" id="scrim" onClick={() => setNavOpen(false)} />
      <Sidebar />
      <div className="main">
        <div className="m-bar">
          <button className="burger" id="burger" aria-label="Open menu" onClick={() => setNavOpen(true)}><Icon name="menu" size={20} /></button>
          <span className="mb-name">Daybook</span>
          {pill}
        </div>
        <div className="main-inner">
          <SetupBanner />
          <div className="page-head">
            <div>
              <h1 className="page-title">{meta.title}</h1>
              <p className="page-sub">{meta.sub}</p>
            </div>
            <div className="head-meta">{pill}<span className="head-date">{date}</span></div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
