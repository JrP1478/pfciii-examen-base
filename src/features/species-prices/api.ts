import type { SupabaseClient } from '@supabase/supabase-js'
import type { Arrival } from '../arrivals/model'
import type { Offer, OfferInput, PublicOffer } from './model'

const offerColumns = 'id,arrival_id,species_name,quantity_kg,price_per_kg,currency,is_published'
const arrivalColumns = 'id,vessel_name,estimated_arrival_at,status,actual_arrival_at,is_published'

export async function listOwnArrivals(client: SupabaseClient, ownerId: string, signal?: AbortSignal): Promise<Arrival[]> {
  let query = client.from('arrivals').select(arrivalColumns).eq('owner_id', ownerId)
    .order('created_at', { ascending: false }).order('id').limit(100)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  if (error || !data) throw new Error('No se pudieron cargar tus arribos.')
  return data as Arrival[]
}

export async function listOwnOffers(client: SupabaseClient, ownerId: string, arrivalId: string, signal?: AbortSignal): Promise<Offer[]> {
  let query = client.from('arrival_offers').select(`${offerColumns},arrivals!inner(owner_id)`)
    .eq('arrival_id', arrivalId).eq('arrivals.owner_id', ownerId)
    .order('created_at', { ascending: false }).order('id').limit(100)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  if (error || !data) throw new Error('No se pudieron cargar tus ofertas.')
  return data as unknown as Offer[]
}

export async function saveOffer(client: SupabaseClient, input: OfferInput, offerId?: string): Promise<Offer> {
  // Updating never reassigns the offer to a different arrival. RLS is authoritative.
  const { arrival_id, ...fields } = input
  const query = offerId
    ? client.from('arrival_offers').update(fields).eq('id', offerId).eq('arrival_id', arrival_id)
    : client.from('arrival_offers').insert(input)
  const { data, error } = await query.select(offerColumns).single()
  if (error || !data) throw new Error('No se pudo confirmar el guardado de la oferta. Revisa tu sesión y permisos.')
  return data as Offer
}

export async function listPublishedOffers(client: SupabaseClient, species = '', signal?: AbortSignal): Promise<PublicOffer[]> {
  let query = client.from('arrival_offers').select(`${offerColumns},arrivals!inner(${arrivalColumns})`)
    .eq('is_published', true).eq('arrivals.is_published', true)
    .order('created_at', { ascending: false }).order('id').limit(100)
  const term = species.trim()
  // Escape LIKE wildcards so user input is a literal substring, not a pattern.
  if (term) query = query.ilike('species_name', `%${term.replace(/[\\%_]/g, '\\$&')}%`)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  if (error || !data) throw new Error('No se pudieron consultar las ofertas.')
  return data as unknown as PublicOffer[]
}