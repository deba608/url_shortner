import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { wakeUpServer } from '@/api/ping'
import './index.css'
import App from './App.jsx'

// Fire immediately — warms up the Render free-tier backend before login
wakeUpServer()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
