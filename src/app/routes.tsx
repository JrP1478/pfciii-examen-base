import { lazy, Suspense, useEffect } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Icon } from '../components/Icon'
import { isFisher, useAuth } from '../features/auth/AuthContext'
import { FisherAuth } from '../features/auth/FisherAuth'
import { LandingPage } from './LandingPage'
const DashboardPage = lazy(() => import('./DashboardPage').then(module => ({ default: module.DashboardPage })))
const PublicQuery = lazy(() => import('../features/public-query/PublicQuery').then(module => ({ default: module.PublicQuery })))

function PublicLayout() {
  const { session, loading } = useAuth()
  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <header className="site-header page-width"><Link className="brand" to="/" aria-label="Terminal Pesquero de Chorrillos, inicio"><span className="brand-mark"><Icon name="wave" size={28} /></span><span>CHORRILLOS<small>Terminal pesquero</small></span></Link>
      <nav aria-label="Navegación principal"><NavLink to="/ofertas">Ofertas y arribos</NavLink><a className="nav-how" href="/#como-funciona">Cómo funciona</a><Link className="nav-access" to={!loading && isFisher(session) ? '/panel' : '/acceso'}>{!loading && isFisher(session) ? 'Mi panel' : 'Acceso pescadores'}<Icon name="arrow" size={17} /></Link></nav></header>
    <main id="contenido"><Outlet /></main>
    <footer className="site-footer page-width"><div><Link className="brand" to="/"><Icon name="wave" size={25} /><span>CHORRILLOS<small>Terminal pesquero</small></span></Link><p>Un punto de encuentro con el origen.</p></div><div><span className="demo-tag">MVP demostrativo · PFC III</span><p>Los registros pueden ser de prueba.<br />No constituyen operaciones comerciales verificadas.</p></div></footer>
  </>
}
function AccessPage() {
  const { session, loading } = useAuth()
  if (loading) return <div className="page-width route-state" role="status">Recuperando sesión…</div>
  if (isFisher(session)) return <Navigate to="/panel" replace />
  return <div className="page-width access-page"><div className="access-copy"><span className="eyebrow">Para quienes salen al mar</span><h1 tabIndex={-1}>Tu trabajo merece<br /><em>ser visible.</em></h1><p>Un espacio para organizar tus llegadas y mantener tu oferta al día.</p><Link to="/ofertas" className="text-link">Solo quiero consultar ofertas <Icon name="arrow" /></Link></div><FisherAuth /></div>
}
function PanelGuard() {
  const { loading, session } = useAuth()
  if (loading) return <main className="page-width route-state" role="status">Recuperando sesión…</main>
  if (!session) return <Navigate to="/acceso" replace />
  if (!isFisher(session)) return <main className="page-width route-state"><h1>Acceso restringido</h1><p>Esta cuenta no está habilitada como pescador.</p><Link to="/acceso">Volver al acceso</Link></main>
  return <Suspense fallback={<main className="page-width route-state" role="status">Preparando tu espacio…</main>}><DashboardPage key={session.user.id} /></Suspense>
}
function PageMetadata() {
  const { pathname } = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Información desde el origen', '/ofertas': 'Ofertas y arribos', '/acceso': 'Acceso de pescadores', '/panel': 'Mi panel' }
    document.title = `${titles[pathname] ?? 'Página no encontrada'} · Chorrillos`
  }, [pathname])
  return null
}
export function AppRoutes() {
  return <><PageMetadata /><Routes><Route element={<PublicLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/ofertas" element={<div className="page-width catalog-page"><div className="catalog-heading"><span className="eyebrow">Desde el terminal</span><h1 tabIndex={-1}>La oferta del mar,<br /><em>a tu alcance.</em></h1><p>Explora la información publicada por los pescadores. Sin registro, a tu ritmo.</p><p className="demo-note">MVP demostrativo: los registros pueden ser de prueba, sin verificación comercial.</p></div><Suspense fallback={<p role="status">Preparando catálogo…</p>}><PublicQuery refreshVersion={0} /></Suspense></div>} />
    <Route path="/acceso" element={<AccessPage />} />
    <Route path="*" element={<div className="page-width route-state"><h1>Página no encontrada</h1><Link to="/">Volver al inicio</Link></div>} />
  </Route><Route path="/panel" element={<PanelGuard />} /></Routes></>
}
