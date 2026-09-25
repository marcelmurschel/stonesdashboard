import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';

/**
 * Maskierter Auftritt: Inhalt gleitet aus einer unsichtbaren Kante nach oben,
 * wird dabei scharf. Optionaler Abgang nach oben.
 */
export const Reveal: React.FC<{
  start: number;
  dur?: number;
  exit?: number;
  exitDur?: number;
  blur?: boolean;
  from?: 'bottom' | 'top';
  display?: 'block' | 'inline-block';
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  children: React.ReactNode;
}> = ({
  start,
  dur = 18,
  exit,
  exitDur = 12,
  blur = true,
  from = 'bottom',
  display = 'block',
  style,
  innerStyle,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = tween(frame, start, dur, ease.out);
  const q = exit === undefined ? 0 : tween(frame, exit, exitDur, ease.in);
  const dir = from === 'bottom' ? 1 : -1;
  const y = (1 - p) * 105 * dir - q * 105;
  const b = blur ? (1 - p) * 10 + q * 8 : 0;
  return (
    <div
      style={{
        display,
        overflow: 'hidden',
        // Luft für Ober-/Unterlängen, damit die Maske nichts abschneidet
        padding: '0.12em 0.06em 0.16em',
        margin: '-0.12em -0.06em -0.16em',
        ...style,
      }}
    >
      <div
        style={{
          transform: `translateY(${y}%)`,
          filter: b > 0.05 ? `blur(${b}px)` : undefined,
          willChange: 'transform',
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Mono-Label in Versalien – die "Datenstimme" des Kits. */
export const Label: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: number;
  spacing?: number;
  style?: React.CSSProperties;
}> = ({children, size = 26, color = C.lilac, weight = 600, spacing = 0.14, style}) => (
  <div
    style={{
      fontFamily: F.mono,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: `${spacing}em`,
      textTransform: 'uppercase',
      color,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Display-Schrift mit den Kit-Standards (fett, leicht schmal). */
export const Display: React.FC<{
  children: React.ReactNode;
  size: number;
  weight?: number;
  stretch?: number;
  color?: string;
  tracking?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({children, size, weight = 800, stretch = 82, color = C.white, tracking = -0.015, lineHeight = 0.95, style}) => (
  <div
    style={{
      fontFamily: F.display,
      fontSize: size,
      fontWeight: weight,
      fontStretch: `${stretch}%`,
      letterSpacing: `${tracking}em`,
      lineHeight,
      color,
      ...style,
    }}
  >
    {children}
  </div>
);
