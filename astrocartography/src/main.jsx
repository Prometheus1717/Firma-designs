import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker registration lives in index.html so it can run during HTML
// parsing (alongside the version-bump cache purge). Registering it again here
// would race with that script and is redundant.
