import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction } from '../lib/hooks';
import { PowerFromScreenshot } from './PowerFromScreenshot';

/** 구글로 처음 로그인한 사람에게 게임 닉네임·전투력을 받는 창. 닉네임을 정하면 다시 뜨지 않음 */
export function NicknameSetup() {
  const { me, refreshMe } = useAuth();
  const [nickname, setNickname] = useState('');
  const [power, setPower] = useState('');
  const { busy, run } = useAction();

  if (!me || me.nickname_confirmed) return null;

  return (
    <div className="modal-back">
      <form
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-label="게임 닉네임 입력"
        onSubmit={async (e) => {
          e.preventDefault();
          const p = Math.max(0, Math.floor(Number(power.replace(/,/g, '')) || 0));
          const ok = await run(() => api.updateMyProfile({ nickname: nickname.trim(), combat_power: p }), '반갑습니다! 운영진 승인을 기다려 주세요');
          if (ok) refreshMe();
        }}
      >
        <h2 className="panel-title">문파에 오신 걸 환영합니다</h2>
        <p className="muted small">문파원 목록에 보일 정보를 입력해 주세요. 나중에 내 정보에서 바꿀 수 있습니다.</p>
        <label className="field">
          <span>게임 닉네임</span>
          <input className="input" required autoFocus maxLength={20} placeholder={me.nickname} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label className="field">
          <span>현재 전투력</span>
          <input className="input" inputMode="numeric" placeholder="예: 35000" value={power} onChange={(e) => setPower(e.target.value.replace(/[^\d,]/g, ''))} />
        </label>
        <PowerFromScreenshot onPick={(n) => setPower(String(n))} />
        <div className="row-end">
          <button className="btn btn-red" disabled={busy || !nickname.trim()}>
            시작하기
          </button>
        </div>
      </form>
    </div>
  );
}
