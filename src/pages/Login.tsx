import { useState } from 'react';
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
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, run } = useAction();

  if (session) return <Navigate to="/" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'in') {
      if (await run(() => api.signIn(email.trim(), password))) navigate('/');
      return;
    }
    let needsConfirm = false;
    const ok = await run(async () => {
      needsConfirm = (await api.signUp(email.trim(), password, nickname.trim())).needsConfirm;
    });
    if (ok) needsConfirm ? setSent(true) : navigate('/me');
  }

  return (
    <div className="login-page">
      <img className="login-bg" src={hero} srcSet={HERO_SRCSET} sizes="100vw" alt="" />
      <div className="panel login">
        <div className="login-head">
          <p className="eyebrow">도깨비의세계 문파</p>
          <h1>{mode === 'in' ? '문파 로그인' : '문파 가입 신청'}</h1>
        </div>

        {api.mode === 'demo' && (
          <div className="demo-accounts">
            <p className="muted small">체험 모드입니다. 아래 계정으로 바로 둘러볼 수 있어요.</p>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} className="btn demo-btn" disabled={busy} onClick={() => run(() => api.signIn(a.email, '')).then((ok) => ok && navigate('/'))}>
                <strong>{a.label}</strong>
                <span className="muted small">{a.desc}</span>
              </button>
            ))}
          </div>
        )}

        {sent ? (
          <p className="recruit">
            인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요. 그다음 운영진이 승인하면 문파원이 됩니다.
          </p>
        ) : (
          <form onSubmit={submit}>
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'tab active' : 'tab'} onClick={() => setMode('in')}>
                로그인
              </button>
              <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'tab active' : 'tab'} onClick={() => setMode('up')}>
                가입 신청
              </button>
            </div>
            <label className="field">
              <span>이메일</span>
              <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">
              <span>비밀번호</span>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {mode === 'up' && (
              <label className="field">
                <span>게임 닉네임</span>
                <input className="input" required maxLength={20} value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </label>
            )}
            <button className="btn btn-red wide" disabled={busy}>
              {mode === 'in' ? '로그인' : '가입 신청'}
            </button>
            {mode === 'up' && <p className="muted small">가입 후 문주·부문주가 승인하면 문파 메뉴를 쓸 수 있습니다.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
