import React from 'react';
import {useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';

/**
 * Zählwerk: Ziffern rollen wie bei einem Spielautomaten ein und rasten
 * von links nach rechts ein. Satzzeichen, Einheiten und Leerzeichen
 * bleiben stehen und blenden nur ein.
 */
export const Odometer: React.FC<{
  value: string;
  start: number;
  /** Frames, bis die erste Ziffer steht */
  dur?: number;
  /** Versatz zwischen den Ziffern */
  stagger?: number;
  spins?: number;
  size: number;
  color?: string;
  weight?: number;
  stretch?: number;
  style?: React.CSSProperties;
  /** Kleinere Darstellung für Einheiten wie %, Mio. */
  unitScale?: number;
}> = ({
  value,
  start,
  dur = 26,
  stagger = 5,
  spins = 2,
  size,
  color = C.white,
  weight = 800,
  stretch = 80,
  style,
  unitScale = 0.55,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = Array.from(value);
  let digitIndex = 0;
  const lineH = 1.0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        fontFamily: F.display,
        fontWeight: weight,
        fontStretch: `${stretch}%`,
        fontSize: size,
        lineHeight: lineH,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {chars.map((ch, i) => {
        if (!/[0-9]/.test(ch)) {
          const isUnit = /[%a-zA-ZäöüÄÖÜ.]/.test(ch) && ch !== '.';
          const p = tween(frame, start + 6, 14, ease.out);
          if (ch === ' ') {
            // Schmales Leerzeichen statt voller Wortabstand (7,8 % statt 7,8   %)
            return <span key={i} style={{display: 'inline-block', width: '0.1em'}} />;
          }
          return (
            <span
              key={i}
              style={{
                opacity: p,
                fontSize: isUnit ? `${unitScale}em` : undefined,
                whiteSpace: 'pre',
                transform: `translateY(${(1 - p) * 0.2}em)`,
                display: 'inline-block',
              }}
            >
              {ch}
            </span>
          );
        }
        const d = Number(ch);
        const k = digitIndex++;
        const s = spring({
          frame: frame - start - k * stagger,
          fps,
          durationInFrames: dur,
          config: {damping: 16, stiffness: 90, mass: 0.7},
        });
        const sPrev = spring({
          frame: frame - 1 - start - k * stagger,
          fps,
          durationInFrames: dur,
          config: {damping: 16, stiffness: 90, mass: 0.7},
        });
        const total = spins * 10 + d;
        const pos = s * total;
        const vel = Math.abs(s - sPrev) * total; // Ziffern pro Frame
        const blur = Math.min(12, vel * 5);
        const fid = `odo-${i}-${Math.round(blur * 4)}`;
        const appear = tween(frame, start + k * stagger - 2, 6, ease.out);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              height: `${lineH}em`,
              overflow: 'hidden',
              position: 'relative',
              opacity: appear,
            }}
          >
            {blur > 0.3 ? (
              <svg width="0" height="0" style={{position: 'absolute'}}>
                <filter id={fid} x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation={`0 ${blur}`} />
                </filter>
              </svg>
            ) : null}
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                transform: `translateY(${-pos * lineH}em)`,
                filter: blur > 0.3 ? `url(#${fid})` : undefined,
              }}
            >
              {Array.from({length: total + 1}, (_, n) => (
                <span key={n} style={{height: `${lineH}em`, display: 'block', textAlign: 'center'}}>
                  {n % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export const fmtDE = (n: number, digits = 0): string =>
  n.toLocaleString('de-DE', {minimumFractionDigits: digits, maximumFractionDigits: digits});
