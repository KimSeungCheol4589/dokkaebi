// 도깨비의세계 도술 목록 (2026-10-21 패치 기준, 도술 이름·스타일·재사용 대기시간).
// 패치로 도술이 바뀌면 이 파일만 고치면 됩니다.

export type StyleGroup = '근거리' | '원거리' | '유틸·제어';

export interface Style {
  name: string;
  group: StyleGroup;
  color: string;
}

export const STYLES: Style[] = [
  { name: '절명', group: '근거리', color: '#e05a5a' },
  { name: '연타', group: '근거리', color: '#f08a3c' },
  { name: '강타', group: '근거리', color: '#e9b860' },
  { name: '척살', group: '근거리', color: '#b7a27a' },
  { name: '저격', group: '원거리', color: '#7fd8ff' },
  { name: '주술', group: '원거리', color: '#b98cf0' },
  { name: '파멸', group: '원거리', color: '#5b8cff' },
  { name: '강인', group: '유틸·제어', color: '#9aa7b8' },
  { name: '기동', group: '유틸·제어', color: '#5fd0a0' },
  { name: '기만', group: '유틸·제어', color: '#f07ab8' },
  { name: '헌신', group: '유틸·제어', color: '#a8e06a' },
  { name: '제압', group: '유틸·제어', color: '#6fc4c4' },
];

export const STYLE_BY_NAME: Record<string, Style> = Object.fromEntries(STYLES.map((s) => [s.name, s]));

export interface Skill {
  name: string;
  style: string;
  /** 재사용 대기시간(초) */
  cooldown: number;
}

const RAW: Record<string, [string, number][]> = {
  절명: [['찌르기', 8], ['연속 찌르기', 7], ['약점 베기', 12], ['삼단 찌르기', 6], ['기습', 16], ['내려찍기', 8], ['환영 참격', 8], ['심장 절단', 8], ['은신', 25]],
  연타: [['주먹 지르기', 7], ['휘둘러 내려치기', 6], ['묵직한 주먹', 9], ['연쇄 타격', 8], ['회전 난격', 10], ['집중 연타', 9], ['난타', 11]],
  강타: [['내려치기', 6], ['올려치기', 6.5], ['대검 찍기', 7], ['크게 베기', 10], ['연속 충격', 9], ['휘둘러치기', 8], ['검기 날리기', 11], ['검기 폭발', 13], ['대검 강타', 12], ['돌풍 강격', 11]],
  척살: [['먹 베기', 7], ['삼묵법', 9], ['무수불축', 8], ['필력종횡', 7], ['묵영점정', 12], ['용사비등', 10]],
  저격: [['사격', 4.5], ['이중 사격', 5.5], ['반동 사격', 8], ['밀쳐내는 화살', 9], ['쇠뇌 사격', 5], ['집중 사격', 8], ['쐐기 화살', 12], ['일점 저격', 15], ['폭발하는 화살', 12], ['꿰뚫는 저격', 15]],
  주술: [['부적 던지기', 4.5], ['살 날리기', 5], ['저주 내리기', 14], ['신벌의 영역', 17], ['영혼 소용돌이', 20]],
  파멸: [['연쇄 번개', 8], ['화염구', 11], ['낙뢰', 8], ['얼음화살', 6], ['화염 분출', 9], ['서리의 잔향', 10], ['날카로운 얼음창', 8], ['붕괴하는 대지', 9], ['번개 폭풍', 10], ['요혼격', 10], ['하늘의 심판', 12], ['요기 폭발', 10]],
  강인: [['방패 치기', 14], ['방패 밀기', 15], ['방패 충격파', 20], ['방패 내려찍기', 20], ['강인한 의지', 30], ['전투의 함성', 70]],
  기동: [['도약 찌르기', 8], ['휩쓸어 베기', 9], ['후퇴 사격', 8], ['쌍검 가르기', 10], ['일섬', 11], ['월식', 12], ['급소 관통', 10]],
  기만: [['슬쩍 베기', 12], ['어지럼 유발', 10], ['광기의 칼놀림', 13], ['솟아오르는 창', 16], ['간파의 눈', 40], ['공간 결계', 15], ['환상술', 18]],
  헌신: [['생명의 흐름', 15], ['산들 바람', 20], ['생명의 축복', 20], ['불굴', 20], ['최후의 저항', 80], ['용맹의 기운', 30]],
  제압: [['머리치기', 16], ['얼음 감옥', 35], ['쇠사슬 가시', 25], ['회전 일격', 20], ['응축하는 바람', 18], ['도깨비 불', 13], ['얼어붙은 대지', 28], ['지진', 22]],
};

export const SKILLS: Skill[] = Object.entries(RAW).flatMap(([style, list]) =>
  list.map(([name, cooldown]) => ({ name, style, cooldown })),
);

export const SKILL_BY_NAME: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.name, s]));

/** 스타일별 궁극기 (같은 스타일 도술 3개 이상일 때 궁극기 칸에 들어감) */
export const ULTIMATES: Record<string, Skill> = Object.fromEntries(
  (
    [
      ['절명', '암습', 30], ['연타', '폭주', 50], ['강타', '천벌', 45], ['척살', '일필휘지', 50],
      ['저격', '정조준', 40], ['주술', '신내림', 76], ['파멸', '대폭발', 50], ['강인', '방패 낙하', 80],
      ['기동', '연속 쇄도', 30], ['기만', '회전하는 칼날', 60], ['헌신', '개전의 가호', 90], ['제압', '사슬 묶기', 30],
    ] as [string, string, number][]
  ).map(([style, name, cooldown]) => [style, { name, style, cooldown }]),
);

/** 도술 8칸 + 궁극기 1칸 = 9칸 */
export const DECK_SLOTS = 8;
export const ULTIMATE_MIN = 3;

export const DECK_PURPOSES = ['사냥', '보스', '대인', '범용'] as const;
export type DeckPurpose = (typeof DECK_PURPOSES)[number];

/** 같은 스타일 도술이 3개 이상인 스타일들 (많은 순). 이 중 하나가 궁극기 칸에 들어갑니다. */
export function eligibleUltimates(slots: (string | null)[]): string[] {
  const count: Record<string, number> = {};
  slots.slice(0, DECK_SLOTS).forEach((name) => {
    const s = name && SKILL_BY_NAME[name]?.style;
    if (s) count[s] = (count[s] ?? 0) + 1;
  });
  return Object.entries(count)
    .filter(([, n]) => n >= ULTIMATE_MIN)
    .sort((a, b) => b[1] - a[1])
    .map(([s]) => s);
}

/** 고른 궁극기가 조건에 맞으면 그것, 아니면 가장 많은 스타일의 궁극기 (없으면 null) */
export function resolveUltimate(slots: (string | null)[], chosen: string | null): string | null {
  const eligible = eligibleUltimates(slots);
  return chosen && eligible.includes(chosen) ? chosen : eligible[0] ?? null;
}

/** 덱에 들어간 스타일별 개수 */
export function styleCounts(slots: (string | null)[]): [string, number][] {
  const count: Record<string, number> = {};
  for (const name of slots) {
    const s = name && SKILL_BY_NAME[name]?.style;
    if (s) count[s] = (count[s] ?? 0) + 1;
  }
  return Object.entries(count).sort((a, b) => b[1] - a[1]);
}
