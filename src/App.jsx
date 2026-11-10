import { useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import AppShell from './components/AppShell'
import Toast from './components/Toast'
import { LoadingScreen, LoginScreen, MagicLinkSentScreen, SetupProfileScreen } from './screens/LoginScreens'
import Home from './pages/Home'
import DailyEntry from './pages/DailyEntry'
import Timesheet from './pages/Timesheet'
import Tasks from './pages/Tasks'
import Holidays from './pages/Holidays'
import Roster from './pages/Roster'
import ManagerTimesheets from './pages/ManagerTimesheets'
import AssignTasks from './pages/AssignTasks'

const PAGES = {
  home: Home,
  employee: DailyEntry,
  timesheet: Timesheet,
  tasks: Tasks,
  holidays: Holidays,
  roster: Roster,
  mgrts: ManagerTimesheets,
  assign: AssignTasks,
}

function CurrentPage() {
  const { page } = useApp()
  const Page = PAGES[page] || Home
  return <Page />
}

export default function App() {
  const { screen } = useAuth()
  let content
  if (screen === 'loading') content = <LoadingScreen />
  else if (screen === 'login') content = <LoginScreen />
  else if (screen === 'sent') content = <MagicLinkSentScreen />
  else if (screen === 'setup-profile') content = <SetupProfileScreen />
  else content = (
    <AppProvider>
      <AppShell><CurrentPage /></AppShell>
    </AppProvider>
  )
  return (
    <div className="app" id="app">
      {content}
      <Toast />
    </div>
  )
}
