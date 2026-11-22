import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { arrivalToForm, formatRecordUpdateTime, validateArrival, type ArrivalForm } from './model'

const form: ArrivalForm = { vesselName: 'TEST_ONLY', estimatedAt: '2026-11-21T08:30', status: 'expected', actualAt: '', published: true }
beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-22T00:00:00Z')) })
afterEach(() => { vi.restoreAllMocks() })
describe('validación de arribos', () => {
  it('PFCEX-8/PFCEX-15: fecha de registro en Lima con segundos, sin inventar valores ausentes', () => {
    expect(formatRecordUpdateTime('2026-11-21T13:30:45Z')).toContain('08:30:45')
    expect(formatRecordUpdateTime('2026-11-21T13:30:45Z')).toContain('21/11/2026')
    expect(formatRecordUpdateTime(undefined)).toBeNull()
    expect(formatRecordUpdateTime('invalid')).toBeNull()
  })
  it('PFCEX-8: recupera horas de Lima sin depender del huso del dispositivo', () => {
    const edited = arrivalToForm({ id: 'own', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T13:30:00Z', status: 'arrived', actual_arrival_at: '2026-11-21T14:15:00Z', is_published: false })
    expect(edited).toMatchObject({ estimatedAt: '2026-11-21T08:30', actualAt: '2026-11-21T09:15', published: false })
    expect(validateArrival(edited).data?.actual_arrival_at).toBe('2026-11-21T14:15:00.000Z')
  })
  it('normaliza embarcación y convierte hora de Lima a UTC', () => {
    expect(validateArrival({ ...form, vesselName: ' TEST_ONLY ' }).data).toMatchObject({
      vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T13:30:00.000Z', actual_arrival_at: null,
    })
  })
  it.each(['', ' ', 'A', 'A'.repeat(101), 'AB\nCD'])('rechaza embarcación inválida %j', vesselName => {
    expect(validateArrival({ ...form, vesselName }).error).toBeTruthy()
  })
  it.each(['', 'invalid', '2026-02-30T10:00', '1999-12-31T10:00', '2101-01-01T10:00'])('rechaza fecha inválida %s', estimatedAt => {
    expect(validateArrival({ ...form, estimatedAt }).error).toBeTruthy()
  })
  it('exige la hora real cuando se confirma una llegada', () => {
    expect(validateArrival({ ...form, status: 'arrived' }).error).toContain('confirmada')
  })
  it('conserva hora estimada y real como datos distintos', () => {
    expect(validateArrival({ ...form, status: 'arrived', actualAt: '2026-11-21T09:15' }).data).toMatchObject({
      estimated_arrival_at: '2026-11-21T13:30:00.000Z', actual_arrival_at: '2026-11-21T14:15:00.000Z',
    })
  })
  it('no permite confirmar llegadas futuras', () => {
    expect(validateArrival({ ...form, status: 'arrived', actualAt: '2100-01-01T10:00' }).error).toContain('futuro')
  })
})
