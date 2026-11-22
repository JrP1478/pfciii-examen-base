import { useState } from 'react'
import { useAuth } from './AuthContext'

export function LogoutButton() {
  const { client } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    if (!client || busy) return
    setBusy(true); setError('')
    try {
      const result = await client.auth.signOut({ scope: 'local' })
      if (result.error) setError('No se pudo cerrar sesión. Inténtalo de nuevo.')
    } catch { setError('No se pudo cerrar sesión. Revisa tu conexión.') }
    finally { setBusy(false) }
  }
  return <div className="logout-control"><button className="button-secondary" type="button" disabled={busy} onClick={signOut}>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>{error && <p role="alert">{error}</p>}</div>
}