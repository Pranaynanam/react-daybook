import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../config'
import { sessionInfo } from './session'
import { demo } from './demo'

// People who report to me (by my name in manager_emails): [{ id, full_name }]
export async function loadTeamMembersFull() {
  if (DEMO_MODE) return demo.team()
  const team = sessionInfo.teamName
  if (!supabase || !sessionInfo.userId || !team) return []
  try {
    const { data, error } = await supabase.from('profiles').select('id, full_name').eq('manager_name', team).neq('id', sessionInfo.userId).order('full_name')
    if (error) throw error
    return data || []
  } catch (e) {
    console.error(e)
    return []
  }
}

// Just the sorted, de-duplicated names
export async function loadTeamMembers() {
  const rows = await loadTeamMembersFull()
  return [...new Set(rows.map((r) => r.full_name))].sort((a, b) => a.localeCompare(b))
}
