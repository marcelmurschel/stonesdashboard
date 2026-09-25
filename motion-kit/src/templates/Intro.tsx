import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CrocMark} from '../brand/CrocMark';
import {useFormat} from '../brand/format';
import {CLAMP, ease, pop, seeded, tween} from '../brand/motion';
import {C, F, PERSON} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {SafeZones, Sfx} from '../components/Kit';
import {Reveal} from '../components/Text';

export const introSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type IntroProps = z.infer<typeof introSchema>;

export const introDefaults: IntroProps = {
  name: PERSON.name,
  tagline: PERSON.tagline,
  sfx: true,
  showSafeZones: false,
};

// Taktung (Frames @ 30 fps)
const T = {
  line: 2,
  bars: 6,
  rise: 12,
  open: 30,
  chomp: 38,
  name: 44,
  tag: 56,
  blink: 74,
};

/**
 * Logo-Sting (3 s): Die Rückenschuppen tauchen als Balkendiagramm auf,
 * das Krokodil taucht darunter auf, reißt das Maul auf – und schnappt zu.
 * Danach steht der Name.
 */
export const Intro: React.FC<IntroProps> = ({name, tagline, sfx, showSafeZones}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, isReel} = useFormat();

  const cw = isReel ? 780 : 600;
  const ch = cw / 2;
  const cx = W / 2 - cw / 2;
  const cy = isReel ? 520 : 230;
  const waterY = cy + ch * 0.93;

  // Auftauchen
  const rise = tween(frame, T.rise, 20, ease.out);
  const riseY = (1 - rise) * ch * 0.62;
  const bars = pop(frame, fps, T.bars, {damping: 11, stiffness: 180});
  const lineIn = tween(frame, T.line, 14, ease.out);
  const lineOut = tween(frame, T.open, 10, ease.in);

  // Maul: aufreißen, zuschnappen
  const openAmt =
    frame < T.chomp
      ? tween(frame, T.open, 8, ease.out)
      : 1 - tween(frame, T.chomp, 3, ease.in);
  const snap = frame >= T.chomp + 3 ? Math.max(0, 1 - (frame - T.chomp - 3) / 10) : 0;
  const squash = 1 - Math.sin(Math.min(1, (frame - T.chomp - 3) / 8) * Math.PI) * 0.05 * (frame >= T.chomp + 3 ? 1 : 0);
  const rnd = seeded(frame + 0.1);
  const shakeX = snap > 0 ? (rnd() - 0.5) * 16 * snap : 0;
  const shakeY = snap > 0 ? (rnd() - 0.5) * 12 * snap : 0;

  const blink = interpolate(frame, [T.blink, T.blink + 3, T.blink + 6], [0, 1, 0], CLAMP);
  const float = Math.sin(frame / 14) * 4 * tween(frame, T.name, 20, ease.soft);

  // Partikel beim Biss
  const burstT = frame - (T.chomp + 3);
  const particles =
    burstT >= 0 && burstT < 26
      ? Array.from({length: 16}, (_, i) => {
          const pr = seeded(i + 0.77);
          const ang = -Math.PI * (0.05 + pr() * 0.9) + (pr() > 0.5 ? 0 : Math.PI * 0.1);
          const speed = 14 + pr() * 22;
          const t = burstT;
          const px = Math.cos(ang) * speed * t;
          const py = Math.sin(ang) * speed * t + 0.9 * t * t;
          const kind = i % 3;
          const size = 10 + pr() * 14;
          const col = [C.mint, C.amber, C.lilac][i % 3];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx + cw * 0.9 + px,
                top: cy + ch * 0.62 + py,
                width: size,
                height: size,
                background: col,
                borderRadius: kind === 0 ? '50%' : kind === 1 ? 3 : '30%',
                transform: `rotate(${t * 18 * (i % 2 ? 1 : -1)}deg) scale(${1 - t / 26})`,
                opacity: 1 - t / 26,
              }}
            />
          );
        })
      : null;

  const flash = frame >= T.chomp + 3 ? Math.max(0, 1 - (frame - T.chomp - 3) / 9) : 0;
  const words = name.split(' ');
  const nameSize = isReel ? 168 : 128;
  const typed = Math.max(0, Math.floor((frame - T.tag) * 1.2));
  const tagText = tagline.toUpperCase().slice(0, typed);
  const cursorOn = frame >= T.tag && (typed < tagline.length || Math.floor(frame / 8) % 2 === 0);

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.4 + 0.6 * tween(frame, 0, 20, ease.soft)} />

      {/* Blitz beim Biss */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${((cy + ch * 0.6) / H) * 100}%, rgba(255,194,75,0.55), rgba(255,194,75,0) 45%)`,
          opacity: flash,
        }}
      />

      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY + float}px)`}}>
        {/* Wasserlinie */}
        <div
          style={{
            position: 'absolute',
            left: W / 2 - (cw * 0.62 * lineIn),
            top: waterY,
            width: cw * 1.24 * lineIn,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, rgba(141,134,236,0), ${C.violetHi}, rgba(141,134,236,0))`,
            opacity: 1 - lineOut,
          }}
        />
        {/* Wellenringe */}
        {[0, 1].map((k) => {
          const t = tween(frame, T.rise + 2 + k * 7, 26, ease.out);
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: W / 2 - (cw * 0.35 + t * cw * 0.35),
                top: waterY - (10 + t * 22),
                width: (cw * 0.35 + t * cw * 0.35) * 2,
                height: (10 + t * 22) * 2,
                borderRadius: '50%',
                border: `3px solid ${C.violetHi}`,
                opacity: (1 - t) * 0.6 * (t > 0 ? 1 : 0),
              }}
            />
          );
        })}

        {/* Weiches Licht hinter der Marke */}
        <div
          style={{
            position: 'absolute',
            left: W / 2 - cw * 0.7,
            top: cy - ch * 0.5,
            width: cw * 1.4,
            height: ch * 2,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(141,134,236,0.28), rgba(141,134,236,0) 70%)',
            opacity: tween(frame, T.chomp, 20, ease.soft),
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: W / 2 - cw * 0.42,
            top: cy + ch * 0.98,
            width: cw * 0.84,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.55), rgba(0,0,0,0) 70%)',
            opacity: tween(frame, T.open, 16, ease.soft),
          }}
        />
        {/* Krokodil, maskiert an der Wasserlinie */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: W,
            height: waterY,
            overflow: frame < T.open ? 'hidden' : 'visible',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: cx,
              top: cy + riseY,
              transform: `scale(${1 / squash}, ${squash})`,
              transformOrigin: '50% 80%',
              filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))',
            }}
          >
            <CrocMark size={cw} open={openAmt} bars={bars} blink={blink} look={frame > T.name ? 2 : 0} />
          </div>
        </div>
        {particles}
      </AbsoluteFill>

      {/* Name + Claim */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + ch + (isReel ? 90 : 50),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isReel ? 34 : 24,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {words.map((w, i) => (
            <Reveal key={i} start={T.name + i * 5} dur={18}>
              <div
                style={{
                  fontFamily: F.display,
                  fontWeight: 800,
                  fontStretch: '78%',
                  fontSize: nameSize,
                  lineHeight: 0.9,
                  letterSpacing: '-0.02em',
                  color: C.white,
                  textTransform: 'uppercase',
                }}
              >
                {w}
              </div>
            </Reveal>
          ))}
        </div>
        <div
          style={{
            width: 520 * tween(frame, T.tag - 4, 16, ease.out),
            height: 3,
            background: `linear-gradient(90deg, rgba(67,230,168,0), ${C.mint}, rgba(67,230,168,0))`,
          }}
        />
        <div
          style={{
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: isReel ? 32 : 26,
            letterSpacing: '0.2em',
            color: C.lilac,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'pre',
          }}
        >
          {tagText}
          <span
            style={{
              display: 'inline-block',
              width: '0.62em',
              height: '1.05em',
              marginLeft: 6,
              background: C.mint,
              opacity: cursorOn ? 1 : 0,
            }}
          />
        </div>
      </div>

      <Grain />
      <SafeZones show={showSafeZones} />

      <Sfx enabled={sfx} at={T.bars} name="tick" volume={0.8} />
      <Sfx enabled={sfx} at={T.bars + 3} name="tick" volume={0.8} />
      <Sfx enabled={sfx} at={T.bars + 6} name="tick" volume={0.8} />
      <Sfx enabled={sfx} at={T.rise} name="whoosh-soft" volume={0.8} />
      <Sfx enabled={sfx} at={T.open} name="whoosh-soft" volume={0.6} />
      <Sfx enabled={sfx} at={T.chomp + 1} name="chomp" />
      <Sfx enabled={sfx} at={T.chomp + 2} name="impact" volume={0.55} />
      <Sfx enabled={sfx} at={T.name} name="whoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
