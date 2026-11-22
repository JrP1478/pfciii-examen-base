// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContext } from '../auth/AuthContext'
import { ArrivalNotices } from './ArrivalNotices'
import { saveArrival, updateArrival } from './api'
import type { Arrival } from './model'

vi.mock('./api', () => ({ updateArrival: vi.fn(), saveArrival: vi.fn() }))
const arrival: Arrival = { id: 'own', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T14:00:00Z', status: 'expected', actual_arrival_at: null, is_published: true }
const session = { user: { id: 'owner', app_metadata: { role: 'fisher' } } } as unknown as Session
function show(onSaved = vi.fn()) {
  return render(<AuthContext.Provider value={{ client: {} as SupabaseClient, session, loading: false, error: '' }}><ArrivalNotices initialArrival={arrival} onSaved={onSaved} /></AuthContext.Provider>)
}
afterEach(() => { cleanup(); vi.resetAllMocks() })
describe('PFCEX-8: edición de arribo propio', () => {
  it('actualiza estado, horas de Lima y publicación; evita doble envío y confirma solo al persistir', async () => {
    let finish!: (value: Arrival) => void
    vi.mocked(updateArrival).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const onSaved = vi.fn()
    show(onSaved)
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'arrived' } })
    fireEvent.change(screen.getByLabelText('Llegada confirmada (hora de Lima)'), { target: { value: '2020-11-21T09:15' } })
    fireEvent.click(screen.getByLabelText('Publicar para compradores'))
    const form = screen.getByRole('button', { name: 'Guardar cambios de arribo' }).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(updateArrival).toHaveBeenCalledTimes(1)
    expect(updateArrival).toHaveBeenCalledWith(expect.anything(), 'own', 'owner', expect.objectContaining({
      estimated_arrival_at: '2026-11-21T14:00:00.000Z', status: 'arrived', actual_arrival_at: '2020-11-21T14:15:00.000Z', is_published: false,
    }))
    expect(screen.queryByRole('status')).toBeNull()
    await act(async () => finish({ ...arrival, status: 'arrived', actual_arrival_at: '2020-11-21T14:15:00Z', is_published: false }))
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('Arribo actualizado como borrador'))
    expect(onSaved).toHaveBeenCalledOnce()
    expect(saveArrival).not.toHaveBeenCalled()
  })
  it('maneja denegación o fallo de red sin confirmar ni perder cambios', async () => {
    vi.mocked(updateArrival).mockRejectedValue(new Error('RLS'))
    const onSaved = vi.fn()
    show(onSaved)
    fireEvent.change(screen.getByLabelText('Embarcación'), { target: { value: 'TEST_EDITED' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios de arribo' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
    expect((screen.getByLabelText('Embarcación') as HTMLInputElement).value).toBe('TEST_EDITED')
    expect(onSaved).not.toHaveBeenCalled()
  })
  it('no envía valores inválidos y no permite alterar identidad ni auditoría', () => {
    show()
    fireEvent.change(screen.getByLabelText('Embarcación'), { target: { value: '  ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios de arribo' }).closest('form')!)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(updateArrival).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Propietario')).toBeNull()
    expect(screen.queryByLabelText('UUID')).toBeNull()
  })
})