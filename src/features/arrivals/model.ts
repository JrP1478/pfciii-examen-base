export type ArrivalStatus = 'expected' | 'arrived'
export type Arrival = {
  id: string
  vessel_name: string
  estimated_arrival_at: string
  status: ArrivalStatus
  actual_arrival_at: string | null
  is_published: boolean
}
export type ArrivalForm = {
  vesselName: string
  estimatedAt: string
  status: ArrivalStatus
  actualAt: string
  published: boolean
}
export type ArrivalInput = Omit<Arrival, 'id'>

// Hora de Lima (UTC-05:00), independiente de la configuración del dispositivo.
function parseLimaDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00-05:00`)
  if (!Number.isFinite(date.getTime())) return null
  const roundTrip = new Date(date.getTime() - 5 * 3600_000).toISOString().slice(0, 16)
  if (roundTrip !== value || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) return null
  return date.toISOString()
}

export function validateArrival(form: ArrivalForm): { data: ArrivalInput; error?: never } | { error: string; data?: never } {
  const vessel = form.vesselName.trim()
  if (vessel.length < 2 || vessel.length > 100 || /[\p{Cc}]/u.test(vessel)) {
    return { error: 'La embarcación debe tener entre 2 y 100 caracteres, sin caracteres de control.' }
  }
  const estimated = parseLimaDate(form.estimatedAt)
  if (!estimated) return { error: 'Indica una llegada estimada válida entre los años 2000 y 2100.' }
  if (!['expected', 'arrived'].includes(form.status)) return { error: 'Selecciona un estado válido.' }
  const actual = form.status === 'arrived' ? parseLimaDate(form.actualAt) : null
  if (form.status === 'arrived' && !actual) return { error: 'Indica la fecha y hora de llegada confirmada.' }
  if (actual && Date.parse(actual) > Date.now()) return { error: 'La llegada confirmada no puede estar en el futuro.' }
  return { data: { vessel_name: vessel, estimated_arrival_at: estimated, status: form.status, actual_arrival_at: actual, is_published: form.published } }
}

export function formatArrivalTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(value))
}
