begin;

-- PFCEX-12: zero is an exhausted offer; publication remains independent.
-- Keep the existing column, upper bound, NOT NULL, grants, triggers and RLS.
alter table public.arrival_offers
  drop constraint arrival_offers_quantity_kg_check;
alter table public.arrival_offers
  add constraint arrival_offers_quantity_kg_check
  check (quantity_kg >= 0 and quantity_kg <= 999999999);

comment on column public.arrival_offers.quantity_kg is
  'Available kilograms. Zero means exhausted; is_published independently controls visibility.';

commit;
