// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContext } from '../auth/AuthContext'
import { listPublishedArrivals } from '../arrivals/api'
import { listOwnArrivals, listOwnOffers, listPublishedOffers, saveOffer } from '../species-prices/api'
import { SpeciesPrices } from '../species-prices/SpeciesPrices'
import type { Offer, PublicOffer } from '../species-prices/model'
import { PublicQuery, PUBLIC_POLL_INTERVAL } from './PublicQuery'

vi.mock('../arrivals/api', () => ({ listPublishedArrivals: vi.fn() }))
vi.mock('../species-prices/api', () => ({
  listPublishedOffers: vi.fn(), listOwnArrivals: vi.fn(), listOwnOffers: vi.fn(), saveOffer: vi.fn(),
}))
const client = {} as SupabaseClient
const arrival = { id: 'own-arrival', vessel_name: 'TEST_VESSEL', estimated_arrival_at: '2026-11-21T14:00:00Z', status: 'expected' as const, actual_arrival_at: null, is_published: true }
const offer: PublicOffer = {
  id: 'test-offer', arrival_id: arrival.id, species_name: 'TEST_SPECIES', quantity_kg: 1.125, price_per_kg: 2.5,
  currency: 'PEN', is_published: true, arrivals: arrival,
}
function show() {
  return render(<AuthContext.Provider value={{ client, session: null, loading: false, error: '' }}><PublicQuery refreshVersion={0} /></AuthContext.Provider>)
}
beforeEach(() => {
  vi.mocked(listPublishedArrivals).mockResolvedValue([])
  vi.mocked(listPublishedOffers).mockResolvedValue([])
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.resetAllMocks() })

describe('PFCEX-13: lectura pública, errores y sincronización', () => {
  it('PFCEX-8/PFCEX-15: consultar de nuevo cambia la lectura, no el updated_at del arribo', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'))
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const updatedAt = '2026-11-21T13:30:45Z'
    vi.mocked(listPublishedArrivals).mockResolvedValue([{ ...arrival, updated_at: updatedAt }])
    show()
    await act(async () => {})
    expect(screen.getByText(/^Arribo actualizado:/).querySelector('time')?.dateTime).toBe(updatedAt)
    expect(screen.getByText(/^Última consulta al servicio:/).querySelector('time')?.dateTime).toBe('2026-11-22T12:00:00.000Z')
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL) })
    expect(screen.getByText(/^Última consulta al servicio:/).querySelector('time')?.dateTime).toBe('2026-11-22T12:00:30.000Z')
    expect(screen.getByText(/^Arribo actualizado:/).querySelector('time')?.dateTime).toBe(updatedAt)
  })
  it('PFCEX-8: una actualización posterior del servidor se refleja en el aviso público', async () => {
    vi.mocked(listPublishedArrivals).mockResolvedValueOnce([{ ...arrival, updated_at: '2026-11-21T13:00:00Z' }])
      .mockResolvedValueOnce([{ ...arrival, updated_at: '2026-11-21T15:00:00Z' }])
    show()
    expect((await screen.findByText(/^Arribo actualizado:/)).querySelector('time')?.dateTime).toBe('2026-11-21T13:00:00Z')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar avisos' }))
    expect((await screen.findByText(/^Arribo actualizado:/)).querySelector('time')?.dateTime).toBe('2026-11-21T15:00:00Z')
  })
  it('muestra especie, cantidad, soles y su embarcación sin iniciar sesión', async () => {
    vi.mocked(listPublishedOffers).mockResolvedValue([offer])
    show()
    expect(await screen.findByText('TEST_SPECIES')).toBeTruthy()
    expect(screen.getByText(/1.125 kg disponibles/)).toBeTruthy()
    expect(screen.getByText(/2.50\/kg/)).toBeTruthy()
    expect(screen.getByText('Embarcación: TEST_VESSEL')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).toBeNull()
  })
  it('no confunde fallo de ofertas con una lista vacía y permite actualización manual', async () => {
    vi.mocked(listPublishedOffers).mockRejectedValueOnce(new Error('private')).mockResolvedValueOnce([])
    show()
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('No hay ofertas publicadas.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar avisos' }))
    expect(await screen.findByText('No hay ofertas publicadas.')).toBeTruthy()
  })
  it('consulta periódicamente y cancela peticiones y temporizador al desmontar', async () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const view = show()
    await act(async () => {})
    expect(listPublishedOffers).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL) })
    expect(listPublishedOffers).toHaveBeenCalledTimes(2)
    const signal = vi.mocked(listPublishedOffers).mock.calls[0][2]!
    view.unmount()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL * 3) })
    expect(listPublishedOffers).toHaveBeenCalledTimes(2)
  })
  it('omite polling con pestaña oculta, manteniendo el botón manual', async () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    show()
    await act(async () => {})
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL * 2) })
    expect(listPublishedOffers).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar avisos' }))
    await act(async () => {})
    expect(listPublishedOffers).toHaveBeenCalledTimes(2)
  })
  it('espera a que termine una consulta antes de programar la siguiente', async () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    let finish!: (value: PublicOffer[]) => void
    vi.mocked(listPublishedOffers).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    show()
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL * 3) })
    expect(listPublishedOffers).toHaveBeenCalledTimes(1)
    await act(async () => finish([]))
    await act(async () => { await vi.advanceTimersByTimeAsync(PUBLIC_POLL_INTERVAL) })
    expect(listPublishedOffers).toHaveBeenCalledTimes(2)
  })
})
describe('PFCEX-14: filtro público por especie', () => {
  it('aplica el filtro, muestra estado vacío y permite limpiarlo', async () => {
    vi.mocked(listPublishedOffers).mockResolvedValueOnce([offer]).mockResolvedValueOnce([]).mockResolvedValueOnce([offer])
    show()
    await screen.findByText('TEST_SPECIES')
    fireEvent.change(screen.getByLabelText('Filtrar ofertas por especie'), { target: { value: ' NO_MATCH ' } })
    fireEvent.click(screen.getByRole('button', { name: /^Filtrar$/ }))
    expect(await screen.findByText('No hay ofertas publicadas para esa especie.')).toBeTruthy()
    expect(listPublishedOffers).toHaveBeenLastCalledWith(client, 'NO_MATCH', expect.any(AbortSignal))
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtro' }))
    expect(await screen.findByText('TEST_SPECIES')).toBeTruthy()
    expect(listPublishedOffers).toHaveBeenLastCalledWith(client, '', expect.any(AbortSignal))
  })
  it('descarta una respuesta antigua después de cambiar el filtro', async () => {
    let finish!: (value: PublicOffer[]) => void
    vi.mocked(listPublishedOffers).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    show()
    const oldSignal = vi.mocked(listPublishedOffers).mock.calls[0][2]!
    fireEvent.change(screen.getByLabelText('Filtrar ofertas por especie'), { target: { value: 'NO_MATCH' } })
    fireEvent.click(screen.getByRole('button', { name: /^Filtrar$/ }))
    await screen.findByText('No hay ofertas publicadas para esa especie.')
    expect(oldSignal.aborted).toBe(true)
    await act(async () => finish([offer]))
    expect(screen.queryByText('TEST_SPECIES')).toBeNull()
  })
})
describe('PFCEX-10/PFCEX-11/PFCEX-13: creación, edición y actualización de consulta', () => {
  it('publicar refresca la consulta y despublicar retira la oferta sin esperar polling', async () => {
    let stored: PublicOffer | null = null
    vi.mocked(listOwnArrivals).mockResolvedValue([arrival])
    vi.mocked(listOwnOffers).mockResolvedValue([])
    vi.mocked(listPublishedOffers).mockImplementation(async () => stored?.is_published ? [stored] : [])
    vi.mocked(saveOffer).mockImplementation(async (_client, input): Promise<Offer> => {
      stored = { ...input, id: 'saved-offer', arrivals: arrival }
      return stored
    })
    function Board() {
      const [version, setVersion] = useState(0)
      return <AuthContext.Provider value={{ client, session: { user: { id: 'owner', app_metadata: { role: 'fisher' } } } as unknown as Session, loading: false, error: '' }}>
        <SpeciesPrices arrivalsVersion={0} onSaved={() => setVersion(value => value + 1)} />
        <PublicQuery refreshVersion={version} />
      </AuthContext.Provider>
    }
    render(<Board />)
    const publicBoard = within(screen.getByRole('region', { name: 'Avisos y ofertas publicados' }))
    await screen.findByLabelText('Especie')
    fireEvent.change(screen.getByLabelText('Especie'), { target: { value: 'TEST_SPECIES' } })
    fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '1.125' } })
    fireEvent.change(screen.getByLabelText('Precio por kg (S/)'), { target: { value: '2.50' } })
    fireEvent.click(screen.getByLabelText('Publicar oferta'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar oferta' }))
    expect(await publicBoard.findByText('TEST_SPECIES')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.change(screen.getByLabelText('Precio por kg (S/)'), { target: { value: '3.00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await publicBoard.findByText(/3.00\/kg/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.change(screen.getByLabelText('Cantidad disponible (kg)'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await publicBoard.findByText('Agotada')).toBeTruthy()
    expect(publicBoard.queryByText(/kg disponibles/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Editar TEST_SPECIES' }))
    fireEvent.click(screen.getByLabelText('Publicar oferta'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de oferta' }))
    expect(await publicBoard.findByText('No hay ofertas publicadas.')).toBeTruthy()
    expect(publicBoard.queryByText('TEST_SPECIES')).toBeNull()
  })
})
