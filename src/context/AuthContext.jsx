import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_MODE } from '../config'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import { setSessionInfo } from '../services/session'
import { demoUser } from '../services/demo'
import * as authApi from '../services/auth'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [screen, setScreen] = useState('loading') // loading | login | sent | setup-profile | app
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // row from the `profiles` table
  const [canBeManager, setCanBeManager] = useState(false)
  const [directoryName, setDirectoryName] = useState('') // my own name as listed in manager_emails
  const [managers, setManagers] = useState([]) // [{ id: email, full_name }]
  const [lastEmail, setLastEmail] = useState('')

  const managerIdByName = useCallback((name) => {
    const m = managers.find((x) => x.full_name === name)
    return m ? m.id : ''
  }, [managers])
  const managerNameById = useCallback((id) => {
    const m = managers.find((x) => x.id === id)
    return m ? m.full_name : ''
  }, [managers])

  // The name under which my team members are filed (managers only)
  const teamName = directoryName || (profile && profile.role === 'manager' ? profile.full_name : '') || ''

  // Keep the service files in sync with who is signed in
  useEffect(() => {
    setSessionInfo({
      userId: session ? session.user.id : '',
      email: session ? session.user.email : '',
      teamName,
    })
  }, [session, teamName])

  const handleSession = useCallback(async (sess) => {
    setSession(sess)
    if (!sess) {
      setProfile(null); setCanBeManager(false); setDirectoryName(''); setScreen('login')
      return
    }
    // make sure the services know the user before any page loads data
    setSessionInfo({ userId: sess.user.id, email: sess.user.email })
    let eligible = { canBeManager: false, directoryName: '' }
    try { eligible = await authApi.checkManagerEligibility(sess.user.email) } catch (e) { console.error(e) }
    setCanBeManager(eligible.canBeManager)
    setDirectoryName(eligible.directoryName)
    let list = []
    try { list = await authApi.loadManagersList(sess.user.email) } catch (e) {
      console.error(e); showToast('Could not load manager list — ' + (e.message || 'check Supabase'))
    }
    setManagers(list)
    const row = await authApi.loadProfile(sess.user.id)
    setProfile(row)
    if (row) setSessionInfo({ teamName: eligible.directoryName || (row.role === 'manager' ? row.full_name : '') })
    setScreen(row ? 'app' : 'setup-profile')
  }, [])

  useEffect(() => {
    if (DEMO_MODE) {
      setSession(demoUser.session)
      setProfile(demoUser.profile)
      setCanBeManager(true)
      setDirectoryName(demoUser.profile.full_name)
      setManagers(demoUser.managers)
      setSessionInfo({ userId: demoUser.session.user.id, email: demoUser.session.user.email, teamName: demoUser.profile.full_name })
      setScreen('app')
      return undefined
    }
    if (!supabase) { setScreen('login'); return undefined }
    // Sign-in links expire quickly and work only once — explain it instead of failing silently
    if (/error_code=otp_expired|error=access_denied/.test(window.location.hash)) {
      showToast('That sign-in link expired or was already used. Request a new one and open it right away.')
      window.history.replaceState(null, '', window.location.pathname)
    }
    authApi.getSession().then(handleSession)
    return authApi.onAuthChange(handleSession)
  }, [handleSession])

  const sendMagicLink = useCallback(async (email) => {
    if (!supabase) { showToast('Database not set up yet — see the setup guide'); return }
    if (!email || !email.includes('@')) { showToast('Enter a valid email address'); return }
    const error = await authApi.sendMagicLink(email)
    if (error) { showToast(error.message); return }
    setLastEmail(email)
    setScreen('sent')
  }, [])

  const completeProfile = useCallback(async (fullName, role, managerId) => {
    if (!supabase || !session) return
    if (!fullName.trim()) { showToast('Please enter your name'); return }
    if (role === 'manager' && !canBeManager) {
      showToast("Your email isn't approved for manager access — ask your admin to add it")
      return
    }
    if (role === 'employee' && !managerId) { showToast('Please select your reporting manager'); return }
    const payload = {
      id: session.user.id,
      email: session.user.email,
      full_name: fullName.trim(),
      role,
      manager_name: managerNameById(managerId) || null,
    }
    const error = await authApi.insertProfile(payload)
    if (error) { showToast('Could not save profile — ' + error.message); return }
    setProfile(payload)
    setScreen('app')
  }, [session, canBeManager, managerNameById])

  const updateManagerSelection = useCallback(async (managerId) => {
    const name = managerNameById(managerId)
    setProfile((p) => (p ? { ...p, manager_name: name || null } : p))
    if (DEMO_MODE) return
    if (!supabase || !session) return
    const error = await authApi.updateProfileManager(session.user.id, name)
    if (error) showToast('Could not save manager — ' + error.message)
  }, [session, managerNameById])

  const signOut = useCallback(async () => {
    if (DEMO_MODE) { showToast('Sign out is disabled in the demo'); return }
    await authApi.signOut()
  }, [])

  const me = useMemo(() => {
    const managerName = (profile && profile.manager_name) || ''
    return {
      name: profile ? profile.full_name : '',
      managerName,
      managerId: managerIdByName(managerName),
    }
  }, [profile, managerIdByName])

  const value = {
    screen, setScreen, session, profile, me, managers, canBeManager, lastEmail,
    isManagerUser: !!(profile && profile.role === 'manager'),
    managerNameById, sendMagicLink, completeProfile, updateManagerSelection, signOut,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
