import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { expect, it } from 'vitest'

it('PFCEX-12: migración incremental permite cero, conserva datos, RLS y permisos', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
      insert into auth.users values ('00000000-0000-4000-8000-000000000001');
    `)
    await db.exec(readFileSync(new URL('../../../supabase/migrations/202611210001_arrivals.sql', import.meta.url), 'utf8'))
    const arrival = await db.query<{ id: string }>(`insert into arrivals(owner_id,vessel_name,estimated_arrival_at)
      values ('00000000-0000-4000-8000-000000000001','TEST_ONLY','2026-11-21') returning id`)
    const offer = await db.query<{ id: string }>(`insert into arrival_offers(arrival_id,species_name,quantity_kg,price_per_kg)
      values ($1,'TEST_ONLY',1.125,2.5) returning id`, [arrival.rows[0].id])
    const id = offer.rows[0].id
    await expect(db.query('update arrival_offers set quantity_kg=0 where id=$1', [id])).rejects.toMatchObject({ code: '23514' })
    await db.exec(readFileSync(new URL('../../../supabase/migrations/202611210002_offer_zero_stock.sql', import.meta.url), 'utf8'))
    const preserved = await db.query<{ quantity_kg: string; price_per_kg: string }>('select quantity_kg,price_per_kg from arrival_offers where id=$1', [id])
    expect(Number(preserved.rows[0].quantity_kg)).toBe(1.125)
    expect(Number(preserved.rows[0].price_per_kg)).toBe(2.5)
    await db.query('update arrival_offers set quantity_kg=0 where id=$1', [id])
    expect(Number((await db.query<{ quantity_kg: string }>('select quantity_kg from arrival_offers where id=$1', [id])).rows[0].quantity_kg)).toBe(0)
    await expect(db.query('update arrival_offers set quantity_kg=-1 where id=$1', [id])).rejects.toMatchObject({ code: '23514' })
    await expect(db.query('update arrival_offers set quantity_kg=null where id=$1', [id])).rejects.toMatchObject({ code: '23502' })
    const security = await db.query<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>(`
      select relrowsecurity,relforcerowsecurity from pg_class where oid='public.arrival_offers'::regclass`)
    expect(security.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true })
    expect((await db.query("select policyname from pg_policies where schemaname='public' and tablename='arrival_offers'")).rows).toHaveLength(4)
    const grants = await db.query<{ anonymous_insert: boolean }>("select has_table_privilege('anon','public.arrival_offers','INSERT') as anonymous_insert")
    expect(grants.rows[0].anonymous_insert).toBe(false)
  } finally { await db.close() }
}, 30000)