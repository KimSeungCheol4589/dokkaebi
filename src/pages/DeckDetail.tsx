import { Link, useNavigate, useParams } from 'react-router-dom';
import { DeckSlots } from '../components/DeckSlots';
import { DECK_SLOTS, SKILL_BY_NAME, STYLE_BY_NAME, ULTIMATES, resolveUltimate, styleCounts } from '../data/skills';
import { api, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction, useLoad } from '../lib/hooks';
import { LikeButton } from './Decks';

/** 유튜브·치지직 등 영상 주소만 링크로 보여 줌 (http/https 만) */
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

export function DeckDetail() {
  const { id = '' } = useParams();
  const { me, isOfficer, session } = useAuth();
  // { deck } 로 감싸서 '불러오는 중(data 가 null)' 과 '없는 덱(deck 이 null)' 을 구분
  const deck = useLoad(async () => ({ deck: await api.getDeck(id) }), [id, session?.userId]);
  const navigate = useNavigate();
  const { busy, run } = useAction();

  if (deck.error) return <div className="page"><p className="error">{deck.error}</p></div>;
  if (!deck.data) return <div className="page"><p className="muted">불러오는 중…</p></div>;
  if (!deck.data.deck) {
    return (
      <div className="page">
        <p className="muted">없는 덱입니다.</p>
        <Link to="/decks" className="more">← 도술덱 목록</Link>
      </div>
    );
  }
  const d = deck.data.deck;
  const canEdit = me?.id === d.author_id || isOfficer;
  const video = d.video_url ? safeUrl(d.video_url) : null;
  const filled = d.slots.slice(0, DECK_SLOTS).filter((n): n is string => !!n);
  const ult = resolveUltimate(d.slots, d.ultimate_style);

  return (
    <div className="page">
      <Link to="/decks" className="more">
        ← 도술덱 목록
      </Link>
      <div className="page-head page-head-row">
        <div>
          <h1>{d.title}</h1>
          <p className="muted">
            <span className="purpose">{d.purpose}</span> {d.guild_pick && <span className="badge-pick">문파 추천</span>} · {d.author_nickname ?? '(알 수 없음)'} · {fmtDate(d.updated_at)}
          </p>
        </div>
        <LikeButton deck={d} onChange={deck.reload} />
      </div>

      <section className="panel">
        <h2 className="panel-title">도술 칸</h2>
        <DeckSlots slots={d.slots} ultimate={d.ultimate_style} />
        <div className="style-counts">
          {styleCounts(d.slots).map(([s, n]) => (
            <span key={s} className="style-count" style={{ ['--style' as string]: STYLE_BY_NAME[s]?.color }}>
              {s} {n}
            </span>
          ))}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h2 className="panel-title">설명</h2>
          {d.description ? <p className="notice">{d.description}</p> : <p className="muted">설명이 없습니다.</p>}
          {video && (
            <p>
              <a href={video} target="_blank" rel="noopener noreferrer" className="more">
                ▶ 참고 영상 보기
              </a>
            </p>
          )}
        </section>
        <section className="panel">
          <h2 className="panel-title">도술 정보</h2>
          <table className="table">
            <thead>
              <tr>
                <th>도술</th>
                <th>스타일</th>
                <th className="r">재사용</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((n) => (
                <tr key={n}>
                  <td className="strong">{n}</td>
                  <td>{SKILL_BY_NAME[n]?.style ?? '-'}</td>
                  <td className="r num">{SKILL_BY_NAME[n] ? `${SKILL_BY_NAME[n].cooldown}초` : '-'}</td>
                </tr>
              ))}
              {ult && ULTIMATES[ult] && (
                <tr className="ult-row">
                  <td className="strong">{ULTIMATES[ult].name}</td>
                  <td>{ult} 궁극기</td>
                  <td className="r num">{ULTIMATES[ult].cooldown}초</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {(canEdit || isOfficer) && (
        <div className="row-end">
          {isOfficer && (
            <button
              className="btn"
              disabled={busy}
              onClick={() => run(() => api.setGuildPick(d.id, !d.guild_pick), d.guild_pick ? '문파 추천을 해제했습니다' : '문파 추천 덱으로 지정했습니다').then(deck.reload)}
            >
              {d.guild_pick ? '문파 추천 해제' : '🏮 문파 추천 지정'}
            </button>
          )}
          {canEdit && (
            <>
              <Link to={`/decks/${d.id}/edit`} className="btn">
                수정
              </Link>
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  if (confirm('이 덱을 지울까요?')) run(() => api.deleteDeck(d.id), '덱을 지웠습니다').then((ok) => ok && navigate('/decks'));
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
