// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { PublicOffer } from '../species-prices/model'
import { OfferCard } from './OfferCard'

const offer: PublicOffer = { id: 'test-offer', arrival_id: 'test-arrival', species_name: 'TEST_ONLY', quantity_kg: 0,
  price_per_kg: 2, currency: 'PEN', is_published: true, updated_at: '2026-11-21T15:00:00Z',
  arrivals: { id: 'test-arrival', vessel_name: 'TEST_ONLY', estimated_arrival_at: '2026-11-21T16:00:00Z',
    status: 'expected', actual_arrival_at: null, is_published: true, updated_at: '2026-11-21T13:30:45Z' } }
afterEach(cleanup)
describe('PFCEX-12/PFCEX-15: presentación pública de stock y auditoría', () => {
  it('especie agotada nunca anuncia kilogramos disponibles', () => {
    render(<OfferCard offer={offer} />)
    expect(screen.getByText('Agotada')).toBeTruthy()
    expect(screen.getByText('Sin stock disponible')).toBeTruthy()
    expect(screen.getByText('Último precio publicado · Sin stock')).toBeTruthy()
    expect(screen.queryByText(/kg disponibles/)).toBeNull()
  })
  it('una reposición vuelve a mostrarse disponible sin conservar la etiqueta agotada', () => {
    const view = render(<OfferCard offer={offer} />)
    view.rerender(<OfferCard offer={{ ...offer, quantity_kg: 3 }} />)
    expect(screen.getByText('3 kg disponibles')).toBeTruthy()
    expect(screen.queryByText('Agotada')).toBeNull()
  })
  it('distingue la actualización del arribo de la actualización de la oferta', () => {
    render(<OfferCard offer={offer} />)
    expect(screen.getByText(/^Arribo actualizado:/).querySelector('time')?.dateTime).toBe(offer.arrivals.updated_at)
    expect(screen.getByText(/^Oferta actualizada:/).querySelector('time')?.dateTime).toBe(offer.updated_at)
    expect(screen.getByText(/^Arribo actualizado:/).textContent).toContain('08:30:45')
  })
  it('no sustituye un timestamp de arribo ausente por la hora de consulta', () => {
    render(<OfferCard offer={{ ...offer, arrivals: { ...offer.arrivals, updated_at: undefined } }} />)
    expect(screen.getByText('Fecha de actualización del arribo no disponible.')).toBeTruthy()
    expect(screen.queryByText(/^Arribo actualizado:/)).toBeNull()
  })
})