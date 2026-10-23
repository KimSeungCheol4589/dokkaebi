import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RoleBadge } from '../components/Layout';
import { api, fmt, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction, useLoad } from '../lib/hooks';
import { ACTIVITIES, KIND_LABEL } from '../lib/types';

export function MyPage() {
  const { ready, session, me, isMember, refreshMe } = useAuth();
  const ledger = useLoad(() => (me && isMember ? api.listLedger(me.id) : Promise.resolve([])), [me?.id, isMember]);
  const [nickname, setNickname] = useState('');
  const [power, setPower] = useState('');
  const { busy, run } = useAction();

  useEffect(() => {
    if (me) {
      setNickname(me.nickname);
      setPower(String(me.combat_power));
    }
  }, [me]);

  if (ready && !session) return <Navigate to="/login" replace />;
  if (!me) return <div className="page"><p className="muted">불러오는 중…</p></div>;


  return (
    <div className="page">
      <div className="page-head">
        <h1>내 정보</h1>
      </div>

      <div className="grid-2">
        <section className="panel">
          <h2 className="panel-title">
            {me.nickname} <RoleBadge role={me.role} approved={me.approved} />
          </h2>
          <div className="mini-stats">
            <div>
              <span className="stat-label">전투력</span>
              <span className="stat-value">{fmt(me.combat_power)}</span>
            </div>
            <div>
              <span className="stat-label">7일 성장</span>
              <span className="stat-value up">{me.growth_7d > 0 ? `▲ ${fmt(me.growth_7d)}` : '-'}</span>
            </div>
          </div>
          {me.approved && (
            <div className="score-sum">
              <span>
                전투력 점수 <strong>{fmt(me.power_score)}</strong>
              </span>
              <span className="op">+</span>
              <span>
                활동 점수 <strong>{fmt(me.activity_score)}</strong>
              </span>
              <span className="op">−</span>
              <span>
                창고 사용 <strong>{fmt(me.power_score + me.activity_score - me.points)}</strong>
              </span>
              <span className="op">=</span>
              <span className="total-score">
                기여 점수 <strong>{fmt(me.points)}</strong>
              </span>
            </div>
          )}
          {!me.approved && <p className="recruit">가입 승인 대기 중입니다. 운영진이 승인하면 창고를 이용할 수 있습니다.</p>}
        </section>

        <section className="panel">
          <h2 className="panel-title">정보 갱신</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = Number(power.replace(/,/g, ''));
              if (!Number.isFinite(p) || p < 0) return;
              const ok = await run(
                () => api.updateMyProfile({ nickname: nickname.trim(), combat_power: Math.floor(p) }),
                '저장했습니다',
              );
              if (ok) refreshMe();
            }}
          >
            <label className="field">
              <span>닉네임 (게임 닉네임과 같게)</span>
              <input className="input" required maxLength={20} value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>
            <label className="field">
              <span>현재 전투력</span>
              <input className="input" inputMode="numeric" required value={power} onChange={(e) => setPower(e.target.value.replace(/[^\d,]/g, ''))} />
            </label>
            <button className="btn btn-red" disabled={busy}>
              저장
            </button>
          </form>
        </section>
      </div>

      {isMember && (
        <section className="panel">
          <h2 className="panel-title">활동·점수 내역</h2>
          <div className="activity-counts">
            {ACTIVITIES.map((a) => {
              const done = (ledger.data ?? []).filter((l) => l.kind === a.key);
              return (
                <div key={a.key} className="activity-count">
                  <span className="muted small">
                    {a.icon} {a.label}
                  </span>
                  <strong>{done.length}회</strong>
                  <span className="up small">+{fmt(done.reduce((s, l) => s + l.delta, 0))}점</span>
                </div>
              );
            })}
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>구분</th>
                  <th>내용</th>
                  <th className="r">점수</th>
                </tr>
              </thead>
              <tbody>
                {(ledger.data ?? []).map((l) => (
                  <tr key={l.id}>
                    <td className="muted">{fmtDate(l.created_at)}</td>
                    <td>
                      <span className={`kind kind-${l.kind}`}>{KIND_LABEL[l.kind]}</span>
                    </td>
                    <td>{l.reason}</td>
                    <td className={`r num ${l.delta > 0 ? 'up' : 'down'}`}>
                      {l.delta > 0 ? '+' : ''}
                      {fmt(l.delta)}
                    </td>
                  </tr>
                ))}
                {ledger.data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="muted center">
                      아직 활동 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
