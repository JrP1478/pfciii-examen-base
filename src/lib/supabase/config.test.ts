import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './config'

// Valores sintéticos de pruebas, sin proyecto ni credenciales reales.
const env = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only' }

describe('configuración Supabase', () => {
  it('permite arrancar sin variables', () => {
    expect(readSupabaseConfig({}).configured).toBe(false)
  })
  it('requiere ambas variables', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: env.VITE_SUPABASE_URL }).configured).toBe(false)
  })
  it.each(['http://example.supabase.co', 'invalid', 'javascript:alert(1)'])('rechaza URL insegura %s', (url) => {
    expect(readSupabaseConfig({ ...env, VITE_SUPABASE_URL: url }).configured).toBe(false)
  })
  it.each(['sb_secret_test_only', 'service_role', 'eyJhbGciOiJIUzI1NiJ9.test.signature'])('rechaza clave no publishable %s', (key) => {
    expect(readSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key }).configured).toBe(false)
  })
  it('acepta formato público sin comprobar conectividad', () => {
    expect(readSupabaseConfig(env)).toEqual({ configured: true, config: { url: env.VITE_SUPABASE_URL, publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY } })
  })
})
