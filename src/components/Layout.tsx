import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { resetDemo } from '../lib/demoBackend';
import { useLoad } from '../lib/hooks';
import { ROLE_LABEL } from '../lib/types';
import mark from '../assets/mark.webp';

export function Layout() {
  const { session, me, isOfficer } = useAuth();
  const navigate = useNavigate();
  const guild = useLoad(() => api.getGuild());

  return (
    <div className="app">
      {api.mode === 'demo' && (
        <div className="demo-bar">
          체험 모드 — 데이터는 이 브라우저에만 저장됩니다.
          <button className="link-btn" onClick={resetDemo}>
            체험 데이터 초기화
          </button>
        </div>
      )}
      <header className="topbar">
        <Link to="/" className="brand">
          <img className="brand-mark" src={mark} alt="" width={34} height={34} />
          <span>{guild.data?.name ?? '문파'}</span>
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            문파 소개
          </NavLink>
          <NavLink to="/members">문파원</NavLink>
          <NavLink to="/warehouse">문파창고</NavLink>
          {session && <NavLink to="/me">내 정보</NavLink>}
          {isOfficer && <NavLink to="/admin">관리</NavLink>}
        </nav>
        <div className="account">
          {session ? (
            <>
              {me && (
                <span className="who">
                  <span className={`role role-${me.role}`}>{me.approved ? ROLE_LABEL[me.role] : '승인 대기'}</span>
                  {me.nickname}
                </span>
              )}
              <button
                className="btn btn-small"
                onClick={async () => {
                  await api.signOut();
                  navigate('/');
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-small btn-red">
              로그인
            </Link>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <p>
          {guild.data?.name ?? '문파'} 팬 홈페이지 · 도깨비의세계 공식 사이트가 아니며, 게임 관련 상표와 권리는 각 권리자에게 있습니다.
        </p>
      </footer>
    </div>
  );
}

/** 승인된 문파원만 볼 수 있는 화면을 감쌉니다. */
export function MemberGate({ children, officer = false }: { children: ReactNode; officer?: boolean }) {
  const { ready, session, isMember, isOfficer } = useAuth();
  if (!ready) return <div className="page"><p className="muted">불러오는 중…</p></div>;
  if (!session) {
    return (
      <div className="page">
        <div className="panel gate">
          <h2>문파원 전용</h2>
          <p>로그인한 문파원만 이용할 수 있습니다.</p>
          <Link to="/login" className="btn btn-red">
            로그인 / 가입
          </Link>
        </div>
      </div>
    );
  }
  if (!isMember) {
    return (
      <div className="page">
        <div className="panel gate">
          <h2>가입 승인 대기 중</h2>
          <p>문주 또는 부문주가 승인하면 이용할 수 있습니다. 게임 안에서 운영진에게 알려 주세요.</p>
        </div>
      </div>
    );
  }
  if (officer && !isOfficer) {
    return (
      <div className="page">
        <div className="panel gate">
          <h2>운영진 전용</h2>
          <p>문주와 부문주만 이용할 수 있는 메뉴입니다.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function RoleBadge({ role, approved = true }: { role: keyof typeof ROLE_LABEL; approved?: boolean }) {
  return <span className={`role role-${approved ? role : 'pending'}`}>{approved ? ROLE_LABEL[role] : '대기'}</span>;
}
