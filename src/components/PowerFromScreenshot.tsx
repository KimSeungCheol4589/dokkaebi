import { useRef, useState } from 'react';
import { errorMessage, fmt } from '../lib/api';
import { readScreenshot } from '../lib/ocr';
import { powerCandidates } from '../lib/powerParse';

/** 내 캐릭터 정보 스크린샷에서 전투력 숫자를 읽어 후보로 보여 주고, 고르면 onPick 으로 넘깁니다. */
export function PowerFromScreenshot({ onPick }: { onPick: (power: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<number[] | null>(null);

  async function read(file: File) {
    setCandidates(null);
    setStatus('읽는 중… (처음 한 번은 글자 인식 데이터를 내려받느라 조금 걸립니다)');
    try {
      const rows = await readScreenshot(file, (p) => setStatus(`읽는 중… ${Math.round(p * 100)}%`));
      const found = powerCandidates(rows);
      setCandidates(found);
      setStatus(found.length ? null : '전투력 숫자를 찾지 못했습니다. 전투력이 잘 보이게 다시 캡처해 주세요.');
      if (found.length === 1) onPick(found[0]);
    } catch (e) {
      setStatus(`읽지 못했습니다: ${errorMessage(e)}`);
    }
  }

  return (
    <div className="power-shot">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn btn-small" onClick={() => inputRef.current?.click()}>
        📸 스크린샷으로 읽기
      </button>
      {status && <span className="muted small">{status}</span>}
      {candidates && candidates.length > 1 && (
        <div className="row">
          <span className="muted small">읽은 숫자 중 전투력을 고르세요:</span>
          {candidates.map((n) => (
            <button key={n} type="button" className="chip" onClick={() => onPick(n)}>
              {fmt(n)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
