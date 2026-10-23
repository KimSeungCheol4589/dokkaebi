// 창고 물품 아이콘. icon 값이 'img:이름' 이면 src/assets/items/이름.webp 이미지를, 아니면 이모지를 그대로 보여 줍니다.

const files = import.meta.glob('../assets/items/*.webp', { eager: true, import: 'default' }) as Record<string, string>;

export const ITEM_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]),
);

export const ITEM_IMAGE_LABEL: Record<string, string> = {
  'skill-select': '도술 조각 선택 상자',
  'special-select': '특별 도술 조각 선택 상자',
  'special-random': '특별 도술 조각 랜덤 상자',
  'rare-essence': '희귀 가호의 정수',
  'hero-essence': '영웅 가호의 정수',
  'legend-essence': '전설 가호의 정수',
  pouch: '가호 주머니',
  yohonseok: '요혼석',
  potion: '특급 체력 회복 물약',
};

export function ItemIcon({ icon, className = 'item-icon' }: { icon: string; className?: string }) {
  const src = icon.startsWith('img:') ? ITEM_IMAGES[icon.slice(4)] : undefined;
  return (
    <span className={src ? `${className} has-img` : className}>
      {src ? <img src={src} alt="" loading="lazy" /> : icon || '📦'}
    </span>
  );
}
