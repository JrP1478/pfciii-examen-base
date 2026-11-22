begin;
create table public.arrivals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  vessel_name text not null check (vessel_name = btrim(vessel_name) and char_length(vessel_name) between 2 and 100 and vessel_name !~ '[[:cntrl:]]'),
  estimated_arrival_at timestamptz not null check (estimated_arrival_at >= '2000-01-01T00:00:00Z' and estimated_arrival_at < '2101-01-01T00:00:00Z'),
  status text not null default 'expected' check (status in ('expected', 'arrived')),
  actual_arrival_at timestamptz check (actual_arrival_at >= '2000-01-01T00:00:00Z' and actual_arrival_at < '2101-01-01T00:00:00Z' and actual_arrival_at <= now()),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint arrival_confirmation check (
    (status = 'expected' and actual_arrival_at is null)
    or (status = 'arrived' and actual_arrival_at is not null)
  )
);
create table public.arrival_offers (
  id uuid primary key default gen_random_uuid(),
  arrival_id uuid not null references public.arrivals(id) on delete cascade,
  species_name text not null check (species_name = btrim(species_name) and char_length(species_name) between 2 and 100 and species_name !~ '[[:cntrl:]]'),
  quantity_kg numeric(12,3) not null check (quantity_kg > 0 and quantity_kg <= 999999999),
  price_per_kg numeric(12,2) not null check (price_per_kg > 0 and price_per_kg <= 9999999999),
  currency text not null default 'PEN' check (currency = 'PEN'),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index arrivals_owner_idx on public.arrivals(owner_id);
create index arrivals_public_eta_idx on public.arrivals(estimated_arrival_at, id) where is_published;
create index arrival_offers_arrival_idx on public.arrival_offers(arrival_id);

create function public.set_arrival_audit_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then NEW.created_at := now();
  else NEW.created_at := OLD.created_at;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
create trigger arrivals_audit before insert or update on public.arrivals
  for each row execute function public.set_arrival_audit_timestamps();
create trigger arrival_offers_audit before insert or update on public.arrival_offers
  for each row execute function public.set_arrival_audit_timestamps();
alter table public.arrivals enable row level security;
alter table public.arrivals force row level security;
alter table public.arrival_offers enable row level security;
alter table public.arrival_offers force row level security;

-- Assign fisher through administrator-controlled app_metadata, never user_metadata.
create policy arrivals_public_read on public.arrivals for select to anon, authenticated
  using (is_published);
create policy arrivals_owner_read on public.arrivals for select to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt()->'app_metadata'->>'role') = 'fisher');
create policy arrivals_owner_insert on public.arrivals for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select auth.jwt()->'app_metadata'->>'role') = 'fisher');
create policy arrivals_owner_update on public.arrivals for update to authenticated
  using (owner_id = (select auth.uid()) and (select auth.jwt()->'app_metadata'->>'role') = 'fisher')
  with check (owner_id = (select auth.uid()) and (select auth.jwt()->'app_metadata'->>'role') = 'fisher');

create policy offers_public_read on public.arrival_offers for select to anon, authenticated
  using (is_published and exists (
    select 1 from public.arrivals a where a.id = arrival_id and a.is_published
  ));
create policy offers_owner_read on public.arrival_offers for select to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'fisher' and exists (
    select 1 from public.arrivals a where a.id = arrival_id and a.owner_id = (select auth.uid())
  ));
create policy offers_owner_insert on public.arrival_offers for insert to authenticated
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'fisher' and exists (
    select 1 from public.arrivals a where a.id = arrival_id and a.owner_id = (select auth.uid())
  ));
create policy offers_owner_update on public.arrival_offers for update to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'fisher' and exists (
    select 1 from public.arrivals a where a.id = arrival_id and a.owner_id = (select auth.uid())
  ))
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'fisher' and exists (
    select 1 from public.arrivals a where a.id = arrival_id and a.owner_id = (select auth.uid())
  ));

revoke all on public.arrivals, public.arrival_offers from public, anon, authenticated;
grant select on public.arrivals to authenticated;
-- Do not expose the fisher's account UUID through the anonymous API.
grant select (id, vessel_name, estimated_arrival_at, status, actual_arrival_at, is_published, created_at, updated_at)
  on public.arrivals to anon;
grant insert (vessel_name, estimated_arrival_at, status, actual_arrival_at, is_published),
      update (vessel_name, estimated_arrival_at, status, actual_arrival_at, is_published)
  on public.arrivals to authenticated;
grant select on public.arrival_offers to anon, authenticated;
grant insert (arrival_id, species_name, quantity_kg, price_per_kg, currency, is_published),
      update (arrival_id, species_name, quantity_kg, price_per_kg, currency, is_published)
  on public.arrival_offers to authenticated;
revoke all on function public.set_arrival_audit_timestamps() from public, anon, authenticated;
commit;
