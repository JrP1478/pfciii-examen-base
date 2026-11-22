import type { Arrival } from '../arrivals/model'

export type Offer = {
  id: string
  arrival_id: string
  species_name: string
  quantity_kg: number
  price_per_kg: number
  currency: 'PEN'
  is_published: boolean
}
export type OfferInput = Omit<Offer, 'id'>
export type PublicOffer = Offer & { arrivals: Arrival }
export type OfferForm = { species: string; quantity: string; price: string; published: boolean }
export const emptyOfferForm: OfferForm = { species: '', quantity: '', price: '', published: false }

function decimal(value: string, places: number, max: number): number | null {
  const text = value.trim()
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(text)) return null
  const number = Number(text)
  return Number.isFinite(number) && number > 0 && number <= max ? number : null
}

export function validateOffer(form: OfferForm, arrivalId: string):
  { data: OfferInput; error?: never } | { error: string; data?: never } {
  if (!arrivalId) return { error: 'Selecciona uno de tus arribos.' }
  const species = form.species.trim()
  if ([...species].length < 2 || [...species].length > 100 || /[\p{Cc}]/u.test(species)) {
    return { error: 'La especie debe tener entre 2 y 100 caracteres, sin caracteres de control.' }
  }
  const quantity = decimal(form.quantity, 3, 999999999)
  if (quantity === null) return { error: 'La cantidad debe ser mayor que cero, hasta 999999999 kg y con un máximo de 3 decimales.' }
  const price = decimal(form.price, 2, 9999999999)
  if (price === null) return { error: 'El precio debe ser mayor que cero, hasta S/ 9999999999 por kg y con un máximo de 2 decimales.' }
  return { data: { arrival_id: arrivalId, species_name: species, quantity_kg: quantity, price_per_kg: price, currency: 'PEN', is_published: form.published } }
}

export function offerToForm(offer: Offer): OfferForm {
  return { species: offer.species_name, quantity: String(offer.quantity_kg), price: String(offer.price_per_kg), published: offer.is_published }
}
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}
export function formatQuantity(value: number): string {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(value)
}