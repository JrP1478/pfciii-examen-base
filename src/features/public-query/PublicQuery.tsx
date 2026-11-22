export function PublicQuery() {
  return (
    <section className="public-panel" id="consulta" aria-labelledby="public-title">
      <div>
        <span className="eyebrow">Consulta pública</span>
        <h2 id="public-title">El terminal, a la vista de todos</h2>
        <p>Este espacio permitirá consultar la información publicada del terminal.</p>
      </div>
      <div className="empty-state">
        <span className="empty-symbol" aria-hidden="true">≈</span>
        <h3>Consulta aún no disponible</h3>
        <p>La fuente de datos no está conectada. No se han consultado arribos ni precios.</p>
      </div>
    </section>
  )
}
