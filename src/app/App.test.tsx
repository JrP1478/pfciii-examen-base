import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'

vi.mock('../lib/supabase/client', () => ({
  getSupabaseClient: () => null,
  supabaseConfig: { configured: false, message: 'Falta configurar las variables públicas de Supabase.' },
}))

describe('interfaz inicial', () => {
  it('expone cuatro módulos y comunica la consulta pendiente', () => {
    const html = renderToStaticMarkup(<App />)
    for (const section of ['pescadores', 'arribos', 'especies', 'consulta']) {
      expect(html).toContain(`id="${section}"`)
      expect(html).toContain(`href="#${section}"`)
    }
    expect(html).toContain('Consulta no disponible: falta configurar Supabase.')
    expect(html).toContain('Registro no disponible: falta configurar Supabase.')
    expect(html).toContain('Falta configurar las variables públicas de Supabase.')
    expect(html).not.toContain('<form')
  })
})
