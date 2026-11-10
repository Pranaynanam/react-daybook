import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../config'
import { showToast } from '../lib/toast'
import { demo } from './demo'

// → { 'YYYY-MM-DD': 'Holiday name' }
export async function loadHolidays() {
  if (DEMO_MODE) return demo.holidays()
  if (!supabase) return {}
  try {
    const { data, error } = await supabase.from('holidays').select('holiday_date,name')
    if (error) throw error
    const map = {}
    ;(data || []).forEach((r) => { map[r.holiday_date] = r.name })
    return map
  } catch (e) {
    console.error(e)
    showToast('Could not load holidays — ' + (e.message || 'unknown error'))
    return {}
  }
}

// rows = [{ date, name }]
export async function saveHolidays(rows) {
  if (DEMO_MODE) { demo.saveHolidays(rows); return true }
  if (!supabase) return false
  try {
    const { error } = await supabase.from('holidays').upsert(
      rows.map((r) => ({ holiday_date: r.date, name: r.name })), { onConflict: 'holiday_date' })
    if (error) throw error
    return true
  } catch (e) {
    console.error(e)
    showToast('Could not save holidays — ' + (e.message || 'unknown error'))
    return false
  }
}

export async function deleteHoliday(iso) {
  if (DEMO_MODE) { demo.deleteHoliday(iso); return }
  if (!supabase) return
  try {
    const { error } = await supabase.from('holidays').delete().eq('holiday_date', iso)
    if (error) throw error
  } catch (e) {
    console.error(e)
    showToast('Could not delete holiday — ' + (e.message || 'unknown error'))
  }
}
