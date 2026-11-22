import { useEffect, useState, type ReactNode } from 'react'
import { getSupabaseClient } from '../../lib/supabase/client'
import { AuthContext, type AuthState } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState(getSupabaseClient)
  const [state, setState] = useState<Omit<AuthState, 'client'>>({ session: null, loading: !!client, error: '' })

  useEffect(() => {
    if (!client) return
    let active = true
    let authEventReceived = false
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') authEventReceived = true
      if (active) setState({ session, loading: false, error: '' })
    })
    client.auth.getSession().then(({ data, error }) => {
      if (active && !authEventReceived) setState({ session: error ? null : data.session, loading: false,
        error: error ? 'No se pudo recuperar la sesión. Intenta iniciar sesión de nuevo.' : '' })
    }).catch(() => {
      if (active && !authEventReceived) setState({ session: null, loading: false, error: 'No se pudo recuperar la sesión.' })
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [client])

  return <AuthContext.Provider value={{ ...state, client }}>{children}</AuthContext.Provider>
}
