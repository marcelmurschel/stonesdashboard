import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import sample from '../../data/hook-beispiel.json';
import {useFormat} from '../brand/format';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Pill} from '../components/Chips';
import {Footage} from '../components/Footage';
import {MarkedLine} from '../components/Highlight';
import {SafeZones, Sfx} from '../components/Kit';
import {Reveal} from '../components/Text';

export const hookSchema = z.object({
  eyebrow: z.string(),
  /** Eine Zeile pro Eintrag. *Wort* = Textmarker */
  lines: z.array(z.string()),
  receipt: z.string(),
  footage: z.string(),
  transparent: z.boolean(),
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type HookProps = z.infer<typeof hookSchema>;

export const hookDefaults: HookProps = hookSchema.parse({
  ...sample,
  footage: '',
  transparent: false,
  sfx: true,
  showSafeZones: false,
});

/**
 * Hook für die ersten 2–4 Sekunden: Rubrik, dreizeilige Headline mit
 * Textmarker und ein "Beleg"-Chip mit der Datenbasis.
 */
export const Hook: React.FC<HookProps & {length?: number}> = ({
  eyebrow,
  lines,
  receipt,
  footage,
  transparent,
  sfx,
  showSafeZones,
  length,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {isReel, safe, innerW} = useFormat();
  const exit = (length ?? durationInFrames) - 14;
  const size = isReel ? (lines.some((l) => l.replace(/\*/g, '').length > 15) ? 112 : 128) : 104;
  const lineStart = 8;
  const markStart = lineStart + lines.length * 5 + 8;
  const receiptStart = markStart + 6;
  const scrim = tween(frame, 0, 12, ease.soft) * (1 - tween(frame, exit + 4, 10, ease.in));

  return (
    <AbsoluteFill>
      {transparent ? null : <Footage src={footage || undefined} push={1.06} />}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(16,13,36,0.88) 0%, rgba(16,13,36,0.62) ${isReel ? 32 : 40}%, rgba(16,13,36,0) ${
            isReel ? 58 : 75
          }%)`,
          opacity: scrim,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: safe.top + (isReel ? 10 : 0),
          width: innerW,
          display: 'flex',
          flexDirection: 'column',
          gap: isReel ? 30 : 22,
        }}
      >
        <Reveal start={2} dur={14} exit={exit + 6} display="inline-block" style={{alignSelf: 'flex-start'}}>
          <Pill variant="solid" dot={C.mint} size={isReel ? 27 : 22}>
            {eyebrow}
          </Pill>
        </Reveal>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 800,
            fontStretch: '78%',
            fontSize: size,
            lineHeight: 0.93,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
            color: C.white,
            textShadow: '0 6px 30px rgba(0,0,0,0.35)',
          }}
        >
          {lines.map((l, i) => (
            <Reveal key={i} start={lineStart + i * 5} dur={18} exit={exit + i * 2}>
              <MarkedLine text={l} markStart={markStart} />
            </Reveal>
          ))}
        </div>
        <Reveal start={receiptStart} dur={16} exit={exit + 8} display="inline-block" style={{alignSelf: 'flex-start'}}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 22px 13px 18px',
              borderRadius: 16,
              background: 'rgba(16,13,36,0.72)',
              border: `2px solid ${C.lineStrong}`,
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: isReel ? 28 : 23,
              letterSpacing: '0.04em',
              color: C.lilac,
            }}
          >
            <svg width={26} height={26} viewBox="0 0 26 26">
              <rect x="2" y="14" width="5" height="10" rx="1.5" fill={C.mint} />
              <rect x="10.5" y="8" width="5" height="16" rx="1.5" fill={C.mint} />
              <rect x="19" y="2" width="5" height="22" rx="1.5" fill={C.mint} />
            </svg>
            {receipt}
          </div>
        </Reveal>
      </div>

      <SafeZones show={showSafeZones} />
      <Sfx enabled={sfx} at={0} name="riser" volume={0.35} />
      <Sfx enabled={sfx} at={lineStart} name="whoosh" volume={0.6} />
      <Sfx enabled={sfx} at={markStart + 2} name="blip" />
      <Sfx enabled={sfx} at={receiptStart} name="tick" />
      <Sfx enabled={sfx} at={exit} name="whoosh-soft" volume={0.5} />
    </AbsoluteFill>
  );
};
