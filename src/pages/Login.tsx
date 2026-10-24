import { Navigate, useNavigate } from 'react-router-dom';
import hero from '../assets/hero.webp';
import { HERO_SRCSET } from '../components/Hero';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { DEMO_ACCOUNTS } from '../lib/demoBackend';
import { useAction } from '../lib/hooks';

export function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { busy, run } = useAction();

  if (session) return <Navigate to="/" replace />;

  return (
    <div className="login-page">
      <img className="login-bg" src={hero} srcSet={HERO_SRCSET} sizes="100vw" alt="" />
      <div className="panel login">
        <div className="login-head">
          <p className="eyebrow">도깨비의세계 문파</p>
          <h1>문파 로그인 · 가입</h1>
        </div>

        {api.mode === 'demo' ? (
          <div className="demo-accounts">
            <p className="muted small">체험 모드입니다. 실제 사이트에서는 구글 계정으로 로그인합니다. 아래 계정으로 바로 둘러볼 수 있어요.</p>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} className="btn demo-btn" disabled={busy} onClick={() => run(() => api.signIn(a.email, '')).then((ok) => ok && navigate('/'))}>
                <strong>{a.label}</strong>
                <span className="muted small">{a.desc}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button className="google-btn" disabled={busy} onClick={() => run(() => api.signInWithGoogle())}>
              <GoogleMark />
              <span>Google 계정으로 계속하기</span>
            </button>
            <ul className="login-notes muted small">
              <li>처음이면 구글 로그인만으로 가입 신청이 됩니다.</li>
              <li>로그인 후 게임 닉네임과 전투력을 입력해 주세요.</li>
              <li>문주·부문주가 승인하면 문파 메뉴를 쓸 수 있습니다.</li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** Google 'G' 로고 (구글 로그인 버튼 가이드의 표준 아이콘) */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
