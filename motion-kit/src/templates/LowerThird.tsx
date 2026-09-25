import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CrocMark} from '../brand/CrocMark';
import {useFormat} from '../brand/format';
import {ease, pop, tween} from '../brand/motion';
import {C, F, PERSON} from '../brand/tokens';
import {Footage} from '../components/Footage';
import {PulseDot} from '../components/Chips';
import {SafeZones, Sfx} from '../components/Kit';

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  industry: z.string(),
  footage: z.string(),
  /** true = nur die Grafik mit Alpha-Kanal (für CapCut/Premiere) */
  transparent: z.boolean(),
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaults: LowerThirdProps = {
  name: PERSON.name,
  role: PERSON.role,
  industry: PERSON.industry,
  footage: '',
  transparent: false,
  sfx: true,
  showSafeZones: false,
};

/** Wischt eine Fläche von links auf (bzw. beim Abgang nach links zu). */
const wipe = (frame: number, start: number, out: number, dur = 14, outDur = 10) => {
  const a = tween(frame, start, dur, ease.out);
  const b = tween(frame, out, outDur, ease.in);
  return {a, b, clip: `inset(-4px ${100 - a * 100 + b * 0}% -4px ${b * 100}%)`};
};

/**
 * Bauchbinde: Krokodil-Badge, Name auf heller Fläche, Rolle auf Lila,
 * darunter die Branche mit Live-Punkt. Ab Frame `durationInFrames - 26`
 * räumt sie sich selbst wieder ab.
 */
export const LowerThird: React.FC<LowerThirdProps & {length?: number}> = ({
  name,
  role,
  industry,
  footage,
  transparent,
  sfx,
  showSafeZones,
  length,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const {H, isReel, safe} = useFormat();

  const out = (length ?? durationInFrames) - 26;
  const x = safe.left;
  const y = isReel ? 1196 : H - 360;
  const badge = 132;

  const b = pop(frame, fps, 2, {damping: 11, stiffness: 190});
  const bOut = tween(frame, out + 12, 10, ease.in);
  const nameW = wipe(frame, 6, out + 6);
  const roleW = wipe(frame, 11, out + 3);
  const indA = tween(frame, 18, 14, ease.out) * (1 - tween(frame, out, 8, ease.in));
  const nameText = tween(frame, 9, 16, ease.out);
  const roleText = tween(frame, 14, 16, ease.out);
  const accent = tween(frame, 12, 18, ease.out) * (1 - tween(frame, out + 4, 8, ease.in));

  return (
    <AbsoluteFill>
      {transparent ? null : <Footage src={footage || undefined} />}
      {transparent ? null : (
        <AbsoluteFill
          style={{
            background: 'linear-gradient(180deg, rgba(16,13,36,0) 50%, rgba(16,13,36,0.55) 100%)',
          }}
        />
      )}

      <div style={{position: 'absolute', left: x, top: y}}>
        {/* Badge */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: badge,
            height: badge,
            borderRadius: 34,
            background: C.violet,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${b * (1 - bOut)}) rotate(${(1 - b) * -14}deg)`,
            boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          }}
        >
          <CrocMark size={104} variant="mono" monoCut={C.violet} bars={Math.min(1, b)} />
        </div>

        {/* Name */}
        <div
          style={{
            position: 'absolute',
            left: badge + 14,
            top: 0,
            height: 92,
            background: C.paper,
            borderRadius: 18,
            padding: '0 34px 0 30px',
            display: 'flex',
            alignItems: 'center',
            clipPath: nameW.clip,
            boxShadow: '0 18px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 8,
              background: C.amber,
              transform: `scaleY(${accent})`,
            }}
          />
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 800,
              fontStretch: '82%',
              fontSize: 68,
              letterSpacing: '-0.01em',
              color: C.ink,
              whiteSpace: 'nowrap',
              transform: `translateY(${(1 - nameText) * 60}px)`,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
        </div>

        {/* Rolle */}
        <div
          style={{
            position: 'absolute',
            left: badge + 14,
            top: 92 + 10,
            height: 62,
            background: C.violet,
            borderRadius: 14,
            padding: '0 26px',
            display: 'flex',
            alignItems: 'center',
            clipPath: roleW.clip,
            overflow: 'hidden',
            boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 27,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.white,
              whiteSpace: 'nowrap',
              transform: `translateY(${(1 - roleText) * 40}px)`,
            }}
          >
            {role}
          </div>
        </div>

        {/* Branche */}
        <div
          style={{
            position: 'absolute',
            left: badge + 18,
            top: 92 + 10 + 62 + 22,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: indA,
            transform: `translateX(${(1 - indA) * -20}px)`,
            fontFamily: F.mono,
            fontWeight: 600,
            fontSize: 25,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.paper,
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            whiteSpace: 'nowrap',
          }}
        >
          <PulseDot color={C.mint} size={13} />
          {industry}
        </div>
      </div>

      <SafeZones show={showSafeZones} />
      <Sfx enabled={sfx} at={2} name="pop" />
      <Sfx enabled={sfx} at={6} name="whoosh-soft" volume={0.7} />
      <Sfx enabled={sfx} at={18} name="blip" />
      <Sfx enabled={sfx} at={out} name="whoosh-soft" volume={0.5} />
    </AbsoluteFill>
  );
};
