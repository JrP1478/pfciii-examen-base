import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listOwnArrivals, listOwnOffers, listPublishedOffers, saveOffer } from './api'
import type { OfferInput } from './model'

const input: OfferInput = { arrival_id: 'own-arrival', species_name: 'TEST_ONLY', quantity_kg: 1, price_per_kg: 2, currency: 'PEN', is_published: false }
type Result = { data: unknown; error: unknown }
function fakeClient(result: Result) {
  const query = {
    insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(), abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return { client: { from: vi.fn().mockReturnValue(query) } as unknown as SupabaseClient, query }
}
describe('PFCEX-10/PFCEX-11: API de ofertas (dobles)', () => {
  it('selecciona arribos por propietario, incluidos sus borradores', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await listOwnArrivals(client, 'owner')
    expect(query.eq).toHaveBeenCalledWith('owner_id', 'owner')
    expect(query.eq).not.toHaveBeenCalledWith('is_published', true)
  })
  it('acota ofertas al arribo y al propietario', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await listOwnOffers(client, 'owner', 'own-arrival')
    expect(query.eq).toHaveBeenCalledWith('arrivals.owner_id', 'owner')
    expect(query.eq).toHaveBeenCalledWith('arrival_id', 'own-arrival')
  })
  it('crea con confirmación de la fila persistida', async () => {
    const { client, query } = fakeClient({ data: { id: 'offer-id', ...input }, error: null })
    await expect(saveOffer(client, input)).resolves.toMatchObject({ id: 'offer-id' })
    expect(query.insert).toHaveBeenCalledWith(input)
    expect(query.single).toHaveBeenCalled()
  })
  it('edita solo el id elegido en su arribo, sin reasignarlo', async () => {
    const { client, query } = fakeClient({ data: { id: 'offer-id', ...input }, error: null })
    await saveOffer(client, input, 'offer-id')
    expect(query.update).toHaveBeenCalledWith({
      species_name: input.species_name, quantity_kg: 1, price_per_kg: 2, currency: 'PEN', is_published: false,
    })
    expect(query.eq).toHaveBeenCalledWith('id', 'offer-id')
    expect(query.eq).toHaveBeenCalledWith('arrival_id', 'own-arrival')
    expect(query.insert).not.toHaveBeenCalled()
  })
  it.each([null, { message: 'RLS internal details' }])('no confirma una edición sin fila o denegada', async error => {
    const { client } = fakeClient({ data: null, error })
    await expect(saveOffer(client, input, 'other-offer')).rejects.toThrow('No se pudo confirmar')
  })
  it.each(['arrivals', 'offers'])('distingue error de carga de %s de colección vacía', async target => {
    const { client } = fakeClient({ data: null, error: { message: 'private' } })
    await expect(target === 'arrivals' ? listOwnArrivals(client, 'owner') : listOwnOffers(client, 'owner', 'id')).rejects.toThrow('No se pudieron cargar')
  })
})
describe('PFCEX-13/PFCEX-14: lectura pública y filtros (dobles)', () => {
  it('filtra oferta y arribo publicados incluso con un propietario autenticado', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await listPublishedOffers(client)
    expect(query.eq).toHaveBeenCalledWith('is_published', true)
    expect(query.eq).toHaveBeenCalledWith('arrivals.is_published', true)
    const columns = query.select.mock.calls[0][0] as string
    expect(columns).toContain('arrivals!inner(')
    expect(columns).not.toContain('owner_id')
  })
  it('aplica especie antes del límite y escapa comodines', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await listPublishedOffers(client, ' TEST_% ')
    expect(query.ilike).toHaveBeenCalledWith('species_name', '%TEST\\_\\%%')
  })
  it('admite cancelación de peticiones al limpiar el polling', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    const controller = new AbortController()
    await listPublishedOffers(client, '', controller.signal)
    expect(query.abortSignal).toHaveBeenCalledWith(controller.signal)
  })
  it('no convierte errores públicos en resultados vacíos', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'private' } })
    await expect(listPublishedOffers(client)).rejects.toThrow('No se pudieron consultar')
  })
})