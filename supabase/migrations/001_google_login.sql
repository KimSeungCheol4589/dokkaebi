-- 001: 구글 로그인 지원 (2026-10-24)
-- 이미 schema.sql 을 실행한 Supabase 프로젝트에 한 번 실행합니다. (새로 만드는 프로젝트는 schema.sql 만 실행하면 됨)
--   * 구글 이름·이메일로 임시 닉네임을 만들고, 겹치면 숫자를 붙여 가입이 실패하지 않게 함
--   * 첫 로그인 때 게임 닉네임을 정했는지 표시하는 nickname_confirmed 추가

alter table public.profiles add column if not exists nickname_confirmed boolean not null default false;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_first boolean;
  v_base  text;
  v_nick  text;
  v_n     int := 0;
begin
  perform pg_advisory_xact_lock(4589);
  select not exists (select 1 from profiles) into v_first;
  v_base := left(coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    '문파원'), 16);
  v_nick := v_base;
  while exists (select 1 from profiles where nickname = v_nick) loop
    v_n := v_n + 1;
    v_nick := v_base || v_n;
  end loop;
  insert into profiles (id, nickname, role, approved)
  values (new.id, v_nick, case when v_first then 'master' else 'member' end, v_first);
  return new;
end $$;

create or replace view public.member_overview with (security_invoker = on) as
select
  p.id,
  p.nickname,
  p.combat_power,
  p.role,
  p.approved,
  p.joined_at,
  power_score(p.combat_power) as power_score,
  coalesce((select sum(l.delta) from point_ledger l
             where l.member_id = p.id and l.kind <> 'warehouse'), 0)::bigint as activity_score,
  (power_score(p.combat_power)
    + coalesce((select sum(l.delta) from point_ledger l where l.member_id = p.id), 0))::bigint as points,
  (p.combat_power - coalesce(
    (select h.combat_power from power_history h
      where h.member_id = p.id and h.recorded_at <= now() - interval '7 days'
      order by h.recorded_at desc limit 1),
    (select h.combat_power from power_history h
      where h.member_id = p.id
      order by h.recorded_at asc limit 1),
    p.combat_power))::bigint as growth_7d,
  p.nickname_confirmed
from profiles p;

grant select on public.member_overview to anon, authenticated;
