// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContext, type AuthState } from '../features/auth/AuthContext'
import { listPublishedArrivals, updateArrival } from '../features/arrivals/api'
import { listOwnArrivals, listOwnOffers, listPublishedOffers } from '../features/species-prices/api'
import { AppRoutes } from './routes'

vi.mock('../features/arrivals/api', () => ({ listPublishedArrivals: vi.fn(), updateArrival: vi.fn(), saveArrival: vi.fn() }))
vi.mock('../features/species-prices/api', () => ({ listOwnArrivals: vi.fn(), listOwnOffers: vi.fn(), listPublishedOffers: vi.fn(), saveOffer: vi.fn() }))
const arrival = { id: 'own', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T14:00:00Z', status: 'expected' as const, actual_arrival_at: null, is_published: true }
const session = { user: { id: 'owner', email: 'test@example.invalid', app_metadata: { role: 'fisher' } } } as unknown as Session
const base: AuthState = { client: {} as SupabaseClient, session: null, loading: false, error: '' }
function tree(path: string, state: Partial<AuthState> = {}) {
  return <AuthContext.Provider value={{ ...base, ...state }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider>
}
beforeEach(() => {
  vi.mocked(listPublishedArrivals).mockResolvedValue([])
  vi.mocked(listPublishedOffers).mockResolvedValue([])
  vi.mocked(listOwnArrivals).mockResolvedValue([arrival])
  vi.mocked(listOwnOffers).mockResolvedValue([])
})
afterEach(() => { cleanup(); vi.resetAllMocks() })
describe('PFCEX-16/PFCEX-17: rutas y separación de experiencias', () => {
  it('landing pública permite ir al catálogo sin mostrar formularios administrativos', async () => {
    render(tree('/'))
    expect(screen.getByRole('heading', { level: 1, name: /Más cerca del mar/ })).toBeTruthy()
    expect(screen.queryByLabelText('Contraseña')).toBeNull()
    expect(screen.queryByLabelText('Embarcación')).toBeNull()
    fireEvent.click(screen.getAllByRole('link', { name: /Explorar ofertas/ })[0])
    expect(await screen.findByRole('heading', { level: 1, name: /La oferta del mar/ })).toBeTruthy()
    expect(await screen.findByText('No hay ofertas publicadas.')).toBeTruthy()
    expect(listOwnArrivals).not.toHaveBeenCalled()
  })
  it('CTA de pescador navega al acceso con cuenta prehabilitada', async () => {
    render(tree('/'))
    fireEvent.click(screen.getAllByRole('link', { name: 'Soy pescador' })[0])
    expect(await screen.findByLabelText('Contraseña')).toBeTruthy()
    expect(screen.queryByLabelText('Embarcación')).toBeNull()
  })
  it('la ruta pública directa consulta sin sesión', async () => {
    render(tree('/ofertas'))
    expect(await screen.findByText('No hay avisos publicados.')).toBeTruthy()
    expect(listPublishedOffers).toHaveBeenCalled()
    expect(screen.queryByLabelText('Contraseña')).toBeNull()
  })
  it('redirige panel anónimo al acceso', async () => {
    render(tree('/panel'))
    expect(await screen.findByLabelText('Contraseña')).toBeTruthy()
    expect(listOwnArrivals).not.toHaveBeenCalled()
  })
  it.each(['/panel', '/acceso'])('no muestra contenido privado ni login durante recuperación en %s', path => {
    render(tree(path, { loading: true, session }))
    expect(screen.getByRole('status').textContent).toBe('Recuperando sesión…')
    expect(screen.queryByRole('button', { name: 'Registrar arribo' })).toBeNull()
    expect(screen.queryByLabelText('Contraseña')).toBeNull()
    expect(listOwnArrivals).not.toHaveBeenCalled()
  })
  it('deniega el panel a una cuenta sin rol fisher', () => {
    render(tree('/panel', { session: { user: { ...session.user, app_metadata: {} } } as Session }))
    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeTruthy()
    expect(listOwnArrivals).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Registrar arribo' })).toBeNull()
  })
  it('redirige al pescador autenticado desde acceso al panel, y vuelve al acceso al perder sesión', async () => {
    const view = render(tree('/acceso', { session }))
    expect(await screen.findByText('test@example.invalid')).toBeTruthy()
    expect(await screen.findByRole('heading', { name: 'Mis arribos' })).toBeTruthy()
    expect(screen.queryByLabelText('Contraseña')).toBeNull()
    view.rerender(tree('/acceso', { session: null }))
    expect(await screen.findByLabelText('Contraseña')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Registrar arribo' })).toBeNull()
  })
  it('no inventa ofertas cuando falla la vista previa', async () => {
    vi.mocked(listPublishedOffers).mockRejectedValue(new Error('network'))
    render(tree('/'))
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('No pudimos cargar'))
    expect(screen.queryByText('S/')).toBeNull()
  })
  it('incluye página no encontrada sin montar panel', () => {
    render(tree('/ruta-inexistente'))
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeTruthy()
    expect(listOwnArrivals).not.toHaveBeenCalled()
  })
  it('PFCEX-8: edición actualiza el panel y una nueva consulta pública', async () => {
    vi.mocked(updateArrival).mockImplementation(async (_client, id, _owner, input) => {
      const saved = { ...input, id }
      vi.mocked(listOwnArrivals).mockResolvedValue([saved])
      vi.mocked(listPublishedArrivals).mockResolvedValue([saved])
      return saved
    })
    render(tree('/panel', { session }))
    fireEvent.click(await screen.findByRole('button', { name: 'Editar arribo de TEST_ONLY' }))
    expect((screen.getByLabelText('Llegada estimada (hora de Lima)') as HTMLInputElement).value).toBe('2026-11-21T09:00')
    fireEvent.change(screen.getByLabelText('Embarcación'), { target: { value: 'TEST_EDITED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de arribo' }))
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('Arribo actualizado'))
    expect(await screen.findByRole('button', { name: 'Editar arribo de TEST_EDITED' })).toBeTruthy()
    await waitFor(() => expect(listOwnArrivals).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByRole('link', { name: 'Ver catálogo público' }))
    expect(await screen.findByText('TEST_EDITED')).toBeTruthy()
  })
})