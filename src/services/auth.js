import { supabase } from '../lib/supabase'

// Everything about signing in and about who a person is. Used only by AuthContext.

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  return error
}
export async function signOut() { await supabase.auth.signOut() }

// Is this email on the manager allow-list? → { canBeManager, directoryName }
export async function checkManagerEligibility(email) {
  const clean = String(email || '').trim()
  const { data, error } = await supabase.from('manager_emails').select('email, manager_name').ilike('email', clean.replace(/[%_]/g, (m) => '\\' + m)).maybeSingle()
  if (error) throw error
  return { canBeManager: !!data, directoryName: data && data.manager_name ? String(data.manager_name).trim() : '' }
}

// Managers an employee can pick from (everyone in manager_emails except me)
export async function loadManagersList(myEmail) {
  const { data, error } = await supabase.from('manager_emails').select('email, manager_name').order('manager_name')
  if (error) throw error
  const me = String(myEmail || '').toLowerCase()
  return (data || [])
    .filter((m) => m.email && m.manager_name && String(m.email).toLowerCase() !== me)
    .map((m) => ({ id: String(m.email).trim(), full_name: String(m.manager_name).trim() }))
}

export async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) console.error(error)
  return data || null
}
export async function insertProfile(payload) {
  const { error } = await supabase.from('profiles').insert(payload)
  return error
}
export async function updateProfileManager(userId, managerName) {
  const { error } = await supabase.from('profiles').update({ manager_name: managerName || null }).eq('id', userId)
  return error
}
