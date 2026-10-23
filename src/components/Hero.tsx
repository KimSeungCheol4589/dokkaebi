import type { ReactNode } from 'react';
import heroSmall from '../assets/hero-small.webp';
import hero from '../assets/hero.webp';

export const HERO_SRCSET = `${heroSmall} 1200w, ${hero} 2400w`;

/** 달밤의 도깨비 이미지 위에 문파 소개 글을 얹는 메인 비주얼 */
export function Hero({ children }: { children: ReactNode }) {
  return (
    <section className="hero">
      <img className="hero-img" src={hero} srcSet={HERO_SRCSET} sizes="100vw" alt="" fetchPriority="high" />
      <div className="hero-inner">
        <div className="hero-text">{children}</div>
      </div>
    </section>
  );
}
