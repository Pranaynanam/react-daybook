import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE, SB_READY, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

// null in demo mode or when the keys are missing — the app then shows a setup notice.
export const supabase = !DEMO_MODE && SB_READY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
