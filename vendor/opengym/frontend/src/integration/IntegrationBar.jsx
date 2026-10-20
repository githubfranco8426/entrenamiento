import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { api } from '../lib/api.js'

export default function IntegrationBar() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const error = event => setMessage(event.detail)
    window.addEventListener('opengym-sync-error', error)
    return () => window.removeEventListener('opengym-sync-error', error)
  }, [])
  async function transfer(action) {
    setBusy(true); setMessage('')
    try {
      const store = useStore.getState()
      // Save must succeed before a transfer; the ordinary offline push intentionally swallows errors.
      await api('/api/data', { method: 'PUT', body: JSON.stringify({ state: store.S }) })
      const result = await api('/api/bridge/' + action, { method: 'POST', body: '{}' })
      if (result.state) store.replaceState(result.state, false)
      setMessage(result.message)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return <aside style={{ position:'relative', zIndex:60, padding:'10px 14px', background:'#17252a', color:'#fff', fontSize:12 }}>
    <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
      <a href="/dashboard" target="_top" style={{color:'#a3e635'}}>← Entrenamiento</a>
      <button disabled={busy} onClick={() => transfer('import')}>Importar de Entrenamiento</button>
      <button disabled={busy} onClick={() => transfer('publish')}>Publicar en Entrenamiento</button>
      <a href="/opengym-source.tar.gz" style={{color:'#a3e635'}}>Código fuente · AGPL</a>
    </div>
    <p style={{margin:'6px 0 0',opacity:.8}}>Publicar crea copias de rutinas nuevas/modificadas y añade sesiones terminadas. Los originales se conservan. Animaciones disponibles con licencia de Gym Visual.</p>
    {import.meta.env.VITE_LICENSED_MEDIA_BASE && <a href="https://gymvisual.com/" target="_blank" rel="noreferrer">© Gym visual — https://gymvisual.com/</a>}
    {message && <p role="status" style={{margin:'6px 0 0'}}>{message}</p>}
  </aside>
}
