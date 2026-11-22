import { useEffect, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Arrival } from '../arrivals/model'
import { listOwnOffers, saveOffer } from './api'
import { emptyOfferForm, formatPrice, formatQuantity, isOfferExhausted, offerToForm, validateOffer, type Offer } from './model'

type OffersState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; offers: Offer[] }

export function OfferEditor({ client, ownerId, arrival, onSaved }: {
  client: SupabaseClient; ownerId: string; arrival: Arrival; onSaved: () => void
}) {
  const [state, setState] = useState<OffersState>({ kind: 'loading' })
  const [form, setForm] = useState(emptyOfferForm)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listOwnOffers(client, ownerId, arrival.id, controller.signal).then(offers => {
      if (active) setState({ kind: 'ready', offers })
    }).catch(() => { if (active) setState({ kind: 'error' }) })
    return () => { active = false; controller.abort() }
  }, [client, ownerId, arrival.id, retry])

  function resetForm() {
    setEditing(null); setForm(emptyOfferForm); setError(''); setConfirmation('')
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || state.kind !== 'ready') return
    setError(''); setConfirmation('')
    const result = validateOffer(form, arrival.id)
    if (!result.data) { setError(result.error); return }
    setBusy(true)
    try {
      const saved = await saveOffer(client, result.data, editing?.id)
      setState(current => current.kind === 'ready' ? { kind: 'ready',
        offers: editing ? current.offers.map(offer => offer.id === saved.id ? saved : offer) : [saved, ...current.offers] } : current)
      setEditing(null); setForm(emptyOfferForm)
      setConfirmation(`Oferta guardada. Código: ${saved.id}. ${isOfferExhausted(saved) ? 'Especie agotada. ' : ''}${saved.is_published
        ? 'Publicación activada; visible solo si el arribo está publicado.' : 'Borrador privado.'}`)
      onSaved()
    } catch { setError('No se pudo confirmar el guardado de la oferta. Revisa tu sesión, permisos y conexión antes de reintentar.') }
    finally { setBusy(false) }
  }

  if (state.kind === 'loading') return <p role="status">Cargando tus ofertas…</p>
  if (state.kind === 'error') return <div><p role="alert">No se pudieron cargar tus ofertas.</p><button type="button" onClick={() => { setState({ kind: 'loading' }); setRetry(value => value + 1) }}>Reintentar ofertas</button></div>
  return (
    <div className="offers-workspace">
      <div>
        <h3>{editing ? 'Editar oferta' : 'Registrar oferta'}</h3>
        <form onSubmit={submit}>
          <label>Especie<input required minLength={2} maxLength={100} value={form.species} disabled={busy} onChange={e => setForm({ ...form, species: e.target.value })} /></label>
          <label>Cantidad disponible (kg)<input type="number" required min="0" max="999999999" step="0.001" value={form.quantity} disabled={busy} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label>
          <label>Precio por kg (S/)<input type="number" required min="0.01" max="9999999999" step="0.01" value={form.price} disabled={busy} onChange={e => setForm({ ...form, price: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.published} disabled={busy} onChange={e => setForm({ ...form, published: e.target.checked })} />Publicar oferta</label>
          <p>Introduce 0 kg para indicar «Agotada». La publicación es independiente: desmárcala si deseas ocultar la oferta.</p>
          <div className="button-row"><button disabled={busy}>{busy ? 'Guardando oferta…' : editing ? 'Guardar cambios de oferta' : 'Guardar oferta'}</button>
            {editing && <button type="button" disabled={busy} onClick={resetForm}>Cancelar edición</button>}</div>
        </form>
        {error && <p role="alert">{error}</p>}
        {confirmation && <p role="status">{confirmation}</p>}
      </div>
      <div>
        <h3>Ofertas de este arribo (hasta 100 recientes)</h3>
        {!state.offers.length ? <p>Aún no has registrado ofertas para este arribo.</p>
          : <ul className="offer-list">{state.offers.map(offer => <li key={offer.id}>
            <h4>{offer.species_name}</h4><p>{isOfferExhausted(offer) ? 'Agotada · 0 kg' : `${formatQuantity(offer.quantity_kg)} kg`} · {formatPrice(offer.price_per_kg)}/kg</p>
            <p>{offer.is_published ? 'Publicación activada' : 'Borrador privado'}</p>
            <button type="button" disabled={busy} aria-label={`Editar ${offer.species_name}`} onClick={() => {
              setEditing(offer); setForm(offerToForm(offer)); setError(''); setConfirmation('')
            }}>Editar oferta</button>
          </li>)}</ul>}
      </div>
    </div>
  )
}
