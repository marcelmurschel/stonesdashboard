import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import sample from '../../data/duell-beispiel.json';
import {useFormat} from '../brand/format';
import {ease, pop, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {Pill, SourceChip} from '../components/Chips';
import {GameBox} from '../components/GameBox';
import {MarkedLine} from '../components/Highlight';
import {SafeZones, Sfx} from '../components/Kit';
import {fmtDE} from '../components/Odometer';
import {bubbleDefaults, bubbleSchema, SceneBubble, useTitleWidth} from '../components/SceneBubble';
import {Reveal} from '../components/Text';

const gameSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  cover: z.string(),
  color: z.string(),
});

const metricSchema = z.object({
  label: z.string(),
  left: z.number(),
  right: z.number(),
  /** Anzeige: 'int' = 42, 'pct' = 81 %, 'sent' = +0,61, 'mio' = 2,1 Mio. */
  format: z.enum(['int', 'pct', 'sent', 'mio']),
  higherIsBetter: z.boolean(),
});

export const versusSchema = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()),
  left: gameSchema,
  right: gameSchema,
  metrics: z.array(metricSchema).min(1).max(5),
  /** *Wort* = Textmarker */
  verdict: z.string(),
  source: z.string(),
  bubble: bubbleSchema,
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type VersusProps = z.infer<typeof versusSchema>;

export const versusDefaults: VersusProps = versusSchema.parse({
  ...sample,
  bubble: bubbleDefaults,
  sfx: true,
  showSafeZones: false,
});

export const VERSUS_FRAMES = 270;

const fmt = (v: number, f: 'int' | 'pct' | 'sent' | 'mio') => {
  if (f === 'pct') return `${fmtDE(v)} %`;
  if (f === 'sent') return `${v >= 0 ? '+' : '−'}${fmtDE(Math.abs(v), 2)}`;
  if (f === 'mio') return `${fmtDE(v, 1)} Mio.`;
  return fmtDE(v);
};

/** "VS" als Biss: Kreis mit Zahnkranz, der sich langsam dreht. */
const VsBadge: React.FC<{size: number; p: number; spin: number}> = ({size, p, spin}) => {
  const teeth = 18;
  const r = size / 2;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.86;
    pts.push(`${r + Math.cos(a) * rr},${r + Math.sin(a) * rr}`);
  }
  return (
    <div style={{width: size, height: size, position: 'relative', transform: `scale(${p}) rotate(${(1 - p) * -40}deg)`}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, transform: `rotate(${spin}deg)`}}>
        <polygon points={pts.join(' ')} fill={C.paper} />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: size * 0.1,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${C.violetHi}, ${C.violet} 60%, ${C.violetDeep})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: F.display,
          fontWeight: 800,
          fontStretch: '80%',
          fontSize: size * 0.36,
          color: C.white,
          letterSpacing: '-0.02em',
          boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.3)',
        }}
      >
        VS
      </div>
    </div>
  );
};

/** Duell (9 s): zwei Schachteln, VS-Biss, Kennzahlen als Balken von der Mitte, Urteil. */
export const Versus: React.FC<VersusProps> = ({eyebrow, title, left, right, metrics, verdict, source, bubble, sfx, showSafeZones}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, isReel, safe, innerW} = useFormat();
  const titleW = useTitleWidth(bubble.show);

  const T = {boxes: 20, vs: 34, names: 38, rows: 56, rowGap: 16, verdict: 56 + metrics.length * 16 + 26};
  const boxSize = isReel ? 300 : 220;
  const boxTop = isReel ? 540 : 290;
  const lb = pop(frame, fps, T.boxes, {damping: 14, stiffness: 120});
  const rb = pop(frame, fps, T.boxes + 4, {damping: 14, stiffness: 120});
  const vs = pop(frame, fps, T.vs, {damping: 10, stiffness: 200});
  const rowsTop = boxTop + boxSize + (isReel ? 150 : 96);
  const rowH = isReel ? 104 : 78;
  const half = (innerW - (isReel ? 40 : 30)) / 2;

  const wins = metrics.map((m) => (m.left === m.right ? 0 : (m.left > m.right) === m.higherIsBetter ? -1 : 1));

  const nameBlock = (g: typeof left, align: 'left' | 'right', start: number) => (
    <Reveal start={start} dur={16}>
      <div style={{textAlign: align}}>
        <div style={{fontFamily: F.display, fontWeight: 800, fontStretch: '82%', fontSize: isReel ? 50 : 38, color: C.white, lineHeight: 1}}>
          {g.title}
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontWeight: 600,
            fontSize: isReel ? 20 : 16,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.lilac,
            marginTop: 8,
          }}
        >
          {g.publisher}
        </div>
      </div>
    </Reveal>
  );

  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{position: 'absolute', left: safe.left, top: safe.top, width: titleW, display: 'flex', flexDirection: 'column', gap: isReel ? 20 : 12}}>
        <Reveal start={2} dur={14} display="inline-block" style={{alignSelf: 'flex-start'}}>
          <Pill variant="solid" dot={C.mint} size={isReel ? 26 : 21}>
            {eyebrow}
          </Pill>
        </Reveal>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 800,
            fontStretch: '80%',
            fontSize: isReel ? 84 : 60,
            lineHeight: 0.93,
            letterSpacing: '-0.015em',
            textTransform: 'uppercase',
            color: C.white,
          }}
        >
          {title.map((l, i) => (
            <Reveal key={i} start={6 + i * 4} dur={18}>
              {l}
            </Reveal>
          ))}
        </div>
      </div>

      {/* Schachteln */}
      <div style={{position: 'absolute', left: safe.left + 10 - (1 - lb) * 500, top: boxTop, filter: 'drop-shadow(0 34px 40px rgba(0,0,0,0.55))'}}>
        <GameBox
          title={left.title}
          publisher={left.publisher}
          image={left.cover || undefined}
          color={left.color || undefined}
          size={boxSize}
          rotY={20 + (1 - lb) * 50 + Math.sin(frame / 20) * 2}
          rotX={8}
          shine={-1 + 2 * tween(frame, T.boxes + 6, 30, ease.inOut)}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: W - safe.right - boxSize - 10 + (1 - rb) * 500,
          top: boxTop,
          filter: 'drop-shadow(0 34px 40px rgba(0,0,0,0.55))',
        }}
      >
        <GameBox
          title={right.title}
          publisher={right.publisher}
          image={right.cover || undefined}
          color={right.color || undefined}
          size={boxSize}
          rotY={-20 - (1 - rb) * 50 - Math.sin(frame / 20) * 2}
          rotX={8}
          shine={-1 + 2 * tween(frame, T.boxes + 10, 30, ease.inOut)}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: W / 2 - (isReel ? 88 : 66),
          top: boxTop + boxSize / 2 - (isReel ? 88 : 66),
          filter: 'drop-shadow(0 16px 30px rgba(0,0,0,0.5))',
        }}
      >
        <VsBadge size={isReel ? 176 : 132} p={vs} spin={frame * 0.6} />
      </div>

      <div style={{position: 'absolute', left: safe.left, top: boxTop + boxSize + (isReel ? 28 : 18), width: half}}>
        {nameBlock(left, 'left', T.names)}
      </div>
      <div style={{position: 'absolute', right: safe.right, top: boxTop + boxSize + (isReel ? 28 : 18), width: half}}>
        {nameBlock(right, 'right', T.names + 3)}
      </div>

      {/* Kennzahlen */}
      {metrics.map((m, i) => {
        const s = T.rows + i * T.rowGap;
        const a = tween(frame, s, 14, ease.out);
        const g = tween(frame, s + 4, 22, ease.out);
        const max = Math.max(Math.abs(m.left), Math.abs(m.right), 1e-9);
        const lw = (Math.abs(m.left) / max) * (half - (isReel ? 150 : 110)) * g;
        const rw = (Math.abs(m.right) / max) * (half - (isReel ? 150 : 110)) * g;
        const win = wins[i];
        const y = rowsTop + i * rowH;
        const valStyle = (isWin: boolean): React.CSSProperties => ({
          fontFamily: F.display,
          fontWeight: 800,
          fontStretch: '82%',
          fontSize: isReel ? 40 : 30,
          color: isWin ? C.amber : C.paper,
          whiteSpace: 'nowrap',
          opacity: tween(frame, s + 14, 10, ease.out),
        });
        const barH = isReel ? 22 : 16;
        return (
          <div key={i} style={{position: 'absolute', left: safe.left, top: y, width: innerW, opacity: a, transform: `translateY(${(1 - a) * 20}px)`}}>
            <div
              style={{
                textAlign: 'center',
                fontFamily: F.mono,
                fontWeight: 700,
                fontSize: isReel ? 21 : 17,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: C.lilac,
              }}
            >
              {m.label}
            </div>
            <div style={{position: 'relative', height: isReel ? 52 : 40, marginTop: 6}}>
              <div style={{position: 'absolute', left: innerW / 2 - 1, top: 4, width: 2, height: isReel ? 44 : 32, background: C.lineStrong}} />
              {/* links */}
              <div
                style={{
                  position: 'absolute',
                  right: innerW / 2 + 10,
                  top: (isReel ? 52 : 40) / 2 - barH / 2,
                  width: lw,
                  height: barH,
                  borderRadius: barH / 2,
                  background: win === -1 ? `linear-gradient(270deg, ${C.amber}, #FFD98A)` : C.violetHi,
                  opacity: win === -1 ? 1 : 0.55,
                  boxShadow: win === -1 ? '0 0 18px rgba(255,194,75,0.45)' : undefined,
                }}
              />
              <div style={{position: 'absolute', right: innerW / 2 + 24 + lw, top: 0, ...valStyle(win === -1)}}>{fmt(m.left, m.format)}</div>
              {/* rechts */}
              <div
                style={{
                  position: 'absolute',
                  left: innerW / 2 + 10,
                  top: (isReel ? 52 : 40) / 2 - barH / 2,
                  width: rw,
                  height: barH,
                  borderRadius: barH / 2,
                  background: win === 1 ? `linear-gradient(90deg, ${C.amber}, #FFD98A)` : C.violetHi,
                  opacity: win === 1 ? 1 : 0.55,
                  boxShadow: win === 1 ? '0 0 18px rgba(255,194,75,0.45)' : undefined,
                }}
              />
              <div style={{position: 'absolute', left: innerW / 2 + 24 + rw, top: 0, ...valStyle(win === 1)}}>{fmt(m.right, m.format)}</div>
            </div>
          </div>
        );
      })}

      {/* Urteil */}
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: rowsTop + metrics.length * rowH + (isReel ? 20 : 8),
          width: innerW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            transform: `scale(${pop(frame, fps, T.verdict, {damping: 12, stiffness: 170})})`,
            padding: isReel ? '18px 34px 16px' : '12px 24px 11px',
            borderRadius: 22,
            background: 'rgba(255,255,255,0.06)',
            border: `2px solid ${C.lineStrong}`,
            fontFamily: F.display,
            fontWeight: 800,
            fontStretch: '82%',
            fontSize: isReel ? 50 : 38,
            color: C.white,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          <MarkedLine text={verdict} markStart={T.verdict + 8} />
        </div>
        <SourceChip text={source} start={T.verdict + 14} size={isReel ? 20 : 16} />
      </div>

      <SceneBubble config={bubble} />
      <Grain />
      <SafeZones show={showSafeZones} />
      <Sfx enabled={sfx} at={2} name="whoosh-soft" volume={0.6} />
      <Sfx enabled={sfx} at={T.boxes} name="whoosh" volume={0.6} />
      <Sfx enabled={sfx} at={T.boxes + 4} name="card" />
      <Sfx enabled={sfx} at={T.vs + 2} name="chomp" volume={0.7} />
      {metrics.map((_, i) => (
        <Sfx key={i} enabled={sfx} at={T.rows + i * T.rowGap + 4} name="tick" volume={0.8} />
      ))}
      <Sfx enabled={sfx} at={T.verdict} name="pop" />
      <Sfx enabled={sfx} at={T.verdict + 8} name="ding" volume={0.6} />
    </AbsoluteFill>
  );
};
