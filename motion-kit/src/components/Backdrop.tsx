import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../brand/tokens';

/**
 * "Night Board": tiefes Violett, ein feines Spielbrett-Raster, zwei
 * langsam wandernde Lichtflecken und eine Vignette. Lebt leicht mit,
 * ohne vom Inhalt abzulenken.
 */
export const Backdrop: React.FC<{
  grid?: boolean;
  glow?: 'violet' | 'amber' | 'mint';
  intensity?: number;
  children?: React.ReactNode;
}> = ({grid = true, glow = 'violet', intensity = 1, children}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const t = frame / 30;
  const g1x = 22 + Math.sin(t * 0.35) * 6;
  const g1y = 18 + Math.cos(t * 0.27) * 4;
  const g2x = 82 + Math.cos(t * 0.3) * 5;
  const g2y = 84 + Math.sin(t * 0.22) * 5;
  const second =
    glow === 'amber' ? 'rgba(255,194,75,0.16)' : glow === 'mint' ? 'rgba(67,230,168,0.13)' : 'rgba(67,230,168,0.07)';
  const cell = 90;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at ${g1x}% ${g1y}%, rgba(95,88,177,${0.55 * intensity}) 0%, rgba(95,88,177,0) 70%),
            radial-gradient(ellipse 60% 40% at ${g2x}% ${g2y}%, ${second} 0%, rgba(0,0,0,0) 70%),
            linear-gradient(180deg, ${C.ink} 0%, #120F2B 55%, #0C0A1C 100%)`,
        }}
      />
      {grid ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.9}}>
          <defs>
            <pattern id="board-grid" width={cell} height={cell} patternUnits="userSpaceOnUse" x={(W % cell) / 2} y={0}>
              <path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke="rgba(203,198,246,0.055)" strokeWidth={1.5} />
            </pattern>
            <pattern
              id="board-grid-major"
              width={cell * 3}
              height={cell * 3}
              patternUnits="userSpaceOnUse"
              x={(W % cell) / 2}
              y={0}
            >
              <circle cx={0} cy={0} r={2.2} fill="rgba(203,198,246,0.16)" />
            </pattern>
            <radialGradient id="grid-fade" cx="50%" cy="45%" r="70%">
              <stop offset="0" stopColor="#fff" stopOpacity={1} />
              <stop offset="1" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="grid-mask">
              <rect width={W} height={H} fill="url(#grid-fade)" />
            </mask>
          </defs>
          <g mask="url(#grid-mask)">
            <rect width={W} height={H} fill="url(#board-grid)" />
            <rect width={W} height={H} fill="url(#board-grid-major)" />
          </g>
        </svg>
      ) : null}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(4,3,12,0.55) 100%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** Feines, animiertes Filmkorn – macht Flächen hochwertiger. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const seed = frame % 12;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'overlay', opacity}}>
      <svg width={W} height={H}>
        <filter id={`grain-${seed}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
