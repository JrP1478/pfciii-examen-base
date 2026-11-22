import { FisherAuth } from '../features/auth/FisherAuth'
import { ArrivalNotices } from '../features/arrivals/ArrivalNotices'
import { SpeciesPrices } from '../features/species-prices/SpeciesPrices'
import { PublicQuery } from '../features/public-query/PublicQuery'
import { supabaseConfig } from '../lib/supabase/client'

export function App() {
  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Terminal Pesquero de Chorrillos, inicio">
          <span className="brand-mark" aria-hidden="true">≈</span>
          <span>Terminal Pesquero<strong>Chorrillos</strong></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#pescadores">Pescadores</a><a href="#arribos">Arribos</a>
          <a href="#especies">Especies y precios</a>
          <a className="nav-public" href="#consulta">Consulta pública ↗</a>
        </nav>
      </header>
      <main id="contenido">
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">Chorrillos, Lima · Perú</span>
            <h1 id="hero-title">El mar nos conecta.<br /><span>La información también.</span></h1>
            <p>Una base digital para los pescadores y la comunidad del Terminal Pesquero de Chorrillos.</p>
            <a className="primary-link" href="#consulta">Explorar consulta pública ↓</a>
          </div>
          <div className="harbor" aria-hidden="true">
            <div className="sun" /><div className="horizon" /><div className="boat"><span /></div>
            <div className="wave wave-one" /><div className="wave wave-two" /><div className="wave wave-three" />
            <span className="harbor-label">Entre la costa y la comunidad</span>
          </div>
        </section>
        <aside className="project-status" aria-label="Estado del proyecto">
          <strong>Versión inicial · En preparación</strong>
          <span>{supabaseConfig.configured
            ? 'Variables de Supabase configuradas; conexión no verificada.'
            : supabaseConfig.message}</span>
        </aside>
        <div className="section-heading"><span className="eyebrow">Una plataforma, cuatro espacios</span><h2>Desde el mar hasta el terminal</h2></div>
        <div className="modules"><FisherAuth /><ArrivalNotices /><SpeciesPrices /></div>
        <PublicQuery />
      </main>
      <footer><span>Terminal Pesquero de Chorrillos</span><span>MVP académico · PFC III Tipo F</span></footer>
    </>
  )
}
