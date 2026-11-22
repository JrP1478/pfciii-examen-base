import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listPublishedArrivals } from '../arrivals/api'
import { formatArrivalTime, type Arrival } from '../arrivals/model'

type QueryState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; arrivals: Arrival[] }

export function PublicQuery({ refreshVersion }: { refreshVersion: number }) {
  const { client } = useAuth()
  const [state, setState] = useState<QueryState>({ kind: 'loading' })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!client) return
    let active = true
    listPublishedArrivals(client).then(arrivals => {
      if (active) setState({ kind: 'ready', arrivals })
    }).catch(() => { if (active) setState({ kind: 'error' }) })
    return () => { active = false }
  }, [client, refreshVersion, retry])

  function reload() { setState({ kind: 'loading' }); setRetry(value => value + 1) }

  return (
    <section className="public-panel" id="consulta" aria-labelledby="public-title">
      <div><span className="eyebrow">Consulta pública</span><h2 id="public-title">Avisos publicados</h2>
        <p>Consulta sin iniciar sesión. Horarios en Lima (UTC−05:00). Hasta 50 avisos, ordenados por llegada estimada.</p>
        {client && <button type="button" onClick={reload}>Actualizar avisos</button>}
      </div>
      <div className="public-results" aria-live="polite">
        {!client ? <p>Consulta no disponible: falta configurar Supabase.</p>
          : state.kind === 'loading' ? <p role="status">Consultando avisos…</p>
          : state.kind === 'error' ? <p role="alert">No se pudieron consultar los avisos. Revisa la conexión y vuelve a actualizar.</p>
          : state.arrivals.length === 0 ? <p>No hay avisos publicados.</p>
          : <ul className="arrival-list">{state.arrivals.map(arrival => <li key={arrival.id}>
            <h3>{arrival.vessel_name}</h3>
            <p>Llegada estimada: <time dateTime={arrival.estimated_arrival_at}>{formatArrivalTime(arrival.estimated_arrival_at)}</time></p>
            <p>{arrival.status === 'arrived' && arrival.actual_arrival_at
              ? <>Llegada confirmada: <time dateTime={arrival.actual_arrival_at}>{formatArrivalTime(arrival.actual_arrival_at)}</time></>
              : 'Llegada aún no confirmada.'}</p>
          </li>)}</ul>}
      </div>
    </section>
  )
}