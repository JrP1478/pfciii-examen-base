import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listPublishedArrivals } from '../arrivals/api'
import { formatArrivalTime, type Arrival } from '../arrivals/model'
import { listPublishedOffers } from '../species-prices/api'
import { type PublicOffer } from '../species-prices/model'
import { OfferCard } from './OfferCard'

type QueryState = { kind: 'loading' } | { kind: 'error' }
  | { kind: 'ready'; arrivals: Arrival[]; offers: PublicOffer[]; updatedAt: string }
export const PUBLIC_POLL_INTERVAL = 30_000

export function PublicQuery({ refreshVersion }: { refreshVersion: number }) {
  const { client } = useAuth()
  const [state, setState] = useState<QueryState>({ kind: 'loading' })
  const [retry, setRetry] = useState(0)
  const [species, setSpecies] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!client) return
    let active = true
    let timer: ReturnType<typeof setTimeout>
    const controller = new AbortController()
    function schedule() {
      timer = setTimeout(() => {
        if (document.visibilityState === 'hidden') schedule()
        else void load()
      }, PUBLIC_POLL_INTERVAL)
    }
    async function load() {
      try {
        const [arrivals, offers] = await Promise.all([
          listPublishedArrivals(client!, controller.signal),
          listPublishedOffers(client!, filter, controller.signal),
        ])
        if (active) setState({ kind: 'ready', arrivals, offers, updatedAt: new Date().toISOString() })
      } catch { if (active) setState({ kind: 'error' }) }
      finally { if (active) schedule() }
    }
    void load()
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [client, refreshVersion, retry, filter])

  function reload() { setState({ kind: 'loading' }); setRetry(value => value + 1) }
  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilter(species.trim())
    reload()
  }

  return (
    <section className="public-panel public-board" id="consulta" aria-labelledby="public-title">
      <div><span className="eyebrow">Consulta pública</span><h2 id="public-title">Avisos y ofertas publicados</h2>
        <p>Consulta sin iniciar sesión. Horarios en Lima (UTC−05:00). Actualización por polling cada 30 segundos con la pestaña visible y al terminar la consulta anterior.</p>
        {client && <form className="public-filter" onSubmit={applyFilter}>
          <label>Filtrar ofertas por especie<input maxLength={100} value={species} onChange={e => setSpecies(e.target.value)} /></label>
          <div className="button-row"><button>Filtrar</button><button type="button" onClick={() => { setSpecies(''); setFilter(''); reload() }}>Limpiar filtro</button>
            <button type="button" onClick={reload}>Actualizar avisos</button></div>
        </form>}
      </div>
      <div className="public-results" aria-live="polite">
        {!client ? <p>Consulta no disponible: falta configurar Supabase.</p>
          : state.kind === 'loading' ? <p role="status">Consultando avisos y ofertas…</p>
          : state.kind === 'error' ? <p role="alert">No se pudieron consultar los avisos y ofertas. Revisa la conexión y vuelve a actualizar.</p>
          : <>
            <p>Última consulta correcta: {formatArrivalTime(state.updatedAt)}</p>
            <h3>Ofertas publicadas (hasta 100 recientes)</h3>
            {state.offers.length === 0 ? <p>{filter ? 'No hay ofertas publicadas para esa especie.' : 'No hay ofertas publicadas.'}</p>
              : <ul className="offer-list public-offers">{state.offers.map(offer => <li key={offer.id}><OfferCard offer={offer} /></li>)}</ul>}
            <h3>Arribos publicados (hasta 50 por llegada estimada)</h3>
            {state.arrivals.length === 0 ? <p>No hay avisos publicados.</p>
              : <ul className="arrival-list">{state.arrivals.map(arrival => <li key={arrival.id}>
                <h4>{arrival.vessel_name}</h4>
                <p>Llegada estimada: <time dateTime={arrival.estimated_arrival_at}>{formatArrivalTime(arrival.estimated_arrival_at)}</time></p>
                <p>{arrival.status === 'arrived' && arrival.actual_arrival_at
                  ? <>Llegada confirmada: <time dateTime={arrival.actual_arrival_at}>{formatArrivalTime(arrival.actual_arrival_at)}</time></>
                  : 'Llegada aún no confirmada.'}</p>
              </li>)}</ul>}
          </>}
      </div>
    </section>
  )
}
