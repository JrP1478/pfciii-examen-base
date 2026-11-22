import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

export const supabaseConfig = readSupabaseConfig(import.meta.env)
let client: SupabaseClient | undefined

// Cargar la interfaz no inicia solicitudes de autenticación.
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfig.configured) return null
  client ??= createClient(supabaseConfig.config.url, supabaseConfig.config.publishableKey)
  return client
}
