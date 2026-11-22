import { Icon } from '../../components/Icon'
import { formatArrivalTime } from '../arrivals/model'
import { formatPrice, formatQuantity, type PublicOffer } from '../species-prices/model'

export function OfferCard({ offer }: { offer: PublicOffer }) {
  const arrived = offer.arrivals.status === 'arrived' && offer.arrivals.actual_arrival_at
  return <article className="offer-card">
    <div className="offer-card-top"><span className="fish-symbol"><Icon name="fish" size={28} /></span><span className={`status-tag ${arrived ? 'status-positive' : ''}`}>{arrived ? 'Arribado' : 'En espera'}</span></div>
    <span className="eyebrow">Oferta publicada</span><h4>{offer.species_name}</h4>
    <div className="offer-price"><strong>{formatPrice(offer.price_per_kg)}/kg</strong></div>
    <p className="offer-quantity">{formatQuantity(offer.quantity_kg)} kg disponibles</p>
    <div className="offer-details">
      <p><Icon name="boat" size={17} /><span>Embarcación: {offer.arrivals.vessel_name}</span></p>
      <p><Icon name="clock" size={17} /><span>Llegada estimada: {formatArrivalTime(offer.arrivals.estimated_arrival_at)}</span></p>
      <p>{arrived ? `Llegada confirmada: ${formatArrivalTime(offer.arrivals.actual_arrival_at!)}` : 'Llegada aún no confirmada.'}</p>
    </div>
    {offer.updated_at && <p className="card-updated">Oferta actualizada: <time dateTime={offer.updated_at}>{formatArrivalTime(offer.updated_at)}</time></p>}
  </article>
}