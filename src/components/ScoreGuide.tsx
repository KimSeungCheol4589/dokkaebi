import { fmt } from '../lib/api';
import { ACTIVITIES, type Guild } from '../lib/types';

/** 기여 점수 계산 기준표: 전투력 구간 점수 + 활동 참여 점수 */
export function ScoreGuide({ guild }: { guild: Guild }) {
  const tiers = [...guild.power_tiers].sort((a, b) => b.min - a.min);
  return (
    <section className="panel">
      <h2 className="panel-title">🏮 기여 점수 기준</h2>
      <p className="formula">
        기여 점수 = <strong>전투력 점수</strong> + <strong>활동 점수</strong> − 창고 사용
      </p>
      <div className="guide-grid">
        <div>
          <h3 className="guide-title">전투력 점수</h3>
          <p className="muted small">현재 전투력 구간에 따라 자동으로 매겨집니다.</p>
          <table className="table guide-table">
            <tbody>
              {tiers.map((t, i) => (
                <tr key={i}>
                  <td>{i === tiers.length - 1 && t.min === 0 ? `${fmt(tiers[i - 1]?.min ?? 0)} 미만` : `${fmt(t.min)} 이상`}</td>
                  <td className="r num strong">{fmt(t.points)}점</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="guide-title">활동 점수</h3>
          <p className="muted small">문파 콘텐츠에 참여할 때마다 운영진이 기록합니다.</p>
          <table className="table guide-table">
            <tbody>
              {ACTIVITIES.map((a) => (
                <tr key={a.key}>
                  <td>
                    {a.icon} {a.label}
                  </td>
                  <td className="r num strong">+{fmt(guild.activity_points[a.key] ?? 0)}점 / 회</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
