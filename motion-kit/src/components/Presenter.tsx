import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ease, pop, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Footage} from './Footage';

/**
 * Du im Kreis: bleibt während Vollbild-Grafiken sichtbar, damit die
 * Person im Zentrum bleibt. Der Ring "spricht" leicht mit.
 */
export const PresenterBubble: React.FC<{
  src?: string;
  trimStart?: number;
  size?: number;
  x: number;
  y: number;
  start?: number;
  exit?: number;
  name?: string;
  /** Wo im Quellbild das Gesicht sitzt (0 = oben, 1 = unten) */
  focusY?: number;
  muted?: boolean;
}> = ({src, trimStart, size = 250, x, y, start = 0, exit, name, focusY = 0.44, muted = true}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const s = pop(frame, fps, start, {damping: 13, stiffness: 150});
  const out = exit === undefined ? 0 : tween(frame, exit, 10, ease.in);
  const scale = s * (1 - out);
  if (scale <= 0.001) return null;

  // Ausschnitt: Gesicht in die Kreismitte, Zoom so, dass Kopf + Schultern passen
  const zoom = (size * 2.3) / H;
  const tx = size / 2 - (W / 2) * zoom;
  const ty = size / 2 - H * focusY * zoom;

  const talk = 0.5 + 0.5 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37 + 1.3);
  const ring = 6 + talk * 5;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -ring - 8,
          borderRadius: '50%',
          background: `conic-gradient(from ${frame * 2}deg, ${C.violetHi}, ${C.mint}, ${C.violet}, ${C.violetHi})`,
          opacity: 0.9,
          filter: 'blur(1px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          background: C.ink,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          background: C.ink2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: W,
            height: H,
            transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <Footage src={src} trimStart={trimStart} muted={muted} push={1} />
        </div>
      </div>
      {name ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: size + 18,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: C.violet,
            color: C.white,
            borderRadius: 999,
            padding: '9px 18px 8px',
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <span style={{display: 'inline-flex', gap: 3, alignItems: 'flex-end', height: 16}}>
            {[0, 1, 2].map((i) => {
              const h = 5 + Math.abs(Math.sin(frame * (0.5 + i * 0.23) + i)) * 11;
              return <span key={i} style={{width: 4, height: h, background: C.mint, borderRadius: 2}} />;
            })}
          </span>
          {name}
        </div>
      ) : null}
    </div>
  );
};
