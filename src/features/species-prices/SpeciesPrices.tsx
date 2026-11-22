import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isFisher, useAuth } from '../auth/AuthContext'
import { formatArrivalTime, type Arrival } from '../arrivals/model'
import { listOwnArrivals } from './api'
import { OfferEditor } from './OfferEditor'

export function SpeciesPrices({ arrivalsVersion, onSaved }: { arrivalsVersion: number; onSaved: () => void }) {
  const { client, session, loading } = useAuth()
  return (
    <section className="module offers-module" id="especies" aria-labelledby="species-title">
      <span className="eyebrow">03 / Especies y precios</span><h2 id="species-title">Tus ofertas del desembarque</h2>
      {!client ? <p>Gestión de ofertas no disponible: falta configurar Supabase.</p>
        : loading ? <p role="status">Recuperando sesión…</p>
        : !session || !isFisher(session) ? <p>Inicia sesión como pescador habilitado para gestionar tus ofertas.</p>
        : <FisherOffers key={session.user.id} client={client} ownerId={session.user.id} arrivalsVersion={arrivalsVersion} onSaved={onSaved} />}
    </section>
  )
}

type ArrivalsState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; arrivals: Arrival[] }
function FisherOffers({ client, ownerId, arrivalsVersion, onSaved }: {
  client: SupabaseClient; ownerId: string; arrivalsVersion: number; onSaved: () => void
}) {
  const [state, setState] = useState<ArrivalsState>({ kind: 'loading' })
  const [selectedId, setSelectedId] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listOwnArrivals(client, ownerId, controller.signal).then(arrivals => {
      if (active) setState({ kind: 'ready', arrivals })
    }).catch(() => { if (active) setState({ kind: 'error' }) })
    return () => { active = false; controller.abort() }
  }, [client, ownerId, arrivalsVersion, retry])

  const selected = state.kind === 'ready'
    ? state.arrivals.find(arrival => arrival.id === selectedId) ?? state.arrivals[0] : undefined
  return (
    <>
      <button type="button" onClick={() => { setState({ kind: 'loading' }); setRetry(value => value + 1) }}>Actualizar mis arribos</button>
      {state.kind === 'loading' ? <p role="status">Cargando tus arribos…</p>
        : state.kind === 'error' ? <p role="alert">No se pudieron cargar tus arribos. Vuelve a actualizar.</p>
        : !selected ? <p>No tienes arribos. Registra uno antes de crear ofertas.</p>
        : <>
          <label>Selecciona tu arribo (hasta 100 recientes)
            <select value={selected.id} onChange={event => setSelectedId(event.target.value)}>
              {state.arrivals.map(arrival => <option value={arrival.id} key={arrival.id}>
                {arrival.vessel_name} · {formatArrivalTime(arrival.estimated_arrival_at)} · {arrival.is_published ? 'Publicado' : 'Privado'} · {arrival.id.slice(0, 8)}
              </option>)}
            </select>
          </label>
          {!selected.is_published && <p>Este arribo es privado: sus ofertas no se mostrarán al público aunque marques su publicación.</p>}
          <OfferEditor key={selected.id} client={client} ownerId={ownerId} arrival={selected} onSaved={onSaved} />
        </>}
    </>
  )
}