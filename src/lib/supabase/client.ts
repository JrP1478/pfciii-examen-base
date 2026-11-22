import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

export const supabaseConfig = readSupabaseConfig(import.meta.env)
let client: SupabaseClient | undefined

// El proveedor Auth solicita este cliente; las variables solo validan formato.
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfig.configured) return null
  client ??= createClient(supabaseConfig.config.url, supabaseConfig.config.publishableKey)
  return client
}
