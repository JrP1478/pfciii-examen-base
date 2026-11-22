import type { SupabaseClient } from '@supabase/supabase-js'
import type { Arrival, ArrivalInput } from './model'

const publicColumns = 'id,vessel_name,estimated_arrival_at,status,actual_arrival_at,is_published'

export async function saveArrival(client: SupabaseClient, input: ArrivalInput): Promise<Arrival> {
  const { data, error } = await client.from('arrivals').insert(input).select(publicColumns).single()
  if (error || !data) throw new Error('No se pudo confirmar el guardado. Revisa tu sesión y permisos antes de reintentar.')
  return data as Arrival
}

export async function listPublishedArrivals(client: SupabaseClient, signal?: AbortSignal): Promise<Arrival[]> {
  let query = client.from('arrivals').select(publicColumns)
    .eq('is_published', true).order('estimated_arrival_at', { ascending: true }).order('id').limit(50)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  if (error || !data) throw new Error('No se pudieron consultar los avisos. Revisa la conexión y la configuración del servicio.')
  return data as Arrival[]
}
