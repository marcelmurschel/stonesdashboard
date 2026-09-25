import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';

/** Pulsierender Status-Punkt ("live", "Daten aktuell"). */
export const PulseDot: React.FC<{color?: string; size?: number}> = ({color = C.mint, size = 14}) => {
  const frame = useCurrentFrame();
  const t = (frame % 36) / 36;
  return (
    <span style={{position: 'relative', width: size, height: size, display: 'inline-block', flex: 'none'}}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          opacity: 0.5 * (1 - t),
          transform: `scale(${1 + t * 1.6})`,
        }}
      />
      <span style={{position: 'absolute', inset: 0, borderRadius: '50%', background: color}} />
    </span>
  );
};

/** Mono-Pille: Rubriken, Kalenderwochen, Datenbasis. */
export const Pill: React.FC<{
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'amber' | 'ghost' | 'paper';
  dot?: string | false;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, variant = 'outline', dot = false, size = 24, style}) => {
  const v = {
    solid: {background: C.violet, color: C.white, border: `2px solid ${C.violet}`},
    outline: {background: 'rgba(16,13,36,0.55)', color: C.lilac, border: `2px solid ${C.lineStrong}`},
    amber: {background: C.amber, color: C.ink, border: `2px solid ${C.amber}`},
    ghost: {background: 'rgba(255,255,255,0.08)', color: C.white, border: '2px solid rgba(255,255,255,0.14)'},
    paper: {background: C.paper, color: C.ink, border: `2px solid ${C.paper}`},
  }[variant];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.55,
        padding: `${size * 0.42}px ${size * 0.8}px ${size * 0.4}px`,
        borderRadius: 999,
        fontFamily: F.mono,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        backdropFilter: variant === 'outline' ? 'blur(8px)' : undefined,
        ...v,
        ...style,
      }}
    >
      {dot ? <PulseDot color={dot} size={size * 0.52} /> : null}
      {children}
    </div>
  );
};

/** Quellenangabe – bei Competitive Intelligence nie weglassen. */
export const SourceChip: React.FC<{
  text: string;
  start?: number;
  size?: number;
  label?: string;
  style?: React.CSSProperties;
}> = ({text, start = 0, size = 20, label = 'Quelle', style}) => {
  const frame = useCurrentFrame();
  const p = tween(frame, start, 16, ease.out);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: F.mono,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: C.mist,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <svg width={size * 0.95} height={size * 1.05} viewBox="0 0 20 22" style={{flex: 'none'}}>
        <ellipse cx="10" cy="4.5" rx="8" ry="3.2" fill="none" stroke={C.mist} strokeWidth="1.8" />
        <path d="M2 4.5v13c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-13" fill="none" stroke={C.mist} strokeWidth="1.8" />
        <path d="M2 11c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" fill="none" stroke={C.mist} strokeWidth="1.8" />
      </svg>
      <span style={{color: C.lilac, fontWeight: 700}}>{label}</span>
      <span>{text}</span>
    </div>
  );
};

/** Bewegungs-Badge für Charts: ▲ 3, ▼ 1, NEU, = */
export const MoveBadge: React.FC<{move: number | 'new' | null | undefined; size?: number}> = ({move, size = 26}) => {
  if (move === 'new') {
    return (
      <span
        style={{
          fontFamily: F.mono,
          fontWeight: 800,
          fontSize: size * 0.8,
          letterSpacing: '0.12em',
          color: C.ink,
          background: C.amber,
          padding: `${size * 0.22}px ${size * 0.4}px`,
          borderRadius: size * 0.3,
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        NEU
      </span>
    );
  }
  const n = typeof move === 'number' ? move : 0;
  const color = n > 0 ? C.mint : n < 0 ? C.coral : C.mist;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.2,
        fontFamily: F.mono,
        fontWeight: 800,
        fontSize: size,
        color,
        lineHeight: 1,
      }}
    >
      {n === 0 ? (
        <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 10 10">
          <rect x="1" y="3" width="8" height="1.6" rx="0.8" fill={color} />
          <rect x="1" y="5.6" width="8" height="1.6" rx="0.8" fill={color} />
        </svg>
      ) : (
        <svg
          width={size * 0.72}
          height={size * 0.72}
          viewBox="0 0 10 10"
          style={{transform: n < 0 ? 'rotate(180deg)' : undefined}}
        >
          <path d="M5 1 L9.2 8.4 L0.8 8.4 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth="1" />
        </svg>
      )}
      {n === 0 ? null : Math.abs(n)}
    </span>
  );
};
