import { createContext, useContext } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

export type AuthState = {
  client: SupabaseClient | null
  session: Session | null
  loading: boolean
  error: string
}
export const AuthContext = createContext<AuthState>({ client: null, session: null, loading: false, error: '' })
export function useAuth() { return useContext(AuthContext) }
export function isFisher(session: Session | null): boolean {
  return session?.user.app_metadata.role === 'fisher'
}