-- =====================================================================
-- 도깨비의세계 문파 홈페이지 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여 넣고 한 번 실행하세요.
--
-- 규칙 요약
--   * 가장 먼저 가입한 사람이 자동으로 '문주(master)' + 승인 상태가 됩니다.
--   * 이후 가입자는 운영진(문주·부문주)이 승인해야 문파원이 됩니다.
--   * 기여/성장 포인트는 운영진이 지급하고, 창고 아이템은 포인트로 신청합니다.
--   * 신청은 운영진이 승인할 때 재고와 포인트가 차감됩니다.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------

create table public.guild (
  id          int primary key default 1 check (id = 1),
  name        text    not null default '우리 문파',
  level       int     not null default 1 check (level >= 1),
  exp         bigint  not null default 0 check (exp >= 0),
  exp_next    bigint  not null default 1000 check (exp_next > 0),
  motto       text    not null default '',
  notice      text    not null default '',
  recruiting  boolean not null default true,
  updated_at  timestamptz not null default now()
);
insert into public.guild (id) values (1);

create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  nickname      text   not null unique check (char_length(nickname) between 1 and 20),
  combat_power  bigint not null default 0 check (combat_power >= 0),
  role          text   not null default 'member' check (role in ('master', 'officer', 'member')),
  approved      boolean not null default false,
  joined_at     timestamptz not null default now()
);

-- 전투력이 바뀔 때마다 기록해서 '성장'(최근 7일 증가량)을 계산합니다.
create table public.power_history (
  id            bigint generated always as identity primary key,
  member_id     uuid   not null references public.profiles on delete cascade,
  combat_power  bigint not null,
  recorded_at   timestamptz not null default now()
);
create index power_history_member_idx on public.power_history (member_id, recorded_at);

-- 포인트 원장: 잔액 = delta 의 합계
create table public.point_ledger (
  id          bigint generated always as identity primary key,
  member_id   uuid not null references public.profiles on delete cascade,
  delta       int  not null check (delta <> 0),
  kind        text not null check (kind in ('contribution', 'growth', 'warehouse', 'adjust')),
  reason      text not null default '',
  created_by  uuid references public.profiles default auth.uid(),
  created_at  timestamptz not null default now()
);
create index point_ledger_member_idx on public.point_ledger (member_id);

create table public.warehouse_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default '기타',
  icon         text not null default '📦',
  description  text not null default '',
  stock        int  not null default 0 check (stock >= 0),
  cost         int  not null default 0 check (cost >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.warehouse_requests (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles on delete cascade,
  item_id     uuid not null references public.warehouse_items on delete cascade,
  quantity    int  not null check (quantity > 0),
  total_cost  int  not null check (total_cost >= 0),
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  note        text not null default '',
  decided_by  uuid references public.profiles,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index warehouse_requests_member_idx on public.warehouse_requests (member_id, status);

-- ---------------------------------------------------------------------
-- 권한 헬퍼
-- ---------------------------------------------------------------------

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved);
$$;

create or replace function public.is_officer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles
                 where id = auth.uid() and approved and role in ('master', 'officer'));
$$;

create or replace function public.is_master() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved and role = 'master');
$$;

-- ---------------------------------------------------------------------
-- 트리거
-- ---------------------------------------------------------------------

-- 회원가입 시 프로필 생성 (첫 가입자는 문주)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_first boolean;
begin
  perform pg_advisory_xact_lock(4589);
  select not exists (select 1 from profiles) into v_first;
  insert into profiles (id, nickname, role, approved)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1)),
    case when v_first then 'master' else 'member' end,
    v_first
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 전투력 변경 기록
create or replace function public.record_power() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.combat_power is distinct from old.combat_power then
    insert into power_history (member_id, combat_power) values (new.id, new.combat_power);
  end if;
  return new;
end $$;

create trigger profiles_record_power
  after insert or update of combat_power on public.profiles
  for each row execute function public.record_power();

-- 역할/승인 변경 보호 (SQL Editor 처럼 로그인 사용자가 없는 경우는 통과)
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if old.role = 'master' and old.id <> auth.uid() and not is_master() then
    raise exception '문주 정보는 문주만 바꿀 수 있습니다';
  end if;
  if new.role is distinct from old.role and not is_master() then
    raise exception '직책 변경은 문주만 할 수 있습니다';
  end if;
  if new.approved is distinct from old.approved and not is_officer() then
    raise exception '가입 승인은 운영진만 할 수 있습니다';
  end if;
  if old.role = 'master' and (new.role <> 'master' or not new.approved)
     and not exists (select 1 from profiles where role = 'master' and approved and id <> old.id) then
    raise exception '문주가 최소 한 명은 있어야 합니다. 다른 사람을 먼저 문주로 지정하세요';
  end if;
  return new;
end $$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile();

create or replace function public.touch_guild() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger guild_touch
  before update on public.guild
  for each row execute function public.touch_guild();

-- ---------------------------------------------------------------------
-- 문파원 요약 뷰 (포인트 잔액, 7일 성장)
--   security_invoker: 보는 사람 권한으로 계산되므로 비로그인 방문자에게는 포인트가 0 으로 보입니다.
-- ---------------------------------------------------------------------

create view public.member_overview with (security_invoker = on) as
select
  p.id,
  p.nickname,
  p.combat_power,
  p.role,
  p.approved,
  p.joined_at,
  coalesce((select sum(l.delta) from point_ledger l where l.member_id = p.id), 0)::bigint as points,
  (p.combat_power - coalesce(
    (select h.combat_power from power_history h
      where h.member_id = p.id and h.recorded_at <= now() - interval '7 days'
      order by h.recorded_at desc limit 1),
    (select h.combat_power from power_history h
      where h.member_id = p.id
      order by h.recorded_at asc limit 1),
    p.combat_power))::bigint as growth_7d
from profiles p;

grant select on public.member_overview to anon, authenticated;

-- ---------------------------------------------------------------------
-- 행 수준 보안 (RLS)
-- ---------------------------------------------------------------------

alter table public.guild              enable row level security;
alter table public.profiles           enable row level security;
alter table public.power_history      enable row level security;
alter table public.point_ledger       enable row level security;
alter table public.warehouse_items    enable row level security;
alter table public.warehouse_requests enable row level security;

-- 문파 정보: 누구나 읽기, 운영진 수정
create policy guild_read   on public.guild for select to anon, authenticated using (true);
create policy guild_update on public.guild for update to authenticated
  using (is_officer()) with check (is_officer());

-- 프로필: 비로그인은 승인된 문파원만, 로그인 사용자는 전체 / 본인 또는 운영진 수정
create policy profiles_read_public on public.profiles for select to anon using (approved);
create policy profiles_read_auth   on public.profiles for select to authenticated using (true);
create policy profiles_update      on public.profiles for update to authenticated
  using (id = auth.uid() or is_officer()) with check (id = auth.uid() or is_officer());

-- 전투력 기록: 누구나 읽기 (쓰기는 트리거만)
create policy power_history_read on public.power_history for select to anon, authenticated using (true);

-- 포인트: 문파원은 읽기, 운영진은 지급/차감 (창고 차감은 RPC 전용)
create policy ledger_read   on public.point_ledger for select to authenticated using (is_member());
create policy ledger_insert on public.point_ledger for insert to authenticated
  with check (is_officer() and kind in ('contribution', 'growth', 'adjust'));

-- 창고 아이템: 문파원 읽기, 운영진 관리
create policy items_read   on public.warehouse_items for select to authenticated using (is_member());
create policy items_insert on public.warehouse_items for insert to authenticated with check (is_officer());
create policy items_update on public.warehouse_items for update to authenticated
  using (is_officer()) with check (is_officer());

-- 창고 신청: 본인 또는 운영진 읽기 (생성/처리는 RPC 전용)
create policy requests_read on public.warehouse_requests for select to authenticated
  using (member_id = auth.uid() or is_officer());

-- ---------------------------------------------------------------------
-- 창고 RPC
-- ---------------------------------------------------------------------

-- 아이템 신청: 사용 가능 포인트(잔액 - 대기 중 신청 합계)로 검사
create or replace function public.request_item(p_item uuid, p_qty int, p_note text default '')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_item    warehouse_items;
  v_balance bigint;
  v_pending bigint;
  v_id      uuid;
begin
  if not is_member() then
    raise exception '승인된 문파원만 신청할 수 있습니다';
  end if;
  if p_qty is null or p_qty < 1 then
    raise exception '수량을 확인해 주세요';
  end if;

  select * into v_item from warehouse_items where id = p_item and active;
  if not found then
    raise exception '창고에 없는 아이템입니다';
  end if;
  if v_item.stock < p_qty then
    raise exception '창고 재고가 부족합니다';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  select coalesce(sum(delta), 0) into v_balance from point_ledger where member_id = auth.uid();
  select coalesce(sum(total_cost), 0) into v_pending
    from warehouse_requests where member_id = auth.uid() and status = 'pending';
  if v_balance - v_pending < v_item.cost * p_qty then
    raise exception '기여 포인트가 부족합니다';
  end if;

  insert into warehouse_requests (member_id, item_id, quantity, total_cost, note)
  values (auth.uid(), p_item, p_qty, v_item.cost * p_qty, coalesce(p_note, ''))
  returning id into v_id;
  return v_id;
end $$;

-- 신청 승인/반려 (운영진)
create or replace function public.decide_request(p_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r         warehouse_requests;
  v_stock   int;
  v_name    text;
  v_balance bigint;
begin
  if not is_officer() then
    raise exception '운영진만 처리할 수 있습니다';
  end if;

  select * into r from warehouse_requests where id = p_id for update;
  if not found or r.status <> 'pending' then
    raise exception '이미 처리된 신청입니다';
  end if;

  if p_approve then
    select stock, name into v_stock, v_name from warehouse_items where id = r.item_id for update;
    if v_stock < r.quantity then
      raise exception '창고 재고가 부족합니다';
    end if;
    select coalesce(sum(delta), 0) into v_balance from point_ledger where member_id = r.member_id;
    if v_balance < r.total_cost then
      raise exception '신청자의 기여 포인트가 부족합니다';
    end if;

    update warehouse_items set stock = stock - r.quantity where id = r.item_id;
    if r.total_cost > 0 then
      insert into point_ledger (member_id, delta, kind, reason, created_by)
      values (r.member_id, -r.total_cost, 'warehouse', v_name || ' x' || r.quantity, auth.uid());
    end if;
  end if;

  update warehouse_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_id;
end $$;

-- 내 신청 취소
create or replace function public.cancel_request(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update warehouse_requests
     set status = 'cancelled', decided_at = now()
   where id = p_id and member_id = auth.uid() and status = 'pending';
  if not found then
    raise exception '취소할 수 없는 신청입니다';
  end if;
end $$;

revoke execute on function public.request_item(uuid, int, text) from anon;
revoke execute on function public.decide_request(uuid, boolean) from anon;
revoke execute on function public.cancel_request(uuid) from anon;
