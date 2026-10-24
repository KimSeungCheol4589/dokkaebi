import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DeckSlots } from '../components/DeckSlots';
import { api, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction, useLoad } from '../lib/hooks';
import { DECK_PURPOSES, SKILL_BY_NAME, STYLES } from '../data/skills';
import type { Deck } from '../lib/types';

type Sort = 'likes' | 'new';

export function Decks() {
  const { session, isMember } = useAuth();
  const decks = useLoad(() => api.listDecks(), [session?.userId]);
  const [purpose, setPurpose] = useState('전체');
  const [style, setStyle] = useState('');
  const [sort, setSort] = useState<Sort>('likes');

  const filtered = useMemo(() => {
    return (decks.data ?? [])
      .filter((d) => purpose === '전체' || d.purpose === purpose)
      .filter((d) => !style || d.slots.some((n) => n && SKILL_BY_NAME[n]?.style === style))
      .sort((a, b) => (sort === 'likes' ? b.like_count - a.like_count : 0) || b.created_at.localeCompare(a.created_at));
  }, [decks.data, purpose, style, sort]);

  const picks = filtered.filter((d) => d.guild_pick);
  const others = filtered.filter((d) => !d.guild_pick);

  return (
    <div className="page">
      <div className="page-head page-head-row">
        <div>
          <h1>도술덱</h1>
          <p className="muted">문파원이 쓰는 도술 조합을 모았습니다. 마음에 드는 덱은 🏮 추천을 눌러 주세요.</p>
        </div>
        {isMember && (
          <Link to="/decks/new" className="btn btn-red">
            + 덱 올리기
          </Link>
        )}
      </div>

      <div className="toolbar">
        <div className="tabs">
          {['전체', ...DECK_PURPOSES].map((p) => (
            <button key={p} className={purpose === p ? 'tab active' : 'tab'} onClick={() => setPurpose(p)}>
              {p}
            </button>
          ))}
        </div>
        <div className="row">
          <select className="input input-auto" value={style} onChange={(e) => setStyle(e.target.value)} aria-label="스타일로 거르기">
            <option value="">모든 스타일</option>
            {STYLES.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <select className="input input-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="정렬">
            <option value="likes">추천순</option>
            <option value="new">최신순</option>
          </select>
        </div>
      </div>

      {decks.error && <p className="error">{decks.error}</p>}
      {!decks.data && !decks.error && <p className="muted">불러오는 중…</p>}

      {picks.length > 0 && (
        <section>
          <h2 className="section-title">🏮 문파 추천 덱</h2>
          <div className="deck-grid">
            {picks.map((d) => (
              <DeckCard key={d.id} deck={d} onChange={decks.reload} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">문파원 덱</h2>
        {others.length === 0 && decks.data && <p className="muted">조건에 맞는 덱이 없습니다.</p>}
        <div className="deck-grid">
          {others.map((d) => (
            <DeckCard key={d.id} deck={d} onChange={decks.reload} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function LikeButton({ deck, onChange }: { deck: Deck; onChange: () => void }) {
  const { isMember } = useAuth();
  const { busy, run } = useAction();
  return (
    <button
      className={deck.liked_by_me ? 'like-btn on' : 'like-btn'}
      disabled={!isMember || busy}
      title={isMember ? (deck.liked_by_me ? '추천 취소' : '추천하기') : '문파원만 추천할 수 있습니다'}
      onClick={() => run(() => api.setDeckLike(deck.id, !deck.liked_by_me)).then(onChange)}
    >
      🏮 추천 {deck.like_count}
    </button>
  );
}

function DeckCard({ deck, onChange }: { deck: Deck; onChange: () => void }) {
  return (
    <article className="deck-card panel">
      <Link to={`/decks/${deck.id}`} className="deck-card-link">
        <div className="deck-card-head">
          <h3>{deck.title}</h3>
          <div className="row">
            {deck.guild_pick && <span className="badge-pick">문파 추천</span>}
            <span className="purpose">{deck.purpose}</span>
          </div>
        </div>
        <DeckSlots slots={deck.slots} ultimate={deck.ultimate_style} small />
        {deck.description && <p className="deck-desc muted small">{deck.description.split('\n')[0]}</p>}
      </Link>
      <div className="deck-card-foot">
        <span className="muted small">
          {deck.author_nickname ?? '(알 수 없음)'} · {fmtDate(deck.created_at)}
        </span>
        <LikeButton deck={deck} onChange={onChange} />
      </div>
    </article>
  );
}
