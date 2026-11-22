import { useState, type FormEvent } from 'react'
import { isFisher, useAuth } from './AuthContext'

export function FisherAuth() {
  const { client, session, loading, error: sessionError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client || busy) return
    setBusy(true); setError('')
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError('No se pudo iniciar sesión. Verifica tus credenciales y conexión.')
    } catch { setError('No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.') }
    finally { setPassword(''); setBusy(false) }
  }

  async function signOut() {
    if (!client || busy) return
    setBusy(true); setError('')
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) setError('No se pudo cerrar sesión. Inténtalo de nuevo.')
    } catch { setError('No se pudo cerrar sesión. Revisa tu conexión.') }
    finally { setBusy(false) }
  }

  return (
    <section className="module" id="pescadores" aria-labelledby="auth-title">
      <span className="eyebrow">01 / Pescadores</span><h2 id="auth-title">Tu acceso al terminal</h2>
      {!client ? <p>Acceso no disponible: falta configurar Supabase.</p>
        : loading ? <p role="status">Recuperando sesión…</p>
        : session ? <div>
          <p>Sesión iniciada: {session.user.email}</p>
          {!isFisher(session) && <p role="alert">Esta cuenta no está habilitada como pescador. Contacta al administrador.</p>}
          <button type="button" disabled={busy} onClick={signOut}>Cerrar sesión</button>
        </div> : <form onSubmit={signIn}>
          <p>Accede con tu cuenta prehabilitada. No hay registro público.</p>
          <label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
          <button disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</button>
        </form>}
      {(error || sessionError) && <p role="alert">{error || sessionError}</p>}
    </section>
  )
}