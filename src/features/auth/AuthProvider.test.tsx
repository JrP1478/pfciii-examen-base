// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'
import { getSupabaseClient } from '../../lib/supabase/client'
import { FisherAuth } from './FisherAuth'

vi.mock('../../lib/supabase/client', () => ({ getSupabaseClient: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks() })
function Probe() {
  const { session, loading, error } = useAuth()
  return <p>{loading ? 'loading' : error || session?.user.id || 'visitor'}</p>
}
describe('recuperación y cambios de sesión', () => {
  it('refleja login y logout exitosos recibidos desde Auth', async () => {
    let notify!: (event: string, session: Session | null) => void
    const session = { user: { id: 'test-fisher', email: 'test@example.invalid', app_metadata: { role: 'fisher' } } } as unknown as Session
    vi.mocked(getSupabaseClient).mockReturnValue({ auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(callback => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } }),
      signInWithPassword: vi.fn(async () => { notify('SIGNED_IN', session); return { data: { session }, error: null } }),
      signOut: vi.fn(async () => { notify('SIGNED_OUT', null); return { error: null } }),
    } } as unknown as SupabaseClient)
    render(<AuthProvider><FisherAuth /></AuthProvider>)
    await screen.findByRole('button', { name: 'Iniciar sesión' })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.invalid' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test-only-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Sesión iniciada: test@example.invalid')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeTruthy()
  })
  it('recupera sesión y escucha logout; cancela la suscripción al desmontar', async () => {
    const session = { user: { id: 'test-fisher' } } as Session
    let notify!: (event: string, session: Session | null) => void
    const unsubscribe = vi.fn()
    vi.mocked(getSupabaseClient).mockReturnValue({ auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      onAuthStateChange: vi.fn(callback => { notify = callback; return { data: { subscription: { unsubscribe } } } }),
    } } as unknown as SupabaseClient)
    const view = render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('test-fisher')).toBeTruthy()
    act(() => notify('SIGNED_OUT', null))
    expect(screen.getByText('visitor')).toBeTruthy()
    view.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })
  it('no sobrescribe un evento reciente con una recuperación antigua', async () => {
    let finish!: (value: { data: { session: Session | null }; error: null }) => void
    let notify!: (event: string, session: Session | null) => void
    vi.mocked(getSupabaseClient).mockReturnValue({ auth: {
      getSession: vi.fn(() => new Promise(resolve => { finish = resolve })),
      onAuthStateChange: vi.fn(callback => { notify = callback; return { data: { subscription: { unsubscribe: vi.fn() } } } }),
    } } as unknown as SupabaseClient)
    render(<AuthProvider><Probe /></AuthProvider>)
    act(() => notify('SIGNED_IN', { user: { id: 'new-session' } } as Session))
    await act(async () => finish({ data: { session: null }, error: null }))
    expect(screen.getByText('new-session')).toBeTruthy()
  })
  it('muestra un error de recuperación sin fingir sesión', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({ auth: {
      getSession: vi.fn().mockRejectedValue(new Error('network')),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    } } as unknown as SupabaseClient)
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('No se pudo recuperar la sesión.')).toBeTruthy()
  })
  it('no oculta el error de recuperación detrás de INITIAL_SESSION', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({ auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: { message: 'network' } }),
      onAuthStateChange: vi.fn(callback => {
        callback('INITIAL_SESSION', null)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    } } as unknown as SupabaseClient)
    render(<AuthProvider><Probe /></AuthProvider>)
    expect(await screen.findByText('No se pudo recuperar la sesión. Intenta iniciar sesión de nuevo.')).toBeTruthy()
  })
})
