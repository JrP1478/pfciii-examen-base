import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HarborArt } from '../components/HarborArt'
import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/AuthContext'
import { listPublishedOffers } from '../features/species-prices/api'
import type { PublicOffer } from '../features/species-prices/model'
import { OfferCard } from '../features/public-query/OfferCard'

function OfferPreview() {
  const { client } = useAuth()
  const [state, setState] = useState<{ kind: 'loading' | 'error' } | { kind: 'ready'; offers: PublicOffer[] }>({ kind: 'loading' })
  useEffect(() => {
    if (!client) return
    let active = true
    const controller = new AbortController()
    listPublishedOffers(client, '', controller.signal).then(offers => { if (active) setState({ kind: 'ready', offers: offers.slice(0, 3) }) })
      .catch(() => { if (active) setState({ kind: 'error' }) })
    return () => { active = false; controller.abort() }
  }, [client])
  if (!client) return <div className="empty-state"><Icon name="fish" size={38} /><h3>Las ofertas se mostrarán aquí</h3><p>Consulta no disponible: falta configurar Supabase.</p></div>
  if (state.kind === 'loading') return <p className="loading-state" role="status">Consultando ofertas publicadas…</p>
  if (state.kind === 'error') return <p className="error-state" role="alert">No pudimos cargar las ofertas. Abre el catálogo para volver a consultar.</p>
  if (state.kind === 'ready') return state.offers.length
    ? <div className="preview-grid">{state.offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}</div>
    : <div className="empty-state"><Icon name="fish" size={38} /><h3>Un espacio para la próxima llegada</h3><p>Aún no hay ofertas publicadas. Puedes consultar los avisos de arribo en el catálogo.</p><Link to="/ofertas" className="text-link">Consultar arribos <Icon name="arrow" size={18} /></Link></div>
}

export function LandingPage() {
  return <>
    <section className="hero page-width" aria-labelledby="landing-title">
      <div className="hero-copy"><span className="eyebrow hero-location"><span />Terminal Pesquero de Chorrillos · Lima</span>
        <h1 id="landing-title" tabIndex={-1}>Más cerca del mar.<br /><em>Mejor informado.</em></h1>
        <p>Conoce qué se ofrece, cuánto cuesta y cuándo llega. Una conexión más clara entre los pescadores y quienes compran.</p>
        <div className="button-row hero-actions"><Link className="button" to="/ofertas">Explorar ofertas <Icon name="arrow" size={19} /></Link><Link className="button button-secondary" to="/acceso">Soy pescador</Link></div>
        <p className="hero-note">Información de origen. Consulta abierta, sin crear una cuenta.</p>
      </div><HarborArt />
    </section>
    <div className="value-strip"><div className="page-width"><span><Icon name="boat" />Del pescador al comprador</span><span><Icon name="clock" />Llegadas a la vista</span><span><Icon name="fish" />Especies y precios publicados</span></div></div>
    <section className="page-width section-space" aria-labelledby="preview-title">
      <div className="section-heading"><div><span className="eyebrow">Una mirada al terminal</span><h2 id="preview-title">Lo que se publica,<br /><em>a tu alcance.</em></h2></div><Link className="text-link" to="/ofertas">Ver todas las ofertas <Icon name="arrow" /></Link></div>
      <OfferPreview />
    </section>
    <section className="how-section" id="como-funciona" aria-labelledby="how-title"><div className="page-width section-space">
      <span className="eyebrow">Un encuentro más sencillo</span><h2 id="how-title">Dos lados del muelle.<br /><em>Un mismo lugar.</em></h2>
      <div className="how-grid"><article><span className="step-number">01 / Para compradores</span><h3>Anticipa tu consulta.</h3><p>Explora especies, precios por kilo y cantidades publicadas. Revisa las llegadas estimadas y confirmadas antes de acercarte al terminal.</p><Link to="/ofertas" className="text-link">Explorar el catálogo <Icon name="arrow" /></Link></article>
        <article><span className="step-number">02 / Para pescadores</span><h3>Da visibilidad a tu oferta.</h3><p>Con tu cuenta habilitada, registra tus arribos y mantén actualizadas tus especies, cantidades y precios desde un solo espacio.</p><Link to="/acceso" className="text-link">Entrar a mi espacio <Icon name="arrow" /></Link></article></div>
    </div></section>
    <section className="page-width section-space benefits"><div><span className="eyebrow">Información que ayuda a decidir</span><h2>Menos incertidumbre.<br /><em>Más contexto.</em></h2></div>
      <div className="benefit-list">{[
        ['Información accesible', 'Consulta las ofertas publicadas sin registro ni intermediación de la plataforma.'],
        ['Ofertas actualizables', 'Cada pescador puede ajustar su precio, cantidad y publicación.'],
        ['Llegadas diferenciadas', 'Distingue una hora estimada de una llegada ya confirmada.'],
      ].map(([title, copy]) => <article key={title}><Icon name="check" /><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
    </section>
    <section className="closing-section page-width"><span className="eyebrow">La conexión empieza aquí</span><h2>El próximo encuentro<br />empieza con <em>información.</em></h2><div className="button-row"><Link to="/ofertas" className="button button-warm">Explorar ofertas <Icon name="arrow" /></Link><Link to="/acceso" className="button button-light">Soy pescador</Link></div></section>
  </>
}