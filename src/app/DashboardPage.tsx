import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../components/Icon'
import { useAuth } from '../features/auth/AuthContext'
import { LogoutButton } from '../features/auth/LogoutButton'
import { ArrivalNotices } from '../features/arrivals/ArrivalNotices'
import type { Arrival } from '../features/arrivals/model'
import { SpeciesPrices } from '../features/species-prices/SpeciesPrices'

export function DashboardPage() {
  const { session } = useAuth()
  const [version, setVersion] = useState(0)
  const [editor, setEditor] = useState<{ arrival?: Arrival } | null>(null)
  return <div className="dashboard-shell">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <aside className="dashboard-sidebar"><Link className="brand" to="/"><span className="brand-mark"><Icon name="wave" size={28} /></span><span>CHORRILLOS<small>Terminal pesquero</small></span></Link>
      <span className="eyebrow">Espacio del pescador</span><nav aria-label="Navegación del panel"><a href="#mis-arribos"><Icon name="boat" />Mis arribos</a><a href="#especies"><Icon name="fish" />Mis ofertas</a><Link to="/ofertas"><Icon name="grid" />Ver catálogo público</Link></nav>
      <p className="sidebar-note">La información de tus arribos y ofertas, bajo tu control.</p><span className="demo-tag">MVP demostrativo</span>
    </aside>
    <main id="contenido" className="dashboard-content"><header className="dashboard-header"><div><span className="eyebrow">Tu espacio de trabajo</span><p className="user-email">{session?.user.email}</p></div><LogoutButton /></header>
      <div className="dashboard-title"><div><span className="eyebrow">Gestión del desembarque</span><h1 tabIndex={-1}>Tu actividad,<br /><em>bien organizada.</em></h1><p>Registra una llegada, prepara tus ofertas y decide qué compartir.</p></div><button onClick={() => setEditor({})}><Icon name="boat" />Registrar arribo</button></div>
      {editor && <ArrivalNotices key={editor.arrival?.id ?? 'new'} initialArrival={editor.arrival} onCancel={() => setEditor(null)} onSaved={() => setVersion(value => value + 1)} />}
      <SpeciesPrices arrivalsVersion={version} onSaved={() => setVersion(value => value + 1)} onEditArrival={arrival => setEditor({ arrival })} />
      <p className="demo-note">MVP demostrativo. Los registros pueden ser de prueba y no representan operaciones comerciales verificadas.</p>
    </main>
  </div>
}