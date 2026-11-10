import { DEMO_MODE, SB_READY } from '../config'

// Shown in demo mode, or when the Supabase keys are missing
export default function SetupBanner() {
  if (DEMO_MODE) {
    return <div className="demo-strip"><strong>Demo</strong> — sample data only, nothing is saved. Refresh the page to reset.</div>
  }
  if (SB_READY) return null
  return (
    <div className="card section" style={{ background: '#FCEFE3', borderColor: '#EAC190', padding: '14px 20px', margin: '18px 0 0' }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3 }}>Database not connected yet</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        Reports won't save until this is set up. Create a <code>.env</code> file (copy <code>.env.example</code>) and add
        <code> VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> — see docs/SETUP_GUIDE.md. On Netlify, add the same two
        values under Site configuration → Environment variables.
      </div>
    </div>
  )
}
