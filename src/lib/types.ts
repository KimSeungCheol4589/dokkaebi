export type Role = 'master' | 'officer' | 'member';
export type ActivityKey = 'yosin' | 'barrier' | 'garden' | 'singi';
export type PointKind = ActivityKey | 'warehouse' | 'adjust';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PowerTier {
  min: number;
  points: number;
}

export interface Guild {
  name: string;
  level: number;
  motto: string;
  notice: string;
  recruiting: boolean;
  power_tiers: PowerTier[];
  activity_points: Record<ActivityKey, number>;
}

export interface Member {
  id: string;
  nickname: string;
  combat_power: number;
  role: Role;
  approved: boolean;
  joined_at: string;
  /** 전투력 구간 점수 */
  power_score: number;
  /** 활동 참여·조정으로 받은 점수 합계 (창고 사용 제외) */
  activity_score: number;
  /** 지금 쓸 수 있는 기여 점수 = 전투력 점수 + 활동 점수 - 창고 사용 */
  points: number;
  growth_7d: number;
  /** 본인이 게임 닉네임을 정했는지 (구글 가입 직후에는 false) */
  nickname_confirmed: boolean;
}

export interface LedgerEntry {
  id: string;
  member_id: string;
  delta: number;
  kind: PointKind;
  reason: string;
  /** 활동 참여 날짜 'YYYY-MM-DD' (활동 기록에만 있음) */
  activity_date: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  stock: number;
  cost: number;
  active: boolean;
}

export type ItemDraft = Omit<Item, 'id'> & { id?: string };

export interface ItemRequest {
  id: string;
  member_id: string;
  item_id: string;
  quantity: number;
  total_cost: number;
  status: RequestStatus;
  note: string;
  created_at: string;
  decided_at: string | null;
  // 화면 표시용 (백엔드에서 채움)
  nickname: string;
  item_name: string;
  item_icon: string;
}

export interface Session {
  userId: string;
  email: string;
}

export interface Deck {
  id: string;
  author_id: string;
  author_nickname: string | null;
  title: string;
  purpose: string;
  /** 8칸 순서대로 도술 이름, 빈 칸은 null */
  slots: (string | null)[];
  /** 궁극기 칸에 고른 스타일 (같은 스타일 3개 이상일 때) */
  ultimate_style: string | null;
  description: string;
  video_url: string;
  guild_pick: boolean;
  like_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export type DeckDraft = Pick<Deck, 'title' | 'purpose' | 'slots' | 'ultimate_style' | 'description' | 'video_url'> & { id?: string };

export interface GuestbookEntry {
  id: string;
  author_id: string | null;
  name: string;
  message: string;
  created_at: string;
}

export interface VisitStats {
  today: number;
  total: number;
}

export interface Backend {
  mode: 'demo' | 'supabase';

  getSession(): Promise<Session | null>;
  onAuthChange(cb: (session: Session | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, nickname: string): Promise<{ needsConfirm: boolean }>;
  /** 구글 계정으로 로그인(처음이면 가입). 구글 화면으로 이동했다가 돌아옵니다. */
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;

  getGuild(): Promise<Guild>;
  updateGuild(patch: Partial<Guild>): Promise<void>;

  listMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | null>;
  updateMyProfile(patch: { nickname?: string; combat_power?: number }): Promise<void>;
  adminUpdateMember(
    id: string,
    patch: { role?: Role; approved?: boolean; combat_power?: number },
  ): Promise<void>;

  listLedger(memberId?: string): Promise<LedgerEntry[]>;
  /** 활동 기록이면 activityDate 필수. 같은 문파원·활동·주(수~화)에는 한 번만 기록됩니다. */
  grantPoints(memberIds: string[], delta: number, kind: PointKind, reason: string, activityDate?: string): Promise<void>;

  listItems(): Promise<Item[]>;
  saveItem(item: ItemDraft): Promise<void>;

  listRequests(memberId?: string): Promise<ItemRequest[]>;
  requestItem(itemId: string, quantity: number, note: string): Promise<void>;
  decideRequest(id: string, approve: boolean): Promise<void>;
  cancelRequest(id: string): Promise<void>;

  listDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<Deck | null>;
  /** 새 덱이면 만들고 id 를 돌려줌 */
  saveDeck(draft: DeckDraft): Promise<string>;
  deleteDeck(id: string): Promise<void>;
  setDeckLike(id: string, liked: boolean): Promise<void>;
  setGuildPick(id: string, pick: boolean): Promise<void>;

  listGuestbook(): Promise<GuestbookEntry[]>;
  addGuestbook(name: string, message: string): Promise<void>;
  deleteGuestbook(id: string): Promise<void>;

  recordVisit(visitorId: string): Promise<void>;
  getVisitStats(): Promise<VisitStats>;
}

export const ROLE_LABEL: Record<Role, string> = {
  master: '문주',
  officer: '부문주',
  member: '문파원',
};

export const ACTIVITIES: { key: ActivityKey; label: string; icon: string }[] = [
  { key: 'yosin', label: '요신 토벌령', icon: '⚔️' },
  { key: 'barrier', label: '결계지 방어', icon: '🛡️' },
  { key: 'garden', label: '미혹의 정원', icon: '🌸' },
  { key: 'singi', label: '신기 쟁탈전', icon: '🏆' },
];

export const KIND_LABEL: Record<PointKind, string> = {
  yosin: '요신 토벌령',
  barrier: '결계지 방어',
  garden: '미혹의 정원',
  singi: '신기 쟁탈전',
  warehouse: '창고',
  adjust: '조정',
};

export const DEFAULT_POWER_TIERS: PowerTier[] = [
  { min: 50_000, points: 100 },
  { min: 40_000, points: 80 },
  { min: 30_000, points: 60 },
  { min: 20_000, points: 40 },
  { min: 10_000, points: 20 },
  { min: 0, points: 10 },
];

export const DEFAULT_ACTIVITY_POINTS: Record<ActivityKey, number> = {
  yosin: 10,
  barrier: 10,
  garden: 20,
  singi: 20,
};

/** 전투력이 min 이상인 구간 중 가장 높은 구간의 점수 (supabase/schema.sql 의 power_score 와 같은 규칙) */
export function powerScore(power: number, tiers: PowerTier[]): number {
  const hit = [...tiers].sort((a, b) => b.min - a.min).find((t) => power >= t.min);
  return hit?.points ?? 0;
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  cancelled: '취소',
};
