// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthContext, type AuthState } from './auth/AuthContext'
import { FisherAuth } from './auth/FisherAuth'
import { ArrivalNotices } from './arrivals/ArrivalNotices'
import { PublicQuery } from './public-query/PublicQuery'
import { listPublishedArrivals, saveArrival } from './arrivals/api'

vi.mock('./arrivals/api', () => ({ saveArrival: vi.fn(), listPublishedArrivals: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })
const session = { user: { id: 'test-fisher', email: 'test@example.invalid', app_metadata: { role: 'fisher' } } } as unknown as Session
const base: AuthState = { client: {} as SupabaseClient, session, loading: false, error: '' }
function show(ui: React.ReactNode, state: Partial<AuthState> = {}) {
  return render(<AuthContext.Provider value={{ ...base, ...state }}>{ui}</AuthContext.Provider>)
}
function fillArrival() {
  fireEvent.change(screen.getByLabelText('Embarcación'), { target: { value: 'TEST_ONLY' } })
  fireEvent.change(screen.getByLabelText('Llegada estimada (hora de Lima)'), { target: { value: '2026-11-21T09:00' } })
}
describe('estados de interfaz y errores (sin red real)', () => {
  it('no permite registrar sin sesión ni con rol distinto', () => {
    const view = show(<ArrivalNotices onSaved={vi.fn()} />, { session: null })
    expect(screen.queryByRole('button', { name: 'Guardar arribo' })).toBeNull()
    view.unmount()
    show(<ArrivalNotices onSaved={vi.fn()} />, { session: { user: { ...session.user, app_metadata: {} } } as Session })
    expect(screen.queryByRole('button', { name: 'Guardar arribo' })).toBeNull()
  })
  it('muestra falta de configuración sin simular consultas', () => {
    show(<PublicQuery refreshVersion={0} />, { client: null })
    expect(screen.getByText('Consulta no disponible: falta configurar Supabase.')).toBeTruthy()
    expect(listPublishedArrivals).not.toHaveBeenCalled()
  })
  it('mantiene el formulario y muestra error si falla el guardado', async () => {
    vi.mocked(saveArrival).mockRejectedValue(new Error('private-server-detail'))
    const onSaved = vi.fn()
    show(<ArrivalNotices onSaved={onSaved} />)
    fillArrival()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar arribo' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText(/Arribo guardado/)).toBeNull()
    expect((screen.getByLabelText('Embarcación') as HTMLInputElement).value).toBe('TEST_ONLY')
    expect(onSaved).not.toHaveBeenCalled()
  })
  it('confirma solo después de recibir la fila persistida', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof saveArrival>>) => void
    vi.mocked(saveArrival).mockImplementation(() => new Promise(done => { resolve = done }))
    const onSaved = vi.fn()
    show(<ArrivalNotices onSaved={onSaved} />)
    fillArrival()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar arribo' }))
    expect(screen.queryByText(/Arribo guardado/)).toBeNull()
    expect((screen.getByRole('button', { name: 'Guardando…' }) as HTMLButtonElement).disabled).toBe(true)
    resolve({ id: 'test-id', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T14:00:00Z', actual_arrival_at: null, status: 'expected', is_published: true })
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Arribo guardado y publicado. Código: test-id')
    expect(onSaved).toHaveBeenCalledOnce()
  })
  it('valida embarcaciones en blanco sin realizar escrituras', async () => {
    show(<ArrivalNotices onSaved={vi.fn()} />)
    fillArrival()
    fireEvent.change(screen.getByLabelText('Embarcación'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar arribo' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(saveArrival).not.toHaveBeenCalled()
  })
  it('distingue error público de resultado vacío y permite reintentar sin login', async () => {
    vi.mocked(listPublishedArrivals).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([])
    show(<PublicQuery refreshVersion={0} />, { session: null })
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.queryByText('No hay avisos publicados.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar avisos' }))
    expect(await screen.findByText('No hay avisos publicados.')).toBeTruthy()
  })
  it('distingue llegada estimada de confirmada', async () => {
    vi.mocked(listPublishedArrivals).mockResolvedValue([{
      id: 'test-id', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T14:00:00Z',
      actual_arrival_at: '2026-11-21T15:00:00Z', status: 'arrived', is_published: true,
    }])
    show(<PublicQuery refreshVersion={0} />, { session: null })
    expect(await screen.findByText('TEST_ONLY')).toBeTruthy()
    expect(screen.getByText(/Llegada estimada:/)).toBeTruthy()
    expect(screen.getByText(/Llegada confirmada:/)).toBeTruthy()
  })
  it('muestra errores de login y limpia la contraseña', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: { message: 'private' } })
    show(<FisherAuth />, { session: null, client: { auth: { signInWithPassword } } as unknown as SupabaseClient })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.invalid' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test-only-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('')
    expect(signInWithPassword).toHaveBeenCalledOnce()
  })
  it('maneja el rechazo de red durante el login', async () => {
    show(<FisherAuth />, { session: null, client: { auth: { signInWithPassword: vi.fn().mockRejectedValue(new Error('network')) } } as unknown as SupabaseClient })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.invalid' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test-only-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
  it('cierra sesión local y muestra el error si no se logra', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: { message: 'private' } })
    show(<FisherAuth />, { client: { auth: { signOut } } as unknown as SupabaseClient })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: 'local' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})