import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CrocMark} from '../brand/CrocMark';
import {useFormat} from '../brand/format';
import {CLAMP, ease, pop, tween} from '../brand/motion';
import {C, F, PERSON} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {MarkedLine} from '../components/Highlight';
import {SafeZones, Sfx} from '../components/Kit';
import {Reveal} from '../components/Text';
import {ChompWipe} from '../transitions/Chomp';

export const outroSchema = z.object({
  lines: z.array(z.string()),
  ctas: z.array(z.string()),
  name: z.string(),
  handle: z.string(),
  closeWithChomp: z.boolean(),
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type OutroProps = z.infer<typeof outroSchema>;

export const outroDefaults: OutroProps = {
  lines: ['Mehr Daten', 'hinter dem *Hype*?'],
  ctas: ['Folgen', 'Speichern', 'Teilen'],
  name: PERSON.name,
  handle: '',
  closeWithChomp: true,
  sfx: true,
  showSafeZones: false,
};

const Icon: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  const k = kind.toLowerCase();
  if (k.startsWith('folg') || k.startsWith('follow') || k.startsWith('abo')) {
    return (
      <svg width={30} height={30} viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={3} strokeLinecap="round" />
      </svg>
    );
  }
  if (k.startsWith('speich') || k.startsWith('save') || k.startsWith('merk')) {
    return (
      <svg width={28} height={28} viewBox="0 0 24 24">
        <path d="M6 3h12v18l-6-4.5L6 21z" fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
      </svg>
    );
  }
  if (k.startsWith('teil') || k.startsWith('share')) {
    return (
      <svg width={28} height={28} viewBox="0 0 24 24">
        <path d="M4 20 L20 12 L4 4 L6.5 12 Z" fill="none" stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={26} height={26} viewBox="0 0 24 24">
      <path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** Abspann (4 s): Krokodil schnappt, Frage + Handlungsaufforderung, am Ende beißt es zu. */
export const Outro: React.FC<OutroProps & {length?: number}> = ({
  lines,
  ctas,
  name,
  handle,
  closeWithChomp,
  sfx,
  showSafeZones,
  length,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames: compDuration} = useVideoConfig();
  const durationInFrames = length ?? compDuration;
  const {W, isReel} = useFormat();
  const cw = isReel ? 560 : 440;
  const cy = isReel ? 330 : 120;

  const croc = pop(frame, fps, 0, {damping: 12, stiffness: 140});
  const open = interpolate(frame, [4, 12, 16, 19], [0, 1, 1, 0], {...CLAMP, easing: ease.inOut});
  const blink = interpolate(frame, [70, 73, 76], [0, 1, 0], CLAMP);
  const chompAt = durationInFrames - 18;

  return (
    <AbsoluteFill>
      <Backdrop glow="mint" />
      <div
        style={{
          position: 'absolute',
          left: W / 2 - cw / 2,
          top: cy,
          transform: `scale(${croc}) translateY(${Math.sin(frame / 12) * 5}px)`,
          transformOrigin: '50% 60%',
          filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))',
        }}
      >
        <CrocMark size={cw} open={open} bars={pop(frame, fps, 10)} blink={blink} look={3} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + cw / 2 + (isReel ? 90 : 40),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isReel ? 54 : 34,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 800,
            fontStretch: '80%',
            fontSize: isReel ? 118 : 92,
            lineHeight: 0.95,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
            color: C.white,
            textAlign: 'center',
          }}
        >
          {lines.map((l, i) => (
            <Reveal key={i} start={14 + i * 5} dur={18}>
              <MarkedLine text={l} markStart={32} />
            </Reveal>
          ))}
        </div>

        <div style={{display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', maxWidth: W - 120}}>
          {ctas.map((c, i) => {
            const p = pop(frame, fps, 40 + i * 5, {damping: 13, stiffness: 200});
            const primary = i === 0;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '20px 30px 20px 24px',
                  borderRadius: 999,
                  background: primary ? C.amber : 'rgba(255,255,255,0.07)',
                  border: `2px solid ${primary ? C.amber : C.lineStrong}`,
                  color: primary ? C.ink : C.white,
                  fontFamily: F.mono,
                  fontWeight: 800,
                  fontSize: isReel ? 30 : 26,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  transform: `scale(${p})`,
                  opacity: Math.min(1, p * 1.5),
                }}
              >
                <Icon kind={c} color={primary ? C.ink : C.mint} />
                {c}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            opacity: tween(frame, 52, 16, ease.out),
            transform: `translateY(${(1 - tween(frame, 52, 16, ease.out)) * 16}px)`,
          }}
        >
          <div style={{fontFamily: F.display, fontWeight: 700, fontStretch: '85%', fontSize: isReel ? 44 : 38, color: C.white}}>{name}</div>
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: isReel ? 26 : 22,
              letterSpacing: '0.14em',
              color: C.lilac,
              textTransform: handle ? 'none' : 'uppercase',
            }}
          >
            {handle || PERSON.role}
          </div>
        </div>
      </div>

      <Grain />
      {closeWithChomp ? <ChompWipe start={chompAt} dur={18} mode="close" /> : null}
      <SafeZones show={showSafeZones} />

      <Sfx enabled={sfx} at={0} name="pop" />
      <Sfx enabled={sfx} at={16} name="chomp" volume={0.6} />
      <Sfx enabled={sfx} at={14} name="whoosh" volume={0.5} />
      <Sfx enabled={sfx} at={34} name="blip" />
      {ctas.map((_, i) => (
        <Sfx key={i} enabled={sfx} at={40 + i * 5} name="pop" volume={0.6} />
      ))}
      {closeWithChomp ? <Sfx enabled={sfx} at={chompAt} name="whoosh" volume={0.6} /> : null}
      {closeWithChomp ? <Sfx enabled={sfx} at={chompAt + 7} name="chomp" /> : null}
    </AbsoluteFill>
  );
};
