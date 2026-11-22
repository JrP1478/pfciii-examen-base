import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { MemoryRouter } from 'react-router'

vi.mock('../lib/supabase/client', () => ({
  getSupabaseClient: () => null,
  supabaseConfig: { configured: false, message: 'Falta configurar las variables públicas de Supabase.' },
}))

describe('interfaz inicial', () => {
  it('ofrece navegación pública sin formularios administrativos', () => {
    const html = renderToStaticMarkup(<MemoryRouter><App /></MemoryRouter>)
    expect(html).toContain('href="/ofertas"')
    expect(html).toContain('href="/acceso"')
    expect(html).toContain('Consulta no disponible: falta configurar Supabase.')
    expect(html).toContain('MVP demostrativo')
    expect(html).not.toContain('<form')
  })
})
