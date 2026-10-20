import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function start() {
  try {
    const response = await fetch('/api/opengym/me', { cache: 'no-store' })
    if (response.status === 401) { location.replace('/login'); return }
    if (!response.ok) throw new Error('No se pudo conectar con tu sesión')
    const { user } = await response.json()
    localStorage.setItem('opengym-account', user.id)
  } catch (error) {
    // Offline access is scoped to the last account, never imported into another account.
    if (navigator.onLine || !localStorage.getItem('opengym-account')) {
      document.getElementById('root').textContent = error.message
      return
    }
  }
  const { default: App } = await import('./App.jsx')
  const { default: IntegrationBar } = await import('./integration/IntegrationBar.jsx')
  createRoot(document.getElementById('root')).render(<StrictMode><IntegrationBar /><App /></StrictMode>)
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js', { scope: '/opengym-app/' }).catch(() => {})
  window.addEventListener('focus', async () => {
    try {
      const r = await fetch('/api/opengym/me', { cache: 'no-store' })
      if (r.status === 401) { location.replace('/login'); return }
      if (r.ok && (await r.json()).user.id !== localStorage.getItem('opengym-account')) location.reload()
    } catch { /* stay offline */ }
  })
}
start()
