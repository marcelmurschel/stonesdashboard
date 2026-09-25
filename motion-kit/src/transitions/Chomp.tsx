import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {seeded} from '../brand/motion';
import {C} from '../brand/tokens';

/**
 * Die Signatur-Blende: Zwei Krokodilkiefer schnappen über dem Bild zu und
 * öffnen sich zur nächsten Szene. Zähne verzahnen sich, beim Biss wackelt
 * das Bild kurz.
 *
 * close: 0 = Kiefer außerhalb des Bildes, 1 = zugebissen.
 */
export const Jaws: React.FC<{close: number; hinge?: number; shake?: number; eye?: boolean; blur?: number}> = ({
  close,
  hinge = 0,
  shake = 0,
  eye = true,
  blur = 0,
}) => {
  const {width: W, height: H} = useVideoConfig();
  const frame = useCurrentFrame();
  const tooth = Math.round(W / 9);
  const toothH = tooth * 0.82;
  const mid = H / 2;
  const yU = -toothH - H * 0.08 + (mid + toothH * 0.12 + H * 0.08) * close; // Unterkante Oberkiefer
  const yL = H + toothH + H * 0.08 - (H - mid + toothH * 0.12 + H * 0.08) * close; // Oberkante Unterkiefer
  const r = seeded(frame + 0.5);
  const sx = shake ? (r() - 0.5) * 2 * shake : 0;
  const sy = shake ? (r() - 0.5) * 2 * shake : 0;
  const angle = hinge * 16;

  const upperTeeth: string[] = [];
  for (let x = tooth / 2; x < W + tooth; x += tooth) {
    upperTeeth.push(`M ${x - tooth * 0.42} ${yU - 2} L ${x + tooth * 0.42} ${yU - 2} L ${x} ${yU + toothH} Z`);
  }
  const lowerTeeth: string[] = [];
  for (let x = 0; x < W + tooth; x += tooth) {
    lowerTeeth.push(`M ${x - tooth * 0.4} ${yL + 2} L ${x + tooth * 0.4} ${yL + 2} L ${x} ${yL - toothH * 0.92} Z`);
  }

  if (close <= 0.001) return null;

  return (
    <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`, pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          {blur > 0.5 ? (
            <filter id="jaw-mb" filterUnits="userSpaceOnUse" x={-W * 0.3} y={-H * 0.3} width={W * 1.6} height={H * 1.6}>
              <feGaussianBlur stdDeviation={`0 ${blur}`} />
            </filter>
          ) : null}
          <pattern id="jaw-scales" width={120} height={104} patternUnits="userSpaceOnUse">
            <path
              d="M30 0 L90 0 L120 52 L90 104 L30 104 L0 52 Z"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={3}
            />
          </pattern>
          <linearGradient id="jaw-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6C65C8" />
            <stop offset="0.85" stopColor={C.violet} />
            <stop offset="1" stopColor={C.violetDeep} />
          </linearGradient>
          <linearGradient id="jaw-down" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#6C65C8" />
            <stop offset="0.85" stopColor="#7770D6" />
            <stop offset="1" stopColor={C.violetDeep} />
          </linearGradient>
        </defs>

        {/* Mundraum zwischen den Zähnen (nur kurz vor dem Biss sichtbar) */}
        {close > 0.8 ? (
          <rect
            x={0}
            y={yU - 4}
            width={W}
            height={Math.max(0, yL - yU + 8)}
            fill={C.ink}
            opacity={Math.min(1, (close - 0.8) / 0.2)}
          />
        ) : null}

        {/* Unterkiefer */}
        <g transform={`rotate(${angle} 0 ${yL})`} filter={blur > 0.5 ? 'url(#jaw-mb)' : undefined}>
          <rect x={-W * 0.2} y={yL} width={W * 1.4} height={H} fill="url(#jaw-down)" />
          <rect x={-W * 0.2} y={yL} width={W * 1.4} height={H} fill="url(#jaw-scales)" />
          <rect x={-W * 0.2} y={yL} width={W * 1.4} height={14} fill={C.violetDeep} />
          <path d={lowerTeeth.join(' ')} fill={C.paper} />
        </g>

        {/* Oberkiefer */}
        <g transform={`rotate(${-angle} 0 ${yU})`} filter={blur > 0.5 ? 'url(#jaw-mb)' : undefined}>
          <rect x={-W * 0.2} y={yU - H} width={W * 1.4} height={H} fill="url(#jaw-up)" />
          <rect x={-W * 0.2} y={yU - H} width={W * 1.4} height={H} fill="url(#jaw-scales)" />
          <rect x={-W * 0.2} y={yU - 14} width={W * 1.4} height={14} fill={C.violetDeep} />
          <path d={upperTeeth.join(' ')} fill={C.paper} />
          {eye ? (
            <g transform={`translate(${W * 0.2} ${yU - H * 0.2})`}>
              <circle r={W * 0.085} fill="#6C65C8" />
              <circle r={W * 0.058} fill={C.white} />
              <circle cx={W * 0.008} r={W * 0.042} fill={C.amber} />
              <ellipse cx={W * 0.01} rx={W * 0.012} ry={W * 0.034} fill={C.ink} />
              <circle cx={W * 0.022} cy={-W * 0.02} r={W * 0.009} fill={C.white} />
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Bewegungsunschärfe aus der Geschwindigkeit der Kiefer (px pro Frame). */
const jawBlur = (p: number, pPrev: number, H: number) => {
  const v = Math.abs(chompCurve(p).close - chompCurve(Math.max(0, pPrev)).close) * H * 0.62;
  return Math.min(26, v * 0.3);
};

type ChompProps = {sfx?: boolean};

/** Zeitverlauf: 0–0.44 zuschnappen, 0.44–0.56 Biss + Wackeln, danach öffnen. */
export const chompCurve = (p: number) => {
  if (p < 0.44) return {close: Math.pow(p / 0.44, 2.4), hinge: 0, shake: 0};
  if (p < 0.56) return {close: 1, hinge: 0, shake: 7 * (1 - (p - 0.44) / 0.12)};
  const t = (p - 0.56) / 0.44;
  const o = 1 - Math.pow(1 - t, 3);
  return {close: 1 - o, hinge: o * 1.2, shake: 0};
};

const ChompPresentation: React.FC<TransitionPresentationComponentProps<ChompProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  presentationDurationInFrames,
  passedProps,
}) => {
  const {height} = useVideoConfig();
  const p = presentationProgress;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const {close, hinge, shake} = chompCurve(p);
  const d = presentationDurationInFrames;
  const blur = jawBlur(p, p - 1 / d, height);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: p >= 0.5 ? 1 : 0}}>{children}</AbsoluteFill>
      <Jaws close={close} hinge={hinge} shake={shake} blur={blur} />
      {passedProps.sfx === false ? null : (
        <>
          <Html5Audio src={staticFile('sfx/whoosh.wav')} volume={0.7} />
          <Sequence from={Math.max(0, Math.round(d * 0.4))} layout="none">
            <Html5Audio src={staticFile('sfx/chomp.wav')} volume={0.9} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};

export const chomp = (props: ChompProps = {}): TransitionPresentation<ChompProps> => ({
  component: ChompPresentation,
  props,
});

/**
 * Freistehende Variante (ohne TransitionSeries), z. B. am Ende eines Clips:
 * `mode="close"` beißt zu und bleibt zu, `mode="open"` öffnet nur.
 */
export const ChompWipe: React.FC<{start: number; dur?: number; mode?: 'full' | 'close' | 'open'}> = ({
  start,
  dur = 20,
  mode = 'full',
}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  const t = Math.max(0, Math.min(1, (frame - start) / dur));
  if (frame < start) return mode === 'open' ? <Jaws close={1} /> : null;
  const map = (x: number) => (mode === 'open' ? 0.56 + x * 0.44 : mode === 'close' ? Math.min(x, 0.56) : x);
  let v = chompCurve(map(t));
  if (mode === 'close' && t >= 0.56) v = {close: 1, hinge: 0, shake: 0};
  const blur = jawBlur(map(t), map(Math.max(0, t - 1 / dur)), height);
  return <Jaws close={v.close} hinge={v.hinge} shake={v.shake} blur={blur} />;
};
