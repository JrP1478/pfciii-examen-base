import { describe, expect, it } from 'vitest'
import { isOfferExhausted, offerToForm, validateOffer, type OfferForm } from './model'

const form: OfferForm = { species: 'TEST_ONLY', quantity: '1.125', price: '2.50', published: true }
describe('PFCEX-10/PFCEX-11: validación de ofertas', () => {
  it('normaliza especie, kg, soles y publicación', () => {
    expect(validateOffer({ ...form, species: ' TEST_ONLY ' }, 'own-arrival').data).toEqual({
      arrival_id: 'own-arrival', species_name: 'TEST_ONLY', quantity_kg: 1.125, price_per_kg: 2.5, currency: 'PEN', is_published: true,
    })
  })
  it('requiere un arribo seleccionado', () => { expect(validateOffer(form, '').error).toBeTruthy() })
  it.each(['', ' ', 'A', 'A'.repeat(101), 'AB\nCD'])('rechaza especie inválida %j', species => {
    expect(validateOffer({ ...form, species }, 'own').error).toContain('especie')
  })
  it.each(['', '-1', 'NaN', 'Infinity', '1e3', '0.0001', '1.2345', '1000000000', '1,5'])('rechaza cantidad %s', quantity => {
    expect(validateOffer({ ...form, quantity }, 'own').error).toContain('cantidad')
  })
  it.each(['', '0', '-1', 'NaN', 'Infinity', '0.001', '1.234', '10000000000'])('rechaza precio %s', price => {
    expect(validateOffer({ ...form, price }, 'own').error).toContain('precio')
  })
  it('permite cantidades y precios mínimos y ofertas privadas', () => {
    expect(validateOffer({ ...form, quantity: '0.001', price: '0.01', published: false }, 'own').data).toMatchObject({
      quantity_kg: 0.001, price_per_kg: 0.01, is_published: false,
    })
  })
  it('acepta los límites superiores existentes en PostgreSQL', () => {
    expect(validateOffer({ ...form, quantity: '999999999', price: '9999999999' }, 'own').data).toBeTruthy()
  })
  it('PFCEX-12: cero representa agotamiento y no cambia la publicación', () => {
    for (const published of [true, false]) {
      const result = validateOffer({ ...form, quantity: '0.000', published }, 'own')
      expect(result.data).toMatchObject({ quantity_kg: 0, is_published: published })
      expect(isOfferExhausted(result.data!)).toBe(true)
      expect(offerToForm({ ...result.data!, id: 'offer' }).quantity).toBe('0')
    }
    expect(isOfferExhausted({ quantity_kg: 0.001 })).toBe(false)
  })
})
