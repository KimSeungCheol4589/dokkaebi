import { DECK_SLOTS, SKILL_BY_NAME, STYLE_BY_NAME, ULTIMATES, resolveUltimate } from '../data/skills';
import { SkillIcon, StyleIcon } from './SkillIcon';

/** 도술 한 칸: 아이콘 + 스타일 + 이름 */
export function SkillChip({ name, small }: { name: string | null; small?: boolean }) {
  if (!name) return <span className={`skill-chip empty${small ? ' small' : ''}`}>빈 칸</span>;
  const skill = SKILL_BY_NAME[name];
  const color = skill ? STYLE_BY_NAME[skill.style]?.color : '#888';
  return (
    <span className={`skill-chip${small ? ' small' : ''}`} style={{ ['--style' as string]: color }} title={skill ? `${skill.style} · ${skill.cooldown}초` : name}>
      <SkillIcon name={name} size={small ? 26 : 34} />
      <span className="skill-text">
        <span className="skill-style">
          {skill && <StyleIcon style={skill.style} size={11} />}
          {skill?.style ?? '?'}
        </span>
        <span className="skill-name">{name}</span>
      </span>
    </span>
  );
}

/** 궁극기 칸: 궁극기 아이콘 + '궁극기 · 스타일' + 궁극기 이름 */
export function UltimateChip({ style, small }: { style: string; small?: boolean }) {
  const u = ULTIMATES[style];
  return (
    <span
      className={`skill-chip ult-chip${small ? ' small' : ''}`}
      style={{ ['--style' as string]: STYLE_BY_NAME[style]?.color }}
      title={u ? `${style} 궁극기 · ${u.cooldown}초` : undefined}
    >
      {u && <SkillIcon name={u.name} size={small ? 26 : 34} />}
      <span className="skill-text">
        <span className="skill-style">
          <StyleIcon style={style} size={11} />
          궁극기 · {style}
        </span>
        <span className="skill-name">{u?.name ?? `${style} 궁극기`}</span>
      </span>
    </span>
  );
}

/** 덱 9칸: 도술 8칸 + 궁극기 1칸 */
export function DeckSlots({ slots, ultimate, small }: { slots: (string | null)[]; ultimate: string | null; small?: boolean }) {
  const filled = Array.from({ length: DECK_SLOTS }, (_, i) => slots[i] ?? null);
  const ult = resolveUltimate(filled, ultimate);
  return (
    <div className="deck-slots">
      {filled.map((name, i) => (
        <div key={i} className="deck-slot">
          <span className="slot-no">{i + 1}</span>
          <SkillChip name={name} small={small} />
        </div>
      ))}
      <div className={`deck-slot ult${ult ? ' on' : ''}`}>
        <span className="slot-no">R</span>
        {ult ? <UltimateChip style={ult} small={small} /> : <span className={`skill-chip empty${small ? ' small' : ''}`}>궁극기 없음</span>}
      </div>
    </div>
  );
}
