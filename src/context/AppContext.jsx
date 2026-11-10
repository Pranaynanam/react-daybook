import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { loadHolidays } from '../services/holidays'
import { showToast } from '../lib/toast'
import { todayISO, uid } from '../utils/dates'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export const NAV_MY = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'employee', label: 'Daily Entry', icon: 'edit' },
  { key: 'timesheet', label: 'My Timesheet', icon: 'calendar' },
  { key: 'tasks', label: 'My Tasks', icon: 'check' },
  { key: 'holidays', label: 'Holidays', icon: 'sun' },
]
export const NAV_TEAM = [
  { key: 'roster', label: "Today's Roster", icon: 'users' },
  { key: 'mgrts', label: 'Employee Timesheets', icon: 'table' },
  { key: 'assign', label: 'Assign & Track', icon: 'assign' },
]
export const TEAM_PAGES = NAV_TEAM.map((n) => n.key)

export const blankEntry = () => ({ id: uid(), start: '', end: '', description: '' })
export const blankDraft = (status = 'office') => ({
  status,
  entries: status !== 'leave' ? [blankEntry()] : [],
  leaveType: 'Full day',
  leaveReason: '',
})
export const draftFromReport = (r) => ({
  status: r.status,
  entries: (r.entries && r.entries.length ? r.entries : [blankEntry()]).map((e) => ({ ...e, id: e.id || uid() })),
  leaveType: r.leaveType || 'Full day',
  leaveReason: r.leaveReason || '',
})

export function AppProvider({ children }) {
  const { isManagerUser } = useAuth()
  const [page, setPage] = useState('home')
  const [mode, setModeState] = useState(isManagerUser ? 'manager' : 'employee')
  const [counts, setCounts] = useState({ tasks: null, awaiting: null }) // sidebar badges
  const [holidays, setHolidays] = useState({})
  const [navOpen, setNavOpen] = useState(false)

  // The report being written on the Daily Entry page (kept while you move around)
  const [entryDate, setEntryDate] = useState(todayISO())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(blankDraft())

  const inManagerMode = isManagerUser && mode === 'manager'

  const refreshHolidays = useCallback(async () => { setHolidays(await loadHolidays()) }, [])
  useEffect(() => { refreshHolidays() }, [refreshHolidays])

  const goPage = useCallback((key) => {
    setPage(key)
    setNavOpen(false)
    window.scrollTo({ top: 0 })
  }, [])

  const setMode = useCallback((m) => {
    if (m === 'manager' && !isManagerUser) return
    if (m === mode) return
    setModeState(m)
    if (m === 'employee' && TEAM_PAGES.includes(page)) setPage('home')
    showToast(m === 'manager' ? 'Manager view — team pages are now in the sidebar' : 'Employee view — showing only your own work')
  }, [isManagerUser, mode, page])

  // Team pages are only for managers in manager view
  const activePage = TEAM_PAGES.includes(page) && !inManagerMode ? 'home' : page

  // Opens Daily Entry ready to write. report = an existing report to edit (optional)
  const startEntry = useCallback(({ date, status, report }) => {
    setEntryDate(date || todayISO())
    if (report) { setDraft(draftFromReport(report)); setEditing(true) } else { setDraft(blankDraft(status || 'office')); setEditing(false) }
    goPage('employee')
  }, [goPage])

  const changeEntryDate = useCallback((d) => {
    setEntryDate(d); setEditing(false); setDraft(blankDraft())
  }, [])

  const value = useMemo(() => ({
    page: activePage, goPage, mode, setMode, inManagerMode, counts, setCounts,
    holidays, refreshHolidays, navOpen, setNavOpen,
    entryDate, changeEntryDate, editing, setEditing, draft, setDraft, startEntry,
  }), [activePage, goPage, mode, setMode, inManagerMode, counts, holidays, refreshHolidays, navOpen, entryDate, changeEntryDate, editing, draft, startEntry])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
