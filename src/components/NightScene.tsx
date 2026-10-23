import type { ReactNode } from 'react';
import { DOKKAEBI, FIRE, Sprite } from './Sprite';

// 계단식(도트) 산 능선 좌표를 만듭니다. 같은 seed 면 항상 같은 모양.
function ridge(seed: number, base: number, amp: number, step: number, width = 320): string {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let y = base;
  let pts = `0,90 0,${y}`;
  for (let x = 0; x <= width; x += step) {
    y = Math.max(base - amp, Math.min(base + amp / 2, y + Math.round((rand() - 0.5) * amp * 0.6)));
    pts += ` ${x},${y} ${x + step},${y}`;
  }
  return pts + ` ${width},90`;
}

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: Math.floor((i * 137.508) % 320),
  y: (i * 29 + i * i * 7) % 50,
  big: i % 7 === 0,
}));

export function NightScene({ children }: { children: ReactNode }) {
  return (
    <section className="scene">
      <svg className="scene-bg" viewBox="0 0 320 90" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0e0d2a" />
            <stop offset="0.7" stopColor="#2b2361" />
            <stop offset="1" stopColor="#4a2f6e" />
          </linearGradient>
        </defs>
        <rect width="320" height="90" fill="url(#sky)" />
        {STARS.map((s, i) => (
          <rect key={i} className={s.big ? 'twinkle' : undefined} x={s.x} y={s.y} width={s.big ? 2 : 1} height={s.big ? 2 : 1} fill="#fff6d8" opacity={s.big ? 1 : 0.6} />
        ))}
        {/* 보름달 */}
        <g fill="#f7e7b0">
          <rect x="250" y="10" width="12" height="16" />
          <rect x="248" y="12" width="16" height="12" />
          <rect x="247" y="14" width="18" height="8" />
        </g>
        <rect x="253" y="14" width="3" height="2" fill="#e3cf8e" />
        <rect x="258" y="19" width="2" height="2" fill="#e3cf8e" />
        <polygon points={ridge(7, 58, 14, 8)} fill="#2b2a5e" />
        <polygon points={ridge(21, 68, 10, 6)} fill="#1d1c45" />
        <polygon points={ridge(3, 84, 4, 4)} fill="#0c0b22" />
        {/* 기와지붕 (화면 폭이 좁아도 보이도록 가운데 쪽에 배치) */}
        <g fill="#0a0920">
          <rect x="112" y="64" width="56" height="3" />
          <rect x="108" y="62" width="6" height="3" />
          <rect x="166" y="62" width="6" height="3" />
          <rect x="118" y="60" width="44" height="4" />
          <rect x="124" y="57" width="32" height="3" />
          <rect x="122" y="67" width="36" height="23" />
          <rect x="196" y="71" width="40" height="3" />
          <rect x="193" y="69" width="5" height="3" />
          <rect x="234" y="69" width="5" height="3" />
          <rect x="201" y="68" width="30" height="3" />
          <rect x="204" y="74" width="24" height="16" />
        </g>
        <rect x="112" y="64" width="56" height="1" fill="#3a3478" />
        <rect x="196" y="71" width="40" height="1" fill="#3a3478" />
        <g fill="#f0b847">
          <rect x="128" y="72" width="5" height="6" />
          <rect x="147" y="72" width="5" height="6" />
          <rect x="213" y="78" width="4" height="5" />
        </g>
        <g fill="#c8392b">
          <rect x="138" y="69" width="4" height="5" />
          <rect x="139" y="68" width="2" height="1" />
        </g>
      </svg>
      <div className="scene-fires" aria-hidden>
        <Sprite map={FIRE} scale={4} className="fire f1" />
        <Sprite map={FIRE} scale={3} className="fire f2" />
        <Sprite map={FIRE} scale={5} className="fire f3" />
      </div>
      <div className="scene-content">
        <Sprite map={DOKKAEBI} scale={7} className="hero-dokkaebi" title="방망이를 든 도깨비" />
        <div className="scene-text">{children}</div>
      </div>
    </section>
  );
}
