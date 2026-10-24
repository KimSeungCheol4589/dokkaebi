// 방문자 수: 브라우저마다 임의 id 를 하나 만들어 하루 한 번만 셉니다. 개인정보는 보내지 않습니다.
import { api } from './api';

const KEY = 'dokkaebi-visitor-id';

function visitorId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)는 이번 접속만 셈
    return crypto.randomUUID();
  }
}

let recorded: Promise<void> | null = null;

/** 앱이 열릴 때 한 번 호출. 실패해도 화면에는 영향 없음 */
export function recordVisit(): Promise<void> {
  recorded ??= api.recordVisit(visitorId()).catch(() => {});
  return recorded;
}
