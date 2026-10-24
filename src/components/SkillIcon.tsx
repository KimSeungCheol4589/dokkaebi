import { SKILL_ICON_FILE, STYLE_ICON_FILE } from '../data/skillIcons';

const skillFiles = import.meta.glob('../assets/skills/*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const styleFiles = import.meta.glob('../assets/styles/*.webp', { eager: true, import: 'default' }) as Record<string, string>;

export function skillIconUrl(name: string): string | undefined {
  const file = SKILL_ICON_FILE[name];
  return file ? skillFiles[`../assets/skills/${file}.webp`] : undefined;
}

export function styleIconUrl(style: string): string | undefined {
  const file = STYLE_ICON_FILE[style];
  return file ? styleFiles[`../assets/styles/${file}.webp`] : undefined;
}

/** 도술(또는 궁극기) 아이콘. 아이콘이 없으면 아무것도 그리지 않음 */
export function SkillIcon({ name, size = 32, className = 'skill-icon' }: { name: string; size?: number; className?: string }) {
  const src = skillIconUrl(name);
  if (!src) return null;
  return <img className={className} src={src} alt="" width={size} height={size} loading="lazy" />;
}

/** 스타일 문양 (흰색 아이콘) */
export function StyleIcon({ style, size = 16 }: { style: string; size?: number }) {
  const src = styleIconUrl(style);
  if (!src) return null;
  return <img className="style-icon" src={src} alt="" width={size} height={size} />;
}
