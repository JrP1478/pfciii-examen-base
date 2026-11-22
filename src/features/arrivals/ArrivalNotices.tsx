import { useState, type FormEvent } from 'react'
import { isFisher, useAuth } from '../auth/AuthContext'
import { saveArrival } from './api'
import { validateArrival, type ArrivalForm } from './model'

const initialForm: ArrivalForm = { vesselName: '', estimatedAt: '', status: 'expected', actualAt: '', published: true }

export function ArrivalNotices({ onSaved }: { onSaved: () => void }) {
  const { client, session, loading } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const enabled = !!client && !!session && isFisher(session) && !loading

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!enabled || !client || busy) return
    setError(''); setConfirmation('')
    const result = validateArrival(form)
    if (result.error) { setError(result.error); return }
    if (!result.data) return
    setBusy(true)
    try {
      const arrival = await saveArrival(client, result.data)
      setConfirmation(`Arribo guardado${arrival.is_published ? ' y publicado' : ' como borrador'}. Código: ${arrival.id}`)
      setForm(initialForm)
      onSaved()
    } catch { setError('No se pudo confirmar el guardado. Revisa tu sesión y permisos. Si perdiste la conexión, consulta los avisos antes de reintentar para evitar duplicados.') }
    finally { setBusy(false) }
  }

  return (
    <section className="module" id="arribos" aria-labelledby="arrivals-title">
      <span className="eyebrow">02 / Avisos de arribo</span><h2 id="arrivals-title">Registra tu arribo</h2>
      {!client ? <p>Registro no disponible: falta configurar Supabase.</p>
        : !enabled ? <p>Inicia sesión con una cuenta de pescador habilitada para registrar un arribo.</p>
        : <form onSubmit={submit}>
          <label>Embarcación<input required minLength={2} maxLength={100} value={form.vesselName} disabled={busy} onChange={e => setForm({ ...form, vesselName: e.target.value })} /></label>
          <label>Llegada estimada (hora de Lima)<input type="datetime-local" required min="2000-01-01T00:00" max="2100-12-31T18:59" value={form.estimatedAt} disabled={busy} onChange={e => setForm({ ...form, estimatedAt: e.target.value })} /></label>
          <label>Estado<select value={form.status} disabled={busy} onChange={e => setForm({ ...form, status: e.target.value as ArrivalForm['status'], actualAt: '' })}>
            <option value="expected">Llegada estimada</option><option value="arrived">Llegada confirmada</option>
          </select></label>
          {form.status === 'arrived' && <label>Llegada confirmada (hora de Lima)<input type="datetime-local" required min="2000-01-01T00:00" max="2100-12-31T18:59" value={form.actualAt} disabled={busy} onChange={e => setForm({ ...form, actualAt: e.target.value })} /></label>}
          <label className="checkbox-label"><input type="checkbox" checked={form.published} disabled={busy} onChange={e => setForm({ ...form, published: e.target.checked })} />Publicar para compradores</label>
          <button disabled={busy}>{busy ? 'Guardando…' : 'Guardar arribo'}</button>
        </form>}
      {error && <p role="alert">{error}</p>}
      {confirmation && <p role="status">{confirmation}</p>}
    </section>
  )
}