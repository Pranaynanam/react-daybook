// Central settings. Values come from the .env file (locally) or from
// Netlify → Site configuration → Environment variables (when live).
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim()
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
export const SB_READY = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 20

// Working week used for "days left to fill". 0=Sun … 6=Sat. Add 6 if your team works Saturdays.
export const WORK_DAYS = [1, 2, 3, 4, 5]
