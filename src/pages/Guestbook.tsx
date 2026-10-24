import { useEffect, useState } from 'react';
import { api, fmt, fmtDate } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAction, useLoad } from '../lib/hooks';

export function Guestbook() {
  const { me, isOfficer, session } = useAuth();
  const entries = useLoad(() => api.listGuestbook(), [session?.userId]);
  const stats = useLoad(() => api.getVisitStats());
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const { busy, run } = useAction();

  useEffect(() => {
    if (me) setName(me.nickname);
  }, [me]);

  return (
    <div className="page">
      <div className="page-head page-head-row">
        <div>
          <h1>방명록</h1>
          <p className="muted">문파원도, 지나가는 손님도 한마디 남겨 주세요.</p>
        </div>
        {stats.data && (
          <div className="visit-box">
            <span>
              오늘 <strong>{fmt(stats.data.today)}</strong>
            </span>
            <span>
              전체 <strong>{fmt(stats.data.total)}</strong>
            </span>
          </div>
        )}
      </div>

      <form
        className="panel guest-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => api.addGuestbook(name, message), '남겼습니다').then((ok) => {
            if (ok) {
              setMessage('');
              entries.reload();
            }
          });
        }}
      >
        <div className="form-row">
          <label className="field narrow-name">
            <span>이름</span>
            <input className="input" required maxLength={20} value={name} readOnly={!!me} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            <span>남길 말 ({message.length}/500)</span>
            <textarea className="input" required rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
        </div>
        <div className="row-end">
          {!session && <span className="muted small">로그인하지 않아도 남길 수 있습니다. 지우기는 운영진만 할 수 있어요.</span>}
          <button className="btn btn-red" disabled={busy || !name.trim() || !message.trim()}>
            남기기
          </button>
        </div>
      </form>

      {entries.error && <p className="error">{entries.error}</p>}
      <ul className="guest-list">
        {(entries.data ?? []).map((g) => (
          <li key={g.id} className="panel">
            <div className="guest-head">
              <strong>{g.name}</strong>
              {g.author_id && <span className="role role-member">문파원</span>}
              <span className="muted small">{fmtDate(g.created_at)}</span>
              {(isOfficer || (me && g.author_id === me.id)) && (
                <button
                  className="link-btn danger small"
                  onClick={() => {
                    if (confirm('이 글을 지울까요?')) run(() => api.deleteGuestbook(g.id), '지웠습니다').then(entries.reload);
                  }}
                >
                  지우기
                </button>
              )}
            </div>
            <p className="guest-msg">{g.message}</p>
          </li>
        ))}
        {entries.data?.length === 0 && <li className="muted">아직 남긴 글이 없습니다. 첫 글을 남겨 주세요!</li>}
      </ul>
    </div>
  );
}
