import { DECK_SLOTS, SKILL_BY_NAME, STYLE_BY_NAME, resolveUltimate } from '../data/skills';

/** 도술 한 칸: 스타일 색 띠 + 이름 */
export function SkillChip({ name, small }: { name: string | null; small?: boolean }) {
  if (!name) return <span className={`skill-chip empty${small ? ' small' : ''}`}>빈 칸</span>;
  const skill = SKILL_BY_NAME[name];
  const color = skill ? STYLE_BY_NAME[skill.style]?.color : '#888';
  return (
    <span className={`skill-chip${small ? ' small' : ''}`} style={{ ['--style' as string]: color }} title={skill ? `${skill.style} · ${skill.cooldown}초` : name}>
      <span className="skill-style">{skill?.style ?? '?'}</span>
      <span className="skill-name">{name}</span>
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
        {ult ? (
          <span className="skill-chip ult-chip" style={{ ['--style' as string]: STYLE_BY_NAME[ult].color }}>
            <span className="skill-style">궁극기</span>
            <span className="skill-name">{ult} 궁극기</span>
          </span>
        ) : (
          <span className={`skill-chip empty${small ? ' small' : ''}`}>궁극기 없음</span>
        )}
      </div>
    </div>
  );
}
