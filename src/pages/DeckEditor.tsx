import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeckSlots, SkillChip } from '../components/DeckSlots';
import { MemberGate } from '../components/Layout';
import { BASE_SLOTS, DECK_PURPOSES, MAX_EXTRA_SLOTS, SKILLS, STYLES, STYLE_BY_NAME, ultimateStyle } from '../data/skills';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction } from '../lib/hooks';
import type { DeckDraft } from '../lib/types';

const EMPTY: DeckDraft = { title: '', purpose: '사냥', extra_slots: 0, slots: [], description: '', video_url: '' };

export function DeckEditor() {
  return (
    <MemberGate>
      <Editor />
    </MemberGate>
  );
}

function Editor() {
  const { id } = useParams();
  const { me, isOfficer } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<DeckDraft | null>(id ? null : EMPTY);
  const [active, setActive] = useState(0);
  const [style, setStyle] = useState('');
  const [query, setQuery] = useState('');
  const { busy, run } = useAction();

  useEffect(() => {
    if (!id) return;
    api.getDeck(id).then((d) => {
      if (!d) return navigate('/decks');
      if (d.author_id !== me?.id && !isOfficer) return navigate(`/decks/${id}`);
      setDraft({ id: d.id, title: d.title, purpose: d.purpose, extra_slots: d.extra_slots, slots: d.slots, description: d.description, video_url: d.video_url });
    });
  }, [id, me?.id, isOfficer, navigate]);

  const total = BASE_SLOTS + (draft?.extra_slots ?? 0);
  const slots = useMemo(() => Array.from({ length: total }, (_, i) => draft?.slots[i] ?? null), [draft, total]);
  const palette = SKILLS.filter((s) => (!style || s.style === style) && (!query.trim() || s.name.includes(query.trim())));

  if (!draft) return <div className="page"><p className="muted">불러오는 중…</p></div>;
  const set = (patch: Partial<DeckDraft>) => setDraft({ ...draft, ...patch });

  function place(name: string) {
    // 고른 칸에 넣거나 바꿈. 같은 도술은 덱에 한 번만 들어가므로 다른 칸에 있던 것은 뺌
    const next = [...slots];
    const existing = next.indexOf(name);
    if (existing >= 0) next[existing] = null;
    next[active] = name;
    set({ slots: next });
    const empty = next.indexOf(null);
    setActive(empty >= 0 ? empty : active);
  }

  const filledCount = slots.filter(Boolean).length;
  const ult = ultimateStyle(slots);

  return (
    <div className="page">
      <div className="page-head">
        <h1>{draft.id ? '덱 수정' : '덱 올리기'}</h1>
        <p className="muted">칸을 누른 뒤 아래에서 도술을 고르세요. 기본 칸에 같은 스타일 도술 3개를 넣으면 그 스타일 궁극기가 열립니다.</p>
      </div>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">도술 칸 {ult && <span className="badge-pick">{ult} 궁극기</span>}</h2>
          <div className="row">
            <span className="muted small">추가 칸</span>
            {Array.from({ length: MAX_EXTRA_SLOTS + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                className={draft.extra_slots === n ? 'tab active' : 'tab'}
                onClick={() => {
                  const next = Array.from({ length: BASE_SLOTS + n }, (_, i) => slots[i] ?? null);
                  set({ extra_slots: n, slots: next });
                  // 칸을 늘리면 새로 생긴 빈 칸을 바로 고르도록
                  const empty = next.indexOf(null);
                  setActive((a) => (empty >= 0 ? empty : Math.min(a, next.length - 1)));
                }}
              >
                {n}칸
              </button>
            ))}
          </div>
        </div>
        <div className="slot-editor">
          {slots.map((name, i) => (
            <button key={i} type="button" className={`slot-btn${active === i ? ' active' : ''}${i >= BASE_SLOTS ? ' extra' : ''}`} onClick={() => setActive(i)}>
              <span className="slot-no">{i < BASE_SLOTS ? `기본 ${i + 1}` : `추가 ${i - BASE_SLOTS + 1}`}</span>
              <SkillChip name={name} />
              {name && (
                <span
                  className="slot-clear"
                  role="button"
                  aria-label={`${name} 빼기`}
                  onClick={(e) => {
                    e.stopPropagation();
                    set({ slots: slots.map((s, j) => (j === i ? null : s)) });
                    setActive(i);
                  }}
                >
                  ✕
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="muted small">추가 칸은 영기 수련 5-1, 전투 멤버십, 문파 협력 수련 3-1 로 하나씩 열립니다.</p>
      </section>

      <section className="panel">
        <h2 className="panel-title">도술 고르기</h2>
        <div className="toolbar">
          <div className="tabs">
            <button type="button" className={!style ? 'tab active' : 'tab'} onClick={() => setStyle('')}>
              전체
            </button>
            {STYLES.map((s) => (
              <button
                key={s.name}
                type="button"
                className={style === s.name ? 'tab active' : 'tab'}
                style={style === s.name ? { background: s.color, borderColor: s.color } : { borderColor: s.color }}
                onClick={() => setStyle(s.name)}
              >
                {s.name}
              </button>
            ))}
          </div>
          <input className="input" placeholder="도술 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="palette">
          {palette.map((s) => {
            const used = slots.includes(s.name);
            return (
              <button
                key={s.name}
                type="button"
                className={used ? 'palette-skill used' : 'palette-skill'}
                style={{ ['--style' as string]: STYLE_BY_NAME[s.style].color }}
                onClick={() => place(s.name)}
              >
                <span className="skill-name">{s.name}</span>
                <span className="muted small">
                  {s.style} · {s.cooldown}초
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => api.saveDeck({ ...draft, title: draft.title.trim(), slots, video_url: draft.video_url.trim() }), '덱을 저장했습니다').then(async (ok) => {
            if (ok) navigate(draft.id ? `/decks/${draft.id}` : '/decks');
          });
        }}
      >
        <h2 className="panel-title">덱 정보</h2>
        <div className="form-row">
          <label className="field">
            <span>덱 이름</span>
            <input className="input" required maxLength={40} placeholder="예: 강타 보스 단일딜" value={draft.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field narrow-select">
            <span>용도</span>
            <select className="input" value={draft.purpose} onChange={(e) => set({ purpose: e.target.value })}>
              {DECK_PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>설명 (사용법, 강화 순서, 상황별 팁)</span>
          <textarea className="input" rows={5} maxLength={2000} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
        </label>
        <label className="field">
          <span>참고 영상 주소 (선택)</span>
          <input className="input" type="url" placeholder="https://" value={draft.video_url} onChange={(e) => set({ video_url: e.target.value })} />
        </label>
        <div className="row-end">
          <span className="muted small">{filledCount}칸 채움</span>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            취소
          </button>
          <button className="btn btn-red" disabled={busy || filledCount === 0}>
            저장
          </button>
        </div>
      </form>

      <section className="panel">
        <h2 className="panel-title">미리보기</h2>
        <DeckSlots slots={slots} extra={draft.extra_slots} />
      </section>
    </div>
  );
}
