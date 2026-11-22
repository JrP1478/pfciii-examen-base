import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listPublishedArrivals, saveArrival } from './api'
import type { ArrivalInput } from './model'

const input: ArrivalInput = { vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T13:00:00Z', status: 'expected', actual_arrival_at: null, is_published: true }
function fakeClient(result: { data: unknown; error: unknown }) {
  const query = {
    insert: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(result), single: vi.fn().mockResolvedValue(result),
  }
  return { client: { from: vi.fn().mockReturnValue(query) } as unknown as SupabaseClient, query }
}
describe('acceso a Supabase (dobles de prueba)', () => {
  it('solo confirma persistencia con una fila devuelta', async () => {
    const { client, query } = fakeClient({ data: { id: 'test-id', ...input }, error: null })
    await expect(saveArrival(client, input)).resolves.toMatchObject({ id: 'test-id' })
    expect(query.insert).toHaveBeenCalledWith(input)
    expect(query.single).toHaveBeenCalled()
  })
  it.each([{ data: null, error: null }, { data: null, error: { message: 'internal-detail' } }])('no confirma un guardado fallido', async result => {
    const { client } = fakeClient(result)
    await expect(saveArrival(client, input)).rejects.toThrow('No se pudo confirmar')
  })
  it('filtra publicados y selecciona columnas públicas explícitas', async () => {
    const { client, query } = fakeClient({ data: [], error: null })
    await expect(listPublishedArrivals(client)).resolves.toEqual([])
    expect(query.eq).toHaveBeenCalledWith('is_published', true)
    expect(query.select.mock.calls[0][0]).not.toContain('owner_id')
    expect(query.limit).toHaveBeenCalledWith(50)
  })
  it('diferencia error de consulta de lista vacía', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'internal-detail' } })
    await expect(listPublishedArrivals(client)).rejects.toThrow('No se pudieron consultar')
  })
})