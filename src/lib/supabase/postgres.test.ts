import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// PostgreSQL local en memoria: auth se emula; no conecta con un proyecto Supabase.
const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
let db: PGlite

async function asUser(id: string | null, fisher = true) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({
    sub: id, app_metadata: fisher ? { role: 'fisher' } : {}, user_metadata: { role: 'fisher' },
  })])
  await db.exec(id ? 'set role authenticated' : 'set role anon')
}
async function insertArrival(published = false) {
  const result = await db.query<{ id: string }>(`
    insert into public.arrivals(vessel_name, estimated_arrival_at, is_published)
    values ('TEST_ONLY', '2026-11-21T14:00:00Z', $1) returning id
  `, [published])
  return result.rows[0].id
}
async function insertOffer(id: string, published = false) {
  return db.query<{ id: string }>(`
    insert into public.arrival_offers(arrival_id, species_name, quantity_kg, price_per_kg, is_published)
    values ($1, 'TEST_ONLY', 1, 1, $2) returning id
  `, [id, published])
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as
      $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as
      $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    insert into auth.users values ('${a}'), ('${b}');
  `)
  await db.exec(readFileSync(new URL('../../../supabase/migrations/202611210001_arrivals.sql', import.meta.url), 'utf8'))
}, 30000)

beforeEach(async () => {
  await db.exec('reset role; truncate public.arrivals cascade;')
})
afterAll(async () => { await db?.close() })

describe('migración PostgreSQL y RLS (PGlite, Auth emulado)', () => {
  it('PFCEX-10/PFCEX-11: crea, edita y despublica su oferta con cantidades y precios exactos', async () => {
    await asUser(a)
    const id = await insertArrival(true)
    const offer = (await insertOffer(id, true)).rows[0].id
    const result = await db.query<{ species_name: string; quantity_kg: string; price_per_kg: string; is_published: boolean }>(
      'update arrival_offers set species_name=$1, quantity_kg=$2, price_per_kg=$3, is_published=false where id=$4 returning species_name,quantity_kg,price_per_kg,is_published',
      ['TEST_UPDATED', '12.345', '6.75', offer],
    )
    expect(result.rows[0].species_name).toBe('TEST_UPDATED')
    expect(Number(result.rows[0].quantity_kg)).toBe(12.345)
    expect(Number(result.rows[0].price_per_kg)).toBe(6.75)
    expect(result.rows[0].is_published).toBe(false)
    await asUser(null)
    expect((await db.query('select id from arrival_offers')).rows).toHaveLength(0)
  })
  it('PFCEX-13/PFCEX-14: filtra especie publicada y oculta ofertas al privatizar su arribo', async () => {
    await asUser(a)
    const id = await insertArrival(true)
    await insertOffer(id, true)
    await insertOffer(id, false)
    const sql = `select o.id from arrival_offers o join arrivals a on a.id=o.arrival_id
      where o.is_published and a.is_published and o.species_name ilike $1`
    // These explicit filters also exclude the owner's own drafts.
    expect((await db.query(sql, ['%test_only%'])).rows).toHaveLength(1)
    await asUser(null)
    expect((await db.query(sql, ['%test_only%'])).rows).toHaveLength(1)
    expect((await db.query(sql, ['%NO_MATCH%'])).rows).toHaveLength(0)
    await asUser(a)
    await db.query('update arrivals set is_published=false where id=$1', [id])
    await asUser(null)
    expect((await db.query('select id from arrival_offers')).rows).toHaveLength(0)
  })
  it('PFCEX-10/PFCEX-11: PostgreSQL rechaza cantidades y precios fuera de límites', async () => {
    await asUser(a)
    const id = await insertArrival()
    const offer = (await insertOffer(id)).rows[0].id
    for (const [column, value] of [['quantity_kg', '0'], ['quantity_kg', 'NaN'], ['quantity_kg', '1000000000'], ['price_per_kg', '-1'], ['price_per_kg', '10000000000']]) {
      await expect(db.query(`update arrival_offers set ${column}=$1 where id=$2`, [value, offer])).rejects.toThrow()
    }
  })
  it('permite crear y modificar el propio arribo y mantiene auditoría', async () => {
    await asUser(a)
    const id = await insertArrival()
    const before = await db.query<{ owner_id: string; created_at: Date }>('select owner_id, created_at from arrivals where id=$1', [id])
    expect(before.rows[0].owner_id).toBe(a)
    const result = await db.query('update arrivals set vessel_name=$1 where id=$2 returning id', ['TEST_CHANGED', id])
    expect(result.rows).toHaveLength(1)
    const after = await db.query<{ created_at: Date; updated_at: Date }>('select created_at, updated_at from arrivals where id=$1', [id])
    expect(after.rows[0].created_at).toEqual(before.rows[0].created_at)
    expect(new Date(after.rows[0].updated_at).getTime()).toBeGreaterThanOrEqual(new Date(after.rows[0].created_at).getTime())
  })
  it('no permite crear con dueño ajeno ni cambiar propietario ni auditoría', async () => {
    await asUser(a)
    const id = await insertArrival()
    await expect(db.query('update arrivals set owner_id=$1 where id=$2', [b, id])).rejects.toMatchObject({ code: '42501' })
    await expect(db.query("update arrivals set created_at='2000-01-01' where id=$1", [id])).rejects.toMatchObject({ code: '42501' })
    await expect(db.query("insert into arrivals(owner_id,vessel_name,estimated_arrival_at) values ($1,'TEST_ONLY','2026-11-21')", [b])).rejects.toMatchObject({ code: '42501' })
  })
  it('oculta borradores y no permite modificar arribos ajenos publicados', async () => {
    await asUser(a)
    await insertArrival(false)
    const published = await insertArrival(true)
    await asUser(b)
    expect((await db.query('select id from arrivals')).rows).toHaveLength(1)
    expect((await db.query('update arrivals set vessel_name=$1 where id=$2 returning id', ['TEST_CHANGED', published])).rows).toHaveLength(0)
  })
  it('visitantes leen solo publicados, sin cuenta propietaria y sin escrituras', async () => {
    await asUser(a)
    await insertArrival(false)
    await insertArrival(true)
    await asUser(null)
    expect((await db.query('select id, vessel_name from arrivals')).rows).toHaveLength(1)
    await expect(db.query('select owner_id from arrivals')).rejects.toMatchObject({ code: '42501' })
    await expect(insertArrival(true)).rejects.toMatchObject({ code: '42501' })
    await expect(db.exec("update arrivals set vessel_name='TEST_CHANGED'")).rejects.toMatchObject({ code: '42501' })
  })
  it('no concede escrituras por user_metadata ni a un autenticado sin rol fisher', async () => {
    await asUser(b, false)
    await expect(insertArrival()).rejects.toMatchObject({ code: '42501' })
  })
  it('exige estado coherente, embarcación y fechas válidas en PostgreSQL', async () => {
    await asUser(a)
    const id = await insertArrival()
    for (const [column, value] of [
      ['vessel_name', ' '], ['status', 'unknown'], ['status', 'arrived'],
      ['estimated_arrival_at', '1999-01-01'], ['estimated_arrival_at', 'infinity'],
      ['actual_arrival_at', '2026-11-21T15:00:00Z'],
    ]) {
      await expect(db.query(`update arrivals set ${column}=$1 where id=$2`, [value, id])).rejects.toMatchObject({ code: '23514' })
    }
    expect((await db.query("update arrivals set status='arrived', actual_arrival_at='2020-11-21T15:00:00Z' where id=$1 returning id", [id])).rows).toHaveLength(1)
    await expect(db.query("update arrivals set actual_arrival_at=now()+interval '1 day' where id=$1", [id])).rejects.toMatchObject({ code: '23514' })
  })
  it('solo el dueño del arribo puede crear o modificar ofertas', async () => {
    await asUser(a)
    const id = await insertArrival(true)
    const offer = (await insertOffer(id, true)).rows[0].id
    await asUser(b)
    await expect(insertOffer(id)).rejects.toMatchObject({ code: '42501' })
    expect((await db.query('update arrival_offers set price_per_kg=2 where id=$1 returning id', [offer])).rows).toHaveLength(0)
    const own = await insertArrival()
    await expect(db.query('update arrival_offers set arrival_id=$1 where id=$2', [own, offer])).resolves.toMatchObject({ affectedRows: 0 })
    await asUser(a)
    const other = await insertArrival()
    expect((await db.query('update arrival_offers set price_per_kg=2 where id=$1 returning id', [offer])).rows).toHaveLength(1)
    await expect(db.query('update arrival_offers set arrival_id=$1 where id=$2', [own, offer])).rejects.toMatchObject({ code: '42501' })
    expect((await db.query('update arrival_offers set arrival_id=$1 where id=$2 returning id', [other, offer])).rows).toHaveLength(1)
  })
  it('una oferta solo es pública si ella y su arribo están publicados', async () => {
    await asUser(a)
    const draft = await insertArrival(false)
    const published = await insertArrival(true)
    await insertOffer(draft, true)
    await insertOffer(published, false)
    await insertOffer(published, true)
    await asUser(null)
    expect((await db.query('select id from arrival_offers')).rows).toHaveLength(1)
    await expect(insertOffer(published, true)).rejects.toMatchObject({ code: '42501' })
  })
  it('valida relaciones y valores de ofertas en PostgreSQL', async () => {
    await asUser(a)
    const id = await insertArrival()
    const offer = (await insertOffer(id)).rows[0].id
    for (const [column, value] of [['quantity_kg', '-1'], ['price_per_kg', '0'], ['price_per_kg', 'NaN'], ['currency', 'USD'], ['species_name', ' ']]) {
      await expect(db.query(`update arrival_offers set ${column}=$1 where id=$2`, [value, offer])).rejects.toMatchObject({ code: '23514' })
    }
    await db.exec('reset role')
    await expect(db.query("insert into arrival_offers(arrival_id,species_name,quantity_kg,price_per_kg) values ($1,'TEST_ONLY',1,1)", [b])).rejects.toMatchObject({ code: '23503' })
  })
})
