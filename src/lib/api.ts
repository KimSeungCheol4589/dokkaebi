import { createDemoBackend } from './demoBackend';
import { createSupabaseBackend } from './supabaseBackend';
import type { Backend } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// .env 에 Supabase 값이 있으면 실제 DB, 없으면 체험 모드
export const api: Backend = url && key ? createSupabaseBackend(url, key) : createDemoBackend();

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const fmt = (n: number) => n.toLocaleString('ko-KR');

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
