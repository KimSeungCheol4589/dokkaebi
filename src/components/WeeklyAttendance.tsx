import { useState } from 'react';
import { ACTIVITIES, type LedgerEntry, type Member } from '../lib/types';
import { addDays, today, weekLabel, weekStart } from '../lib/week';

/** 주간 참여 현황: 문파원 × 활동 표. 한 주는 수요일 시작. */
export function WeeklyAttendance({ members, ledger }: { members: Member[]; ledger: LedgerEntry[] }) {
  const current = weekStart(today());
  const [week, setWeek] = useState(current);

  const done = new Set(
    ledger
      .filter((l) => l.activity_date && weekStart(l.activity_date) === week)
      .map((l) => `${l.member_id}:${l.kind}`),
  );
  const rows = members.filter((m) => m.approved);
  const countOf = (key: string) => rows.filter((m) => done.has(`${m.id}:${key}`)).length;

  return (
    <section className="panel">
      <div className="panel-title-row">
        <h2 className="panel-title">📅 주간 참여 현황</h2>
        <div className="week-nav">
          <button className="btn btn-small" onClick={() => setWeek(addDays(week, -7))} aria-label="이전 주">
            ◀
          </button>
          <span className="week-label">
            {weekLabel(week)}
            {week === current && <span className="badge">이번 주</span>}
          </span>
          <button className="btn btn-small" disabled={week >= current} onClick={() => setWeek(addDays(week, 7))} aria-label="다음 주">
            ▶
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table attendance">
          <thead>
            <tr>
              <th>닉네임</th>
              {ACTIVITIES.map((a) => (
                <th key={a.key} className="center">
                  {a.icon} {a.label}
                </th>
              ))}
              <th className="r">참여</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const n = ACTIVITIES.filter((a) => done.has(`${m.id}:${a.key}`)).length;
              return (
                <tr key={m.id}>
                  <td className="strong">{m.nickname}</td>
                  {ACTIVITIES.map((a) => (
                    <td key={a.key} className="center">
                      {done.has(`${m.id}:${a.key}`) ? <span className="check-on">✓</span> : <span className="check-off">·</span>}
                    </td>
                  ))}
                  <td className={`r num ${n === ACTIVITIES.length ? 'up strong' : ''}`}>
                    {n}/{ACTIVITIES.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="muted">참여 인원</td>
              {ACTIVITIES.map((a) => (
                <td key={a.key} className="center num muted">
                  {countOf(a.key)}명
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
