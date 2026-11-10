import Icon from './Icon'
import { useAuth } from '../context/AuthContext'
import { useApp, NAV_MY, NAV_TEAM } from '../context/AppContext'
import { initials } from '../utils/dates'

function NavItem({ item }) {
  const { page, goPage, counts } = useApp()
  let badge = null
  if (item.key === 'tasks' && counts.tasks > 0) badge = <span className="nav-badge soft">{counts.tasks}</span>
  if (item.key === 'roster' && counts.awaiting > 0) badge = <span className="nav-badge" title="Haven't reported yet">{counts.awaiting}</span>
  return (
    <button className={'nav-item' + (page === item.key ? ' active' : '')} onClick={() => goPage(item.key)}>
      <Icon name={item.icon} /><span>{item.label}</span>{badge}
    </button>
  )
}

export default function Sidebar() {
  const { me, isManagerUser, signOut } = useAuth()
  const { inManagerMode, setMode } = useApp()
  const sub = me.managerName ? 'Reports to ' + me.managerName : isManagerUser ? 'Manager' : 'Employee'

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <svg width="30" height="30" viewBox="0 0 26 26" fill="none">
          <rect x="2" y="3" width="22" height="20" rx="3" stroke="#E7EFED" strokeWidth="1.6" />
          <path d="M2 9H24" stroke="#E7EFED" strokeWidth="1.6" />
          <circle cx="8" cy="6" r="0.9" fill="#E7EFED" /><circle cx="18" cy="6" r="0.9" fill="#E7EFED" />
          <path d="M6.5 14H11.5M6.5 18H15" stroke="#7FD1A2" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div><div className="name">Daybook</div><div className="sub">Daily reports &amp; timesheets</div></div>
      </div>

      {isManagerUser ? (
        <div className="mode-box">
          <div className="mode-label">Viewing as</div>
          <div className="mode-seg" role="group" aria-label="Switch view">
            <button className={!inManagerMode ? 'active' : ''} onClick={() => setMode('employee')}><Icon name="user" size={15} />Employee</button>
            <button className={inManagerMode ? 'active' : ''} onClick={() => setMode('manager')}><Icon name="briefcase" size={15} />Manager</button>
          </div>
          <div className="mode-hint">
            {inManagerMode
              ? <>Your own work <strong style={{ color: '#fff', fontWeight: 600 }}>plus</strong> your team’s reports, timesheets and tasks.</>
              : 'Just your own work — exactly what an employee sees. Switch back anytime.'}
          </div>
        </div>
      ) : null}

      <nav>
        <div className="nav-group">
          {inManagerMode ? <div className="nav-title">My work</div> : null}
          {NAV_MY.map((n) => <NavItem key={n.key} item={n} />)}
        </div>
        {inManagerMode ? (
          <div className="nav-group">
            <div className="nav-title">My team</div>
            {NAV_TEAM.map((n) => <NavItem key={n.key} item={n} />)}
          </div>
        ) : null}
      </nav>

      <div className="sb-user">
        <div className="sb-av">{initials(me.name)}</div>
        <div className="who"><div className="nm">{me.name}</div><div className="rl">{sub}</div></div>
        <button className="sb-signout" id="sign-out" title="Sign out" aria-label="Sign out" onClick={signOut}><Icon name="logout" size={16} /></button>
      </div>
    </aside>
  )
}
