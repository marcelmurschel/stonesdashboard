import React from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {seeded} from '../brand/motion';
import {C, F} from '../brand/tokens';

export type FootageProps = {
  /** Pfad in public/ (z. B. "footage/take-01.mp4") oder URL. Leer = Platzhalter. */
  src?: string;
  /** Start im Clip in Sekunden */
  trimStart?: number;
  muted?: boolean;
  /** Langsamer Push-in (1 = aus) – bringt Energie in statische Takes */
  push?: number;
  /** Länge der Szene in Frames (Standard: ganze Komposition) */
  length?: number;
};

const resolve = (src: string) => (src.startsWith('http') ? src : staticFile(src));

/** Talking-Head-Ebene: dein Clip oder – solange keiner da ist – ein Studio-Platzhalter. */
export const Footage: React.FC<FootageProps> = ({src, trimStart = 0, muted = false, push = 1.04, length}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const scale = 1 + (push - 1) * Math.min(1, frame / Math.max(1, length ?? durationInFrames));
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.ink}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        {src ? (
          <OffthreadVideo
            src={resolve(src)}
            muted={muted}
            trimBefore={Math.round(trimStart * fps)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <StudioPlaceholder />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Platzhalter im Stil eines Brettspiel-Creator-Sets: unscharfes Kallax-Regal
 * voller Spiele, warmes Licht, Silhouette mit Rim-Light.
 */
export const StudioPlaceholder: React.FC<{label?: boolean}> = ({label = true}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const rnd = seeded(0.4242);
  const cell = W * 0.3;
  const shelfX = W * 0.5 - cell * 2.1;
  const shelfY = H * 0.06;
  const colors = ['#E0582F', '#2F6BE0', '#F2B233', '#138C80', '#C23A48', '#8B3FB0', '#EDE6D6', '#3D5A80', '#6FBF73', '#FF8FAB'];
  const cubbies: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = shelfX + c * (cell + 18);
      const y = shelfY + r * (cell + 18);
      const boxes: React.ReactNode[] = [];
      const vertical = rnd() > 0.45;
      if (vertical) {
        let bx = 10;
        while (bx < cell - 30) {
          const bw = 26 + rnd() * 46;
          const bh = cell * (0.62 + rnd() * 0.33);
          boxes.push(
            <div
              key={bx}
              style={{
                position: 'absolute',
                left: bx,
                bottom: 8,
                width: Math.min(bw, cell - bx - 10),
                height: bh,
                background: colors[Math.floor(rnd() * colors.length)],
                borderRadius: 3,
              }}
            />,
          );
          bx += bw + 4;
        }
      } else {
        let by = 8;
        while (by < cell * 0.8) {
          const bh = 22 + rnd() * 40;
          boxes.push(
            <div
              key={by}
              style={{
                position: 'absolute',
                left: 10 + rnd() * 18,
                right: 10 + rnd() * 18,
                bottom: by,
                height: bh,
                background: colors[Math.floor(rnd() * colors.length)],
                borderRadius: 3,
              }}
            />,
          );
          by += bh + 3;
        }
      }
      cubbies.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: cell,
            height: cell,
            background: '#2A2240',
            boxShadow: 'inset 0 18px 30px rgba(0,0,0,0.45)',
            overflow: 'hidden',
          }}
        >
          {boxes}
        </div>,
      );
    }
  }

  const t = frame / 30;
  const breathe = 1 + Math.sin(t * 1.6) * 0.006;
  const sway = Math.sin(t * 0.9) * 6;
  const headX = W / 2 + sway;
  const headY = H * 0.43;
  const headW = W * 0.25;
  const headH = headW * 1.24;
  const shoulderY = headY + headH * 0.78;

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #221A38 0%, #150F26 60%, #0E0A1A 100%)'}}>
      {/* Regal (unscharf, weit hinten) */}
      <AbsoluteFill style={{filter: 'blur(14px) saturate(0.9)', opacity: 0.85}}>
        <div
          style={{
            position: 'absolute',
            left: shelfX - 18,
            top: shelfY - 18,
            width: cell * 4 + 18 * 5,
            height: cell * 4 + 18 * 5,
            background: '#D9D0BE',
          }}
        />
        {cubbies}
        {/* Lichterkette */}
        {Array.from({length: 14}, (_, i) => {
          const x = shelfX + (i / 13) * (cell * 4 + 60);
          const y = shelfY + cell * 1.05 + Math.sin((i / 13) * Math.PI) * 60;
          const tw = 0.7 + 0.3 * Math.sin(t * 2 + i * 1.7);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: '#FFD27A',
                boxShadow: `0 0 40px 18px rgba(255,190,90,${0.35 * tw})`,
                opacity: tw,
              }}
            />
          );
        })}
      </AbsoluteFill>
      {/* Licht & Tiefe */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 40% at 78% 18%, rgba(255,190,110,0.22), rgba(0,0,0,0) 70%),
            linear-gradient(180deg, rgba(16,13,36,0.35) 0%, rgba(16,13,36,0.15) 45%, rgba(16,13,36,0.7) 100%)`,
        }}
      />
      {/* Silhouette */}
      <AbsoluteFill style={{transform: `scale(${breathe})`, transformOrigin: '50% 100%'}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <defs>
            <linearGradient id="ph-body" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2B2450" />
              <stop offset="0.5" stopColor="#1B1636" />
              <stop offset="1" stopColor="#141029" />
            </linearGradient>
            <radialGradient id="ph-face" cx="0.38" cy="0.42" r="0.7">
              <stop offset="0" stopColor="#3A3166" />
              <stop offset="1" stopColor="#1C1738" />
            </radialGradient>
            <filter id="ph-rim" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx={-7} dy={-3} stdDeviation={6} floodColor="#FFC24B" floodOpacity={0.45} />
              <feDropShadow dx={8} dy={-4} stdDeviation={9} floodColor="#8D86EC" floodOpacity={0.7} />
            </filter>
          </defs>
          <g filter="url(#ph-rim)">
            <path
              d={`M ${headX - W * 0.47} ${H + 20}
                  C ${headX - W * 0.46} ${shoulderY + H * 0.06} ${headX - W * 0.38} ${shoulderY} ${headX - W * 0.2} ${shoulderY - H * 0.01}
                  L ${headX - W * 0.075} ${shoulderY - H * 0.03}
                  L ${headX - W * 0.07} ${headY + headH * 0.3}
                  L ${headX + W * 0.07} ${headY + headH * 0.3}
                  L ${headX + W * 0.075} ${shoulderY - H * 0.03}
                  L ${headX + W * 0.2} ${shoulderY - H * 0.01}
                  C ${headX + W * 0.38} ${shoulderY} ${headX + W * 0.46} ${shoulderY + H * 0.06} ${headX + W * 0.47} ${H + 20} Z`}
              fill="url(#ph-body)"
            />
            <ellipse cx={headX} cy={headY} rx={headW / 2} ry={headH / 2} fill="url(#ph-face)" />

          </g>
        </svg>
        {label ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: H * 0.055,
              textAlign: 'center',
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: W * 0.022,
              letterSpacing: '0.18em',
              color: 'rgba(203,198,246,0.45)',
            }}
          >
            PLATZHALTER · DEIN TALKING-HEAD-CLIP
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
