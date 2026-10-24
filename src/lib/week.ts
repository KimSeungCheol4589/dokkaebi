// 문파 콘텐츠의 한 주는 수요일에 시작합니다 (supabase/schema.sql 의 week_start 와 같은 규칙).
// 날짜는 모두 현지 기준 'YYYY-MM-DD' 문자열로 다룹니다.

const WEEK_START_DAY = 3; // 수요일 (일=0)

function parse(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function today(): string {
  return toYmd(new Date());
}

/** 그 날짜가 속한 주의 수요일 */
export function weekStart(ymd: string): string {
  const d = parse(ymd);
  d.setDate(d.getDate() - ((d.getDay() - WEEK_START_DAY + 7) % 7));
  return toYmd(d);
}

export function addDays(ymd: string, days: number): string {
  const d = parse(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/** '10/22(수) ~ 10/28(화)' */
export function weekLabel(start: string): string {
  const s = parse(start);
  const e = parse(addDays(start, 6));
  return `${s.getMonth() + 1}/${s.getDate()}(수) ~ ${e.getMonth() + 1}/${e.getDate()}(화)`;
}

export function shortDate(ymd: string): string {
  const d = parse(ymd);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
