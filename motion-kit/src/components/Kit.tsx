import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useFormat} from '../brand/format';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Meeple} from './Meeple';

export type SfxName =
  | 'whoosh'
  | 'whoosh-soft'
  | 'chomp'
  | 'tick'
  | 'pop'
  | 'card'
  | 'impact'
  | 'riser'
  | 'ding'
  | 'blip';

/** Soundeffekt an Frame `at`. Über `enabled` global abschaltbar (z. B. für Alpha-Exporte). */
export const Sfx: React.FC<{at: number; name: SfxName; volume?: number; enabled?: boolean}> = ({
  at,
  name,
  volume = 1,
  enabled = true,
}) => {
  if (!enabled || at < 0) return null;
  return (
    <Sequence from={Math.round(at)} layout="none" name={`sfx:${name}`}>
      <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};

/** Hilfslinien für die Reels-Oberfläche (nur zur Kontrolle im Studio). */
export const SafeZones: React.FC<{show?: boolean}> = ({show = false}) => {
  const {W, H, isReel, safe} = useFormat();
  if (!show) return null;
  const tint = 'rgba(255, 70, 90, 0.16)';
  const label: React.CSSProperties = {
    position: 'absolute',
    fontFamily: F.mono,
    fontSize: 20,
    letterSpacing: '0.12em',
    color: 'rgba(255,140,150,0.9)',
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {isReel ? (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: W, height: safe.top, background: tint}} />
          <div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: safe.bottom, background: tint}} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 1000,
              width: safe.rightLow,
              height: H - 1000 - safe.bottom,
              background: tint,
            }}
          />
          <div style={{...label, left: 24, top: 24}}>REELS-UI · OBEN</div>
          <div style={{...label, left: 24, bottom: 24}}>CAPTION · USERNAME · AUDIO</div>
          <div style={{...label, right: 12, top: 1010, writingMode: 'vertical-rl'}}>BUTTONS</div>
        </>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: safe.top,
          width: W - safe.left - safe.right,
          height: H - safe.top - safe.bottom,
          border: '2px dashed rgba(255,140,150,0.6)',
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Score-Track wie auf dem Spielbrett: Felder für jeden Chart-Platz,
 * eine Meeple-Figur hüpft zum aktuellen Feld.
 */
export const ScoreTrack: React.FC<{
  labels: string[];
  /** Aktueller Index als Kommazahl (0 … n-1), wird zwischen Feldern animiert */
  position: number;
  cell?: number;
  gap?: number;
  start?: number;
}> = ({labels, position, cell = 64, gap = 14, start = 0}) => {
  const frame = useCurrentFrame();
  const n = labels.length;
  const appear = (i: number) => tween(frame, start + i * 3, 14, ease.out);
  const idx = Math.max(0, Math.min(n - 1, position));
  const base = Math.floor(idx);
  const frac = idx - base;
  const x = (base + frac) * (cell + gap) + cell / 2;
  const hop = Math.sin(frac * Math.PI) * cell * 0.9;
  const trackIn = tween(frame, start + 4, 16, ease.out);
  return (
    <div style={{position: 'relative', width: n * cell + (n - 1) * gap, height: cell}}>
      <div
        style={{
          position: 'absolute',
          left: cell / 2,
          top: cell / 2 - 2,
          height: 4,
          width: (n - 1) * (cell + gap) * trackIn,
          background: C.lineStrong,
          borderRadius: 2,
        }}
      />
      {labels.map((l, i) => {
        const visited = idx >= i - 0.02;
        const current = Math.abs(idx - i) < 0.5;
        const a = appear(i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * (cell + gap),
              top: 0,
              width: cell,
              height: cell,
              borderRadius: cell * 0.22,
              background: current ? C.amber : visited ? C.violet : C.ink2,
              border: `3px solid ${current ? C.amber : visited ? C.violetHi : C.lineStrong}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.mono,
              fontWeight: 800,
              fontSize: cell * 0.36,
              color: current ? C.ink : visited ? C.white : C.mist,
              transform: `scale(${a}) translateY(${(1 - a) * 20}px)`,
              opacity: a,
              boxShadow: current ? `0 0 30px rgba(255,194,75,0.45)` : undefined,
            }}
          >
            {l}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: x - cell * 0.3,
          top: -cell * 0.78 - hop,
          opacity: trackIn,
          filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.45))',
        }}
      >
        <Meeple size={cell * 0.6} color={C.mint} />
      </div>
    </div>
  );
};
