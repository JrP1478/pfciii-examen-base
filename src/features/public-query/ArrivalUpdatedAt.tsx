import { formatRecordUpdateTime } from '../arrivals/model'

export function ArrivalUpdatedAt({ value }: { value?: string }) {
  const formatted = formatRecordUpdateTime(value)
  return <p className="card-updated">{formatted
    ? <>Arribo actualizado: <time dateTime={value}>{formatted}</time> (Lima)</>
    : 'Fecha de actualización del arribo no disponible.'}</p>
}
