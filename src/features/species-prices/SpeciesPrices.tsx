import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isFisher, useAuth } from '../auth/AuthContext'
import { formatArrivalTime, type Arrival } from '../arrivals/model'
import { listOwnArrivals } from './api'
import { OfferEditor } from './OfferEditor'

export function SpeciesPrices({ arrivalsVersion, onSaved, onEditArrival }: {
  arrivalsVersion: number; onSaved: () => void; onEditArrival?: (arrival: Arrival) => void
}) {
  const { client, session, loading } = useAuth()
  return (
    <section className="module offers-module" id="especies" aria-labelledby="species-title">
      <span className="eyebrow">Tu información, desde el origen</span><h2 id="species-title">Mis arribos y ofertas</h2>
      {!client ? <p>Gestión de ofertas no disponible: falta configurar Supabase.</p>
        : loading ? <p role="status">Recuperando sesión…</p>
        : !session || !isFisher(session) ? <p>Inicia sesión como pescador habilitado para gestionar tus ofertas.</p>
        : <FisherOffers key={session.user.id} client={client} ownerId={session.user.id} arrivalsVersion={arrivalsVersion} onSaved={onSaved} onEditArrival={onEditArrival} />}
    </section>
  )
}

type ArrivalsState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; arrivals: Arrival[] }
function FisherOffers({ client, ownerId, arrivalsVersion, onSaved, onEditArrival }: {
  client: SupabaseClient; ownerId: string; arrivalsVersion: number; onSaved: () => void; onEditArrival?: (arrival: Arrival) => void
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
      {state.kind === 'ready' && <>
        <p className="summary-caption">Resumen de tus últimos 100 arribos como máximo. No incluye registros de otros pescadores.</p>
        <div className="dashboard-summary"><div><span>Arribos cargados</span><strong>{state.arrivals.length}</strong></div><div><span>En espera</span><strong>{state.arrivals.filter(arrival => arrival.status === 'expected').length}</strong></div><div><span>Arribados</span><strong>{state.arrivals.filter(arrival => arrival.status === 'arrived').length}</strong></div></div>
        <section id="mis-arribos" className="own-arrivals" aria-label="Mis arribos"><h3>Mis arribos</h3>{state.arrivals.length > 0 && <ul>{state.arrivals.map(arrival => <li key={arrival.id}>
          <div><h4>{arrival.vessel_name}</h4><p>Estimada: {formatArrivalTime(arrival.estimated_arrival_at)}</p><span className="status-tag">{arrival.status === 'arrived' ? 'Arribado' : 'En espera'} · {arrival.is_published ? 'Publicado' : 'Privado'}</span></div>
          <div className="button-row"><button className="button-secondary" type="button" onClick={() => setSelectedId(arrival.id)}>Ver ofertas de {arrival.vessel_name}</button>{onEditArrival && <button type="button" onClick={() => onEditArrival(arrival)}>Editar arribo de {arrival.vessel_name}</button>}</div>
        </li>)}</ul>}</section>
      </>}
      <button type="button" onClick={() => { setState({ kind: 'loading' }); setRetry(value => value + 1) }}>Actualizar mis arribos</button>
      {state.kind === 'loading' ? <p role="status">Cargando tus arribos…</p>
        : state.kind === 'error' ? <p role="alert">No se pudieron cargar tus arribos. Vuelve a actualizar.</p>
        : !selected ? <p>No tienes arribos. Registra uno antes de crear ofertas.</p>
        : <>
          <h3 className="workspace-heading">Mis ofertas</h3>
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
