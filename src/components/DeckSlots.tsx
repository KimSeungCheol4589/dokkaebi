import { BASE_SLOTS, SKILL_BY_NAME, STYLE_BY_NAME, ultimateStyle } from '../data/skills';

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

/** 덱 칸 전체 (기본 5칸 + 추가 칸) 와 궁극기 표시 */
export function DeckSlots({ slots, extra, small }: { slots: (string | null)[]; extra: number; small?: boolean }) {
  const total = BASE_SLOTS + extra;
  const filled = Array.from({ length: total }, (_, i) => slots[i] ?? null);
  const ult = ultimateStyle(filled);
  return (
    <div className="deck-slots">
      {filled.map((name, i) => (
        <div key={i} className={i >= BASE_SLOTS ? 'deck-slot extra' : 'deck-slot'}>
          <span className="slot-no">{i < BASE_SLOTS ? i + 1 : `F${i - BASE_SLOTS + 1}`}</span>
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
