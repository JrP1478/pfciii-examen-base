import { Icon } from '../../components/Icon'
import { formatArrivalTime } from '../arrivals/model'
import { formatPrice, formatQuantity, isOfferExhausted, type PublicOffer } from '../species-prices/model'
import { ArrivalUpdatedAt } from './ArrivalUpdatedAt'

export function OfferCard({ offer }: { offer: PublicOffer }) {
  const arrived = offer.arrivals.status === 'arrived' && offer.arrivals.actual_arrival_at
  const exhausted = isOfferExhausted(offer)
  return <article className="offer-card">
    <div className="offer-card-top"><span className="fish-symbol"><Icon name="fish" size={28} /></span><div className="offer-card-status"><span className={`status-tag ${arrived ? 'status-positive' : ''}`}>{arrived ? 'Arribado' : 'En espera'}</span>{exhausted && <span className="status-tag status-exhausted">Agotada</span>}</div></div>
    <span className="eyebrow">{exhausted ? 'Último precio publicado · Sin stock' : 'Oferta publicada'}</span><h4>{offer.species_name}</h4>
    <div className="offer-price"><strong>{formatPrice(offer.price_per_kg)}/kg</strong></div>
    <p className="offer-quantity">{exhausted ? 'Sin stock disponible' : `${formatQuantity(offer.quantity_kg)} kg disponibles`}</p>
    <div className="offer-details">
      <p><Icon name="boat" size={17} /><span>Embarcación: {offer.arrivals.vessel_name}</span></p>
      <p><Icon name="clock" size={17} /><span>Llegada estimada: {formatArrivalTime(offer.arrivals.estimated_arrival_at)}</span></p>
      <p>{arrived ? `Llegada confirmada: ${formatArrivalTime(offer.arrivals.actual_arrival_at!)}` : 'Llegada aún no confirmada.'}</p>
    </div>
    <ArrivalUpdatedAt value={offer.arrivals.updated_at} />
    {offer.updated_at && <p className="card-updated">Oferta actualizada: <time dateTime={offer.updated_at}>{formatArrivalTime(offer.updated_at)}</time></p>}
  </article>
}
