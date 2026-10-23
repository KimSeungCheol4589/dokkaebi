import { useEffect, useState } from 'react';
import { MemberGate, RoleBadge } from '../components/Layout';
import { api, fmt, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction, useLoad } from '../lib/hooks';
import { KIND_LABEL, ROLE_LABEL, STATUS_LABEL, type Guild, type ItemDraft, type PointKind, type Role } from '../lib/types';

const TABS = ['신청 처리', '포인트 지급', '문파원 관리', '창고 관리', '문파 정보'] as const;
type Tab = (typeof TABS)[number];

export function Admin() {
  const [tab, setTab] = useState<Tab>('신청 처리');
  return (
    <MemberGate officer>
      <div className="page">
        <div className="page-head">
          <h1>문파 관리</h1>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={t === tab} className={t === tab ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        {tab === '신청 처리' && <RequestsTab />}
        {tab === '포인트 지급' && <PointsTab />}
        {tab === '문파원 관리' && <MembersTab />}
        {tab === '창고 관리' && <ItemsTab />}
        {tab === '문파 정보' && <GuildTab />}
      </div>
    </MemberGate>
  );
}

function RequestsTab() {
  const requests = useLoad(() => api.listRequests());
  const members = useLoad(() => api.listMembers());
  const { busy, run } = useAction();
  const [showAll, setShowAll] = useState(false);
  const pointsOf = new Map((members.data ?? []).map((m) => [m.id, m.points]));
  const rows = (requests.data ?? []).filter((r) => showAll || r.status === 'pending');

  const decide = (id: string, approve: boolean) =>
    run(() => api.decideRequest(id, approve), approve ? '승인했습니다. 게임에서 아이템을 지급해 주세요' : '반려했습니다').then(() => {
      requests.reload();
      members.reload();
    });

  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2 className="panel-title">창고 신청</h2>
        <label className="check">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> 처리 완료 포함
        </label>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>신청일</th>
              <th>신청자</th>
              <th>아이템</th>
              <th className="r">수량</th>
              <th className="r">포인트</th>
              <th className="r">신청자 잔액</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{fmtDate(r.created_at)}</td>
                <td className="strong">{r.nickname}</td>
                <td>
                  {r.item_icon} {r.item_name}
                  {r.note && <div className="muted small">{r.note}</div>}
                </td>
                <td className="r num">{r.quantity}</td>
                <td className="r num">{fmt(r.total_cost)}</td>
                <td className="r num muted">{fmt(pointsOf.get(r.member_id) ?? 0)}</td>
                <td>
                  {r.status === 'pending' ? (
                    <div className="row">
                      <button className="btn btn-small btn-jade" disabled={busy} onClick={() => decide(r.id, true)}>
                        승인
                      </button>
                      <button className="btn btn-small" disabled={busy} onClick={() => decide(r.id, false)}>
                        반려
                      </button>
                    </div>
                  ) : (
                    <span className={`status status-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.data && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="muted center">
                  처리할 신청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PointsTab() {
  const members = useLoad(() => api.listMembers());
  const ledger = useLoad(() => api.listLedger());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('50');
  const [kind, setKind] = useState<PointKind>('contribution');
  const [reason, setReason] = useState('');
  const { busy, run } = useAction();

  const list = (members.data ?? []).filter((m) => m.approved);
  const nick = new Map(list.map((m) => [m.id, m.nickname]));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const delta = Number(amount);
  const valid = selected.size > 0 && Number.isInteger(delta) && delta !== 0 && reason.trim().length > 0;

  return (
    <div className="grid-2 wide-left">
      <section className="panel">
        <h2 className="panel-title">포인트 지급 / 차감</h2>
        <p className="muted small">레이드·전장 참여자처럼 여러 명을 한 번에 선택할 수 있습니다. 음수를 넣으면 차감됩니다.</p>
        <div className="row">
          <button className="link-btn" onClick={() => setSelected(new Set(list.map((m) => m.id)))}>
            전체 선택
          </button>
          <button className="link-btn" onClick={() => setSelected(new Set())}>
            선택 해제
          </button>
          <span className="muted small">{selected.size}명 선택</span>
        </div>
        <div className="chips">
          {list.map((m) => (
            <button key={m.id} className={selected.has(m.id) ? 'chip on' : 'chip'} onClick={() => toggle(m.id)}>
              {m.nickname}
            </button>
          ))}
        </div>
        <div className="form-row">
          <label className="field">
            <span>구분</span>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value as PointKind)}>
              <option value="contribution">기여 (레이드·전장·기부)</option>
              <option value="growth">성장 (전투력 상승 보상)</option>
              <option value="adjust">조정</option>
            </select>
          </label>
          <label className="field">
            <span>포인트</span>
            <input className="input" type="number" step={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>사유</span>
          <input className="input" placeholder="예: 10/25 문파 레이드 참여" maxLength={60} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          className="btn btn-red"
          disabled={busy || !valid}
          onClick={() =>
            run(() => api.grantPoints([...selected], delta, kind, reason.trim()), `${selected.size}명에게 ${delta > 0 ? '+' : ''}${delta}P 처리했습니다`).then((ok) => {
              if (ok) {
                setSelected(new Set());
                setReason('');
                ledger.reload();
                members.reload();
              }
            })
          }
        >
          {selected.size}명에게 {Number.isFinite(delta) && delta > 0 ? '+' : ''}
          {amount || 0}P {delta < 0 ? '차감' : '지급'}
        </button>
      </section>

      <section className="panel">
        <h2 className="panel-title">최근 포인트 기록</h2>
        <ul className="log">
          {(ledger.data ?? []).slice(0, 30).map((l) => (
            <li key={l.id}>
              <span className="muted small">{fmtDate(l.created_at)}</span>
              <span className={`kind kind-${l.kind}`}>{KIND_LABEL[l.kind]}</span>
              <span className="strong">{nick.get(l.member_id) ?? '-'}</span>
              <span className="grow">{l.reason}</span>
              <span className={`num ${l.delta > 0 ? 'up' : 'down'}`}>
                {l.delta > 0 ? '+' : ''}
                {fmt(l.delta)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MembersTab() {
  const { isMaster, me } = useAuth();
  const members = useLoad(() => api.listMembers());
  const { busy, run } = useAction();
  const [powerEdit, setPowerEdit] = useState<Record<string, string>>({});

  const all = members.data ?? [];
  const pending = all.filter((m) => !m.approved);
  const active = all.filter((m) => m.approved);
  const act = (fn: () => Promise<unknown>, ok: string) => run(fn, ok).then(members.reload);

  return (
    <>
      <section className="panel">
        <h2 className="panel-title">가입 대기 {pending.length > 0 && <span className="badge">{pending.length}</span>}</h2>
        {pending.length === 0 && <p className="muted">대기 중인 가입 신청이 없습니다.</p>}
        <ul className="pending">
          {pending.map((m) => (
            <li key={m.id}>
              <span className="strong">{m.nickname}</span>
              <span className="muted small">전투력 {fmt(m.combat_power)} · {fmtDate(m.joined_at)} 신청</span>
              <button className="btn btn-small btn-jade" disabled={busy} onClick={() => act(() => api.adminUpdateMember(m.id, { approved: true }), `${m.nickname} 님을 승인했습니다`)}>
                승인
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">문파원 ({active.length}명)</h2>
        <p className="muted small">직책 변경은 문주만 할 수 있습니다. 탈퇴 처리하면 가입 대기 상태로 돌아갑니다.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>직책</th>
                <th className="r">전투력</th>
                <th className="r">포인트</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((m) => {
                const editing = powerEdit[m.id];
                return (
                  <tr key={m.id}>
                    <td className="strong">{m.nickname}</td>
                    <td>
                      {isMaster && m.id !== me?.id ? (
                        <select
                          className="input input-small"
                          value={m.role}
                          disabled={busy}
                          onChange={(e) => act(() => api.adminUpdateMember(m.id, { role: e.target.value as Role }), '직책을 바꿨습니다')}
                        >
                          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    <td className="r">
                      {editing !== undefined ? (
                        <form
                          className="row-end"
                          onSubmit={(e) => {
                            e.preventDefault();
                            act(() => api.adminUpdateMember(m.id, { combat_power: Math.max(0, Math.floor(Number(editing) || 0)) }), '전투력을 갱신했습니다').then(() =>
                              setPowerEdit(({ [m.id]: _, ...rest }) => rest),
                            );
                          }}
                        >
                          <input className="input input-small" inputMode="numeric" autoFocus value={editing} onChange={(e) => setPowerEdit((p) => ({ ...p, [m.id]: e.target.value.replace(/\D/g, '') }))} />
                          <button className="btn btn-small">저장</button>
                        </form>
                      ) : (
                        <button className="link-btn num" onClick={() => setPowerEdit((p) => ({ ...p, [m.id]: String(m.combat_power) }))}>
                          {fmt(m.combat_power)} ✎
                        </button>
                      )}
                    </td>
                    <td className="r num">{fmt(m.points)}</td>
                    <td className="r">
                      {m.id !== me?.id && m.role !== 'master' && (
                        <button
                          className="link-btn danger"
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`${m.nickname} 님을 탈퇴 처리할까요?`)) act(() => api.adminUpdateMember(m.id, { approved: false }), '탈퇴 처리했습니다');
                          }}
                        >
                          탈퇴 처리
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

const EMPTY_ITEM: ItemDraft = { name: '', category: '소모품', icon: '📦', description: '', stock: 0, cost: 0, active: true };

function ItemsTab() {
  const items = useLoad(() => api.listItems());
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const { busy, run } = useAction();
  const set = <K extends keyof ItemDraft>(k: K, v: ItemDraft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="grid-2 wide-left">
      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">창고 아이템</h2>
          <button className="btn btn-small btn-red" onClick={() => setDraft({ ...EMPTY_ITEM })}>
            + 아이템 추가
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>아이템</th>
                <th>분류</th>
                <th className="r">재고</th>
                <th className="r">가격</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(items.data ?? []).map((i) => (
                <tr key={i.id} className={i.active ? undefined : 'dim'}>
                  <td className="strong">
                    {i.icon} {i.name} {!i.active && <span className="muted small">(숨김)</span>}
                  </td>
                  <td>{i.category}</td>
                  <td className={`r num ${i.stock === 0 ? 'down' : ''}`}>{fmt(i.stock)}</td>
                  <td className="r num">{fmt(i.cost)}P</td>
                  <td className="r">
                    <button className="link-btn" onClick={() => setDraft({ ...i })}>
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        {draft ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => api.saveItem({ ...draft, name: draft.name.trim() }), '저장했습니다')) {
                setDraft(null);
                items.reload();
              }
            }}
          >
            <h2 className="panel-title">{draft.id ? '아이템 수정' : '새 아이템'}</h2>
            <div className="form-row">
              <label className="field narrow-field">
                <span>아이콘</span>
                <input className="input" maxLength={4} value={draft.icon} onChange={(e) => set('icon', e.target.value)} />
              </label>
              <label className="field">
                <span>이름</span>
                <input className="input" required maxLength={40} value={draft.name} onChange={(e) => set('name', e.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>분류</span>
              <input className="input" list="item-cats" required maxLength={12} value={draft.category} onChange={(e) => set('category', e.target.value)} />
              <datalist id="item-cats">
                {['강화', '소모품', '장비', '스킬', '기타'].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>설명</span>
              <input className="input" maxLength={80} value={draft.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <div className="form-row">
              <label className="field">
                <span>재고</span>
                <input className="input" type="number" min={0} value={draft.stock} onChange={(e) => set('stock', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
              </label>
              <label className="field">
                <span>가격 (포인트)</span>
                <input className="input" type="number" min={0} value={draft.cost} onChange={(e) => set('cost', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} /> 문파원에게 보이기
            </label>
            <div className="row-end">
              <button type="button" className="btn" onClick={() => setDraft(null)}>
                취소
              </button>
              <button className="btn btn-red" disabled={busy}>
                저장
              </button>
            </div>
          </form>
        ) : (
          <p className="muted">아이템을 추가하거나 목록에서 수정할 아이템을 고르세요. 게임 창고에 아이템을 넣었으면 여기 재고도 같이 늘려 주세요.</p>
        )}
      </section>
    </div>
  );
}

function GuildTab() {
  const guild = useLoad(() => api.getGuild());
  const [form, setForm] = useState<Guild | null>(null);
  const { busy, run } = useAction();
  useEffect(() => {
    if (guild.data) setForm(guild.data);
  }, [guild.data]);
  if (!form) return <p className="muted">불러오는 중…</p>;
  const set = <K extends keyof Guild>(k: K, v: Guild[K]) => setForm({ ...form, [k]: v });
  const num = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

  return (
    <section className="panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => api.updateGuild({ ...form, exp_next: Math.max(1, form.exp_next), level: Math.max(1, form.level) }), '문파 정보를 저장했습니다. 새로고침하면 상단에도 반영됩니다');
        }}
      >
        <h2 className="panel-title">문파 정보</h2>
        <div className="form-row">
          <label className="field">
            <span>문파 이름</span>
            <input className="input" required maxLength={20} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="field">
            <span>문파 레벨</span>
            <input className="input" type="number" min={1} value={form.level} onChange={(e) => set('level', num(e.target.value))} />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            <span>현재 문파 경험치</span>
            <input className="input" type="number" min={0} value={form.exp} onChange={(e) => set('exp', num(e.target.value))} />
          </label>
          <label className="field">
            <span>다음 레벨까지 필요 경험치</span>
            <input className="input" type="number" min={1} value={form.exp_next} onChange={(e) => set('exp_next', num(e.target.value))} />
          </label>
        </div>
        <label className="field">
          <span>문파 한마디</span>
          <input className="input" maxLength={40} value={form.motto} onChange={(e) => set('motto', e.target.value)} />
        </label>
        <label className="field">
          <span>공지</span>
          <textarea className="input" rows={5} maxLength={1000} value={form.notice} onChange={(e) => set('notice', e.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.recruiting} onChange={(e) => set('recruiting', e.target.checked)} /> 문파원 모집 중
        </label>
        <div className="row-end">
          <button className="btn btn-red" disabled={busy}>
            저장
          </button>
        </div>
      </form>
    </section>
  );
}
