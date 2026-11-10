import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SetupBanner from '../components/SetupBanner'

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }
const inputStyle = { fontFamily: "'Inter',sans-serif", fontSize: 14, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--paper)' }

export function LoadingScreen() {
  return <div className="auth-page"><div className="auth-wrap"><p>Loading…</p></div></div>
}

export function LoginScreen() {
  const { sendMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const submit = () => sendMagicLink(email.trim())
  return (
    <div className="auth-page">
      <SetupBanner />
      <div className="auth-wrap">
        <div className="icon-badge">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="13" rx="2" stroke="white" strokeWidth="1.5" /><path d="M2 6l8 5 8-5" stroke="white" strokeWidth="1.5" /></svg>
        </div>
        <h2>Sign in to Daybook</h2>
        <p>Enter your work email and we'll send you a one-click sign-in link — no password needed.</p>
        <div className="card">
          <div className="field">
            <label style={labelStyle} htmlFor="login-email">Work email</label>
            <input type="email" id="login-email" placeholder="you@company.com" style={inputStyle} value={email}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
          </div>
          <button className="btn btn-primary" id="send-link" style={{ width: '100%' }} onClick={submit}>Send sign-in link</button>
        </div>
      </div>
    </div>
  )
}

export function MagicLinkSentScreen() {
  const { lastEmail, setScreen } = useAuth()
  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="icon-badge" style={{ background: 'var(--office)' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2>Check your email</h2>
        <p>We sent a sign-in link to <strong>{lastEmail}</strong>. Open it on this device to continue — the link expires after a short while.</p>
        <button className="btn-text" id="back-to-login" onClick={() => setScreen('login')}>Use a different email</button>
      </div>
    </div>
  )
}

export function SetupProfileScreen() {
  const { session, canBeManager, managers, completeProfile } = useAuth()
  const [name, setName] = useState('')
  const [role, setRole] = useState('employee')
  const [managerId, setManagerId] = useState('')
  const mgrLocked = !canBeManager
  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="icon-badge">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.2" stroke="white" strokeWidth="1.5" /><path d="M3.5 17c1-3.5 4-5 6.5-5s5.5 1.5 6.5 5" stroke="white" strokeWidth="1.5" /></svg>
        </div>
        <h2>Set up your profile</h2>
        <p>One-time setup — signed in as {session ? session.user.email : ''}.</p>
        <div className="card">
          <div className="field">
            <label style={labelStyle} htmlFor="setup-name">Your full name</label>
            <input type="text" id="setup-name" placeholder="e.g. Aisha Khan" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label style={labelStyle}>I am a...</label>
            <div className="role-pick">
              <button type="button" className={role === 'employee' ? 'active' : ''} onClick={() => setRole('employee')}>Employee</button>
              <button type="button" className={role === 'manager' ? 'active' : ''} disabled={mgrLocked}
                title={mgrLocked ? 'Ask your admin to approve your email for manager access' : undefined}
                onClick={() => setRole('manager')}>Manager {mgrLocked ? '🔒' : ''}</button>
            </div>
            {mgrLocked ? <div className="hint" style={{ marginTop: -4 }}>Manager access is locked for your email. Ask your admin to add you, then refresh this page.</div> : null}
          </div>
          <div className="field" id="setup-manager-field">
            <label style={labelStyle} htmlFor="setup-manager-select">
              {role === 'manager'
                ? <>Reports to <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>(optional)</span></>
                : <>Reporting manager <span className="req">*</span></>}
            </label>
            <select id="setup-manager-select" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">{managers.length ? '— Select —' : 'No managers registered yet'}</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            {role === 'manager' ? <div className="hint">Leave blank if you're a top-level manager with no one above you.</div> : null}
          </div>
          <button className="btn btn-primary" id="setup-continue" style={{ width: '100%' }} onClick={() => completeProfile(name, role, managerId)}>Continue</button>
        </div>
      </div>
    </div>
  )
}
