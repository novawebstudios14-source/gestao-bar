-- Estado operacional. A demonstração é calculada no navegador e não é gravada aqui.
create table if not exists public.bar_state (
  id integer primary key default 1 check (id = 1),
  version bigint not null default 0,
  payload jsonb not null default '{"products":[],"tables":[],"sessions":[],"sessionSales":[],"movements":[]}'::jsonb,
  constraint valid_payload check (
    jsonb_typeof(payload->'products') = 'array' and
    jsonb_typeof(payload->'tables') = 'array' and
    jsonb_typeof(payload->'sessions') = 'array' and
    jsonb_typeof(payload->'sessionSales') = 'array' and
    jsonb_typeof(payload->'movements') = 'array'
  )
);
insert into public.bar_state(id) values (1) on conflict (id) do nothing;
alter table public.bar_state enable row level security;
grant select, update on public.bar_state to anon;
create policy "Leitura pública do bar" on public.bar_state for select to anon using (id = 1);
create policy "Atualização pública do bar" on public.bar_state for update to anon using (id = 1) with check (id = 1);
