export type SupabaseConfigResult =
  | { configured: true; config: { url: string; publishableKey: string } }
  | { configured: false; message: string }

export function readSupabaseConfig(env: Record<string, unknown>): SupabaseConfigResult {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : ''
  const key = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
    ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : ''
  if (!url || !key) {
    return { configured: false, message: 'Falta configurar las variables públicas de Supabase.' }
  }
  try {
    if (new URL(url).protocol !== 'https:') throw new Error('HTTPS required')
  } catch {
    return { configured: false, message: 'La URL de Supabase debe ser una dirección HTTPS válida.' }
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    return { configured: false, message: 'Utiliza una clave pública publishable de Supabase.' }
  }
  return { configured: true, config: { url, publishableKey: key } }
}
