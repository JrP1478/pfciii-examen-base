// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContext, type AuthState } from '../auth/AuthContext'
import type { Arrival } from '../arrivals/model'
import { SpeciesPrices } from './SpeciesPrices'
import { listOwnArrivals, listOwnOffers, saveOffer } from './api'
import type { Offer } from './model'

vi.mock('./api', () => ({ listOwnArrivals: vi.fn(), listOwnOffers: vi.fn(), saveOffer: vi.fn() }))
const arrival: Arrival = { id: 'own-arrival', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T14:00:00Z', status: 'expected', actual_arrival_at: null, is_published: true }
const offer: Offer = { id: 'own-offer', arrival_id: arrival.id, species_name: 'TEST_SPECIES', quantity_kg: 1, price_per_kg: 2, currency: 'PEN', is_published: true }
const session = { user: { id: 'owner', app_metadata: { role: 'fisher' } } } as unknown as Session
const base: AuthState = { client: {} as SupabaseClient, session, loading: false, error: '' }
function show(onSaved = vi.fn(), state: Partial<AuthState> = {}) {
  return render(<AuthContext.Provider value={{ ...base, ...state }}><SpeciesPrices arrivalsVersion={0} onSaved={onSaved} /></AuthContext.Provider>)
}
async function fill() {
  await screen.findByLabelText('Especie')
  fireEvent.change(screen.getByLabelText('Especie'), { target: { value: 'TEST_NEW' } })
  fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '3.125' } })
  fireEvent.change(screen.getByLabelText('Precio por kg (S/)'), { target: { value: '4.50' } })
}
beforeEach(() => {
  vi.mocked(listOwnArrivals).mockResolvedValue([arrival])
  vi.mocked(listOwnOffers).mockResolvedValue([])
})
afterEach(() => { cleanup(); vi.resetAllMocks() })
describe('PFCEX-10: registro de ofertas', () => {
  it('bloquea gestión sin configuración, sin sesión y sin rol fisher', () => {
    const view = show(vi.fn(), { client: null })
    expect(screen.getByText(/falta configurar Supabase/)).toBeTruthy()
    view.unmount()
    const visitor = show(vi.fn(), { session: null })
    expect(screen.getByText(/Inicia sesión como pescador/)).toBeTruthy()
    visitor.unmount()
    show(vi.fn(), { session: { user: { ...session.user, app_metadata: {} } } as Session })
    expect(listOwnArrivals).not.toHaveBeenCalled()
  })
  it('selecciona un arribo propio y advierte si es privado', async () => {
    vi.mocked(listOwnArrivals).mockResolvedValue([arrival, { ...arrival, id: 'own-private', is_published: false }])
    show()
    const select = await screen.findByLabelText('Selecciona tu arribo (hasta 100 recientes)')
    fireEvent.change(select, { target: { value: 'own-private' } })
    expect(await screen.findByText(/Este arribo es privado/)).toBeTruthy()
    await waitFor(() => expect(listOwnOffers).toHaveBeenLastCalledWith(base.client, 'owner', 'own-private', expect.any(AbortSignal)))
  })
  it('crea un borrador y confirma solo al recibir la fila', async () => {
    let finish!: (value: Offer) => void
    vi.mocked(saveOffer).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const onSaved = vi.fn()
    show(onSaved)
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar oferta' }))
    expect(screen.queryByText(/Oferta guardada/)).toBeNull()
    expect((screen.getByRole('button', { name: 'Guardando oferta…' }) as HTMLButtonElement).disabled).toBe(true)
    expect(saveOffer).toHaveBeenCalledWith(base.client, {
      arrival_id: arrival.id, species_name: 'TEST_NEW', quantity_kg: 3.125, price_per_kg: 4.5, currency: 'PEN', is_published: false,
    }, undefined)
    await act(async () => finish({ ...offer, species_name: 'TEST_NEW', is_published: false }))
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('Borrador privado'))
    expect(onSaved).toHaveBeenCalledOnce()
  })
  it('rechaza especie en blanco sin intentar guardar', async () => {
    show()
    await fill()
    fireEvent.change(screen.getByLabelText('Especie'), { target: { value: '  ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar oferta' }).closest('form')!)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(saveOffer).not.toHaveBeenCalled()
  })
  it('muestra ausencia de arribos y no ofrece un formulario ficticio', async () => {
    vi.mocked(listOwnArrivals).mockResolvedValue([])
    show()
    expect(await screen.findByText(/No tienes arribos/)).toBeTruthy()
    expect(screen.queryByLabelText('Especie')).toBeNull()
  })
  it('maneja error al cargar arribos y permite reintentar', async () => {
    vi.mocked(listOwnArrivals).mockRejectedValueOnce(new Error('network'))
    show()
    expect(await screen.findByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar mis arribos' }))
    expect(await screen.findByLabelText('Especie')).toBeTruthy()
  })
  it('maneja error al cargar ofertas y permite reintentar', async () => {
    vi.mocked(listOwnOffers).mockRejectedValueOnce(new Error('network'))
    show()
    expect(await screen.findByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar ofertas' }))
    expect(await screen.findByLabelText('Especie')).toBeTruthy()
  })
  it('descarta respuestas de otro arribo al cambiar selección', async () => {
    let finish!: (value: Offer[]) => void
    vi.mocked(listOwnArrivals).mockResolvedValue([arrival, { ...arrival, id: 'second' }])
    vi.mocked(listOwnOffers).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    show()
    const select = await screen.findByLabelText('Selecciona tu arribo (hasta 100 recientes)')
    fireEvent.change(select, { target: { value: 'second' } })
    await screen.findByLabelText('Especie')
    await act(async () => finish([offer]))
    expect(screen.queryByRole('button', { name: 'Editar TEST_SPECIES' })).toBeNull()
  })
})
describe('PFCEX-11: edición y disponibilidad', () => {
  it('PFCEX-12: guarda cero sin despublicar y confirma agotamiento tras persistir', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([offer])
    vi.mocked(saveOffer).mockResolvedValue({ ...offer, quantity_kg: 0 })
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('Especie agotada'))
    expect(saveOffer).toHaveBeenCalledWith(base.client, expect.objectContaining({ quantity_kg: 0, is_published: true }), 'own-offer')
    expect(screen.getByText(/Agotada · 0 kg/)).toBeTruthy()
  })
  it('PFCEX-12: repone cantidad positiva de una oferta agotada', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([{ ...offer, quantity_kg: 0 }])
    vi.mocked(saveOffer).mockResolvedValue({ ...offer, quantity_kg: 3 })
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    await screen.findByRole('status')
    expect(screen.queryByText(/Agotada · 0 kg/)).toBeNull()
    expect(saveOffer).toHaveBeenCalledWith(base.client, expect.objectContaining({ quantity_kg: 3 }), 'own-offer')
  })
  it('PFCEX-12: sin persistencia de cero no anuncia éxito ni altera el stock mostrado', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([offer])
    vi.mocked(saveOffer).mockRejectedValue(new Error('constraint not migrated'))
    const onSaved = vi.fn()
    show(onSaved)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText(/Agotada · 0 kg/)).toBeNull()
    expect(onSaved).not.toHaveBeenCalled()
  })
  it('edita especie, cantidad, precio y despublica una oferta propia', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([offer])
    vi.mocked(saveOffer).mockResolvedValue({ ...offer, species_name: 'TEST_NEW', quantity_kg: 3.125, price_per_kg: 4.5, is_published: false })
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    await fill()
    fireEvent.click(screen.getByLabelText('Publicar oferta'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    await screen.findByRole('status')
    expect(saveOffer).toHaveBeenCalledWith(base.client, expect.objectContaining({ is_published: false, species_name: 'TEST_NEW', quantity_kg: 3.125, price_per_kg: 4.5 }), 'own-offer')
    expect(screen.queryByRole('button', { name: 'Editar TEST_SPECIES' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Editar TEST_NEW' })).toBeTruthy()
  })
  it('mantiene cambios y muestra error ante una edición denegada por RLS', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([offer])
    vi.mocked(saveOffer).mockRejectedValue(new Error('denied'))
    const onSaved = vi.fn()
    show(onSaved)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    await fill()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText(/Oferta guardada/)).toBeNull()
    expect((screen.getByLabelText('Especie') as HTMLInputElement).value).toBe('TEST_NEW')
    expect(onSaved).not.toHaveBeenCalled()
  })
  it('cancelar edición no escribe y reinicia el formulario', async () => {
    vi.mocked(listOwnOffers).mockResolvedValue([offer])
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar edición' }))
    expect((screen.getByLabelText('Especie') as HTMLInputElement).value).toBe('')
    expect(saveOffer).not.toHaveBeenCalled()
  })
})
