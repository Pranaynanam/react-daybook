import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './styles/base.css'
import './styles/shell.css'
import './styles/drawer.css'
import './styles/assign.css'
import './styles/home.css'
import './styles/forms.css'
import './styles/timesheet.css'
import './styles/tasks.css'
import './styles/auth.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
