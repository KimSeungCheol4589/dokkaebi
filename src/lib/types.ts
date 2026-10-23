export type Role = 'master' | 'officer' | 'member';
export type PointKind = 'contribution' | 'growth' | 'warehouse' | 'adjust';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Guild {
  name: string;
  level: number;
  exp: number;
  exp_next: number;
  motto: string;
  notice: string;
  recruiting: boolean;
}

export interface Member {
  id: string;
  nickname: string;
  combat_power: number;
  role: Role;
  approved: boolean;
  joined_at: string;
  points: number;
  growth_7d: number;
}

export interface LedgerEntry {
  id: string;
  member_id: string;
  delta: number;
  kind: PointKind;
  reason: string;
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

export interface Backend {
  mode: 'demo' | 'supabase';

  getSession(): Promise<Session | null>;
  onAuthChange(cb: (session: Session | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, nickname: string): Promise<{ needsConfirm: boolean }>;
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
  grantPoints(memberIds: string[], delta: number, kind: PointKind, reason: string): Promise<void>;

  listItems(): Promise<Item[]>;
  saveItem(item: ItemDraft): Promise<void>;

  listRequests(memberId?: string): Promise<ItemRequest[]>;
  requestItem(itemId: string, quantity: number, note: string): Promise<void>;
  decideRequest(id: string, approve: boolean): Promise<void>;
  cancelRequest(id: string): Promise<void>;
}

export const ROLE_LABEL: Record<Role, string> = {
  master: '문주',
  officer: '부문주',
  member: '문파원',
};

export const KIND_LABEL: Record<PointKind, string> = {
  contribution: '기여',
  growth: '성장',
  warehouse: '창고',
  adjust: '조정',
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  cancelled: '취소',
};
