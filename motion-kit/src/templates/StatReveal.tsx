import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import sample from '../../data/datenpunkt-beispiel.json';
import {useFormat} from '../brand/format';
import {ease, pop, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {Pill, SourceChip} from '../components/Chips';
import {MarkedLine} from '../components/Highlight';
import {SafeZones, Sfx} from '../components/Kit';
import {Meeple} from '../components/Meeple';
import {fmtDE, Odometer} from '../components/Odometer';
import {bubbleDefaults, bubbleSchema, SceneBubble, useTitleWidth} from '../components/SceneBubble';
import {Reveal} from '../components/Text';

const segmentSchema = z.object({
  label: z.string(),
  /** Anteil in Prozent (alle Segmente zusammen ≈ 100) */
  share: z.number(),
  note: z.string(),
  tone: z.enum(['highlight', 'primary', 'muted']),
});

export const statSchema = z.object({
  eyebrow: z.string(),
  /** Frage/Headline, *Wort* = Textmarker */
  question: z.array(z.string()),
  value: z.string(),
  valueNote: z.string(),
  valueSub: z.string(),
  segments: z.array(segmentSchema),
  takeaway: z.string(),
  source: z.string(),
  bubble: bubbleSchema,
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type StatProps = z.infer<typeof statSchema>;

export const statDefaults: StatProps = statSchema.parse({
  ...sample,
  bubble: bubbleDefaults,
  sfx: true,
  showSafeZones: false,
});

export const STAT_FRAMES = 240;

const TONE = {
  highlight: C.amber,
  primary: C.violetHi,
  muted: C.ink4,
} as const;

/**
 * Datenpunkt (8 s): Frage, großes Zählwerk und ein Waffle-Chart aus
 * 100 Meeples – ein Meeple = ein Prozent.
 */
export const StatReveal: React.FC<StatProps> = ({
  eyebrow,
  question,
  value,
  valueNote,
  valueSub,
  segments,
  takeaway,
  source,
  bubble,
  sfx,
  showSafeZones,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {isReel, safe, innerW} = useFormat();
  const titleW = useTitleWidth(bubble.show);

  // Meeple-Verteilung (Summe exakt 100)
  const counts = segments.map((s) => Math.round(s.share));
  const diff = 100 - counts.reduce((a, b) => a + b, 0);
  if (counts.length) counts[counts.length - 1] += diff;
  const toneOf: Array<keyof typeof TONE> = [];
  segments.forEach((s, i) => {
    for (let k = 0; k < counts[i]; k++) toneOf.push(s.tone);
  });

  const cols = 20;
  const rows = 5;
  const mSize = isReel ? 38 : 32;
  const gapX = isReel ? 9.6 : 8;
  const gapY = isReel ? 12 : 10;
  const gridW = cols * mSize + (cols - 1) * gapX;

  const T = {q: 8, grid: 34, number: 62, hi: 92, rest: 108, legend: 118, takeaway: 150};

  // Wann wird welcher Meeple eingefärbt?
  const colorAt = (i: number) => {
    const tone = toneOf[i] ?? 'muted';
    if (tone === 'muted') return {c: C.ink4, p: 1};
    const idxInTone = toneOf.slice(0, i).filter((t) => t === tone).length;
    const start = tone === 'highlight' ? T.hi + idxInTone * 2.2 : T.rest + idxInTone * 0.55;
    const p = tween(frame, start, 8, ease.out);
    return {c: TONE[tone], p, start};
  };

  const numSize = isReel ? 224 : 170;

  return (
    <AbsoluteFill>
      <Backdrop glow="amber" />
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: safe.top,
          width: innerW,
          display: 'flex',
          flexDirection: 'column',
          gap: isReel ? 18 : 14,
        }}
      >
        <Reveal start={2} dur={14} display="inline-block" style={{alignSelf: 'flex-start'}}>
          <Pill variant="solid" dot={C.mint} size={isReel ? 26 : 21}>
            {eyebrow}
          </Pill>
        </Reveal>
        <div
          style={{
            width: titleW,
            fontFamily: F.display,
            fontWeight: 800,
            fontStretch: '80%',
            fontSize: isReel ? 78 : 60,
            lineHeight: 0.95,
            letterSpacing: '-0.012em',
            color: C.white,
          }}
        >
          {question.map((l, i) => (
            <Reveal key={i} start={T.q + i * 4} dur={18}>
              <MarkedLine text={l} markStart={T.q + question.length * 4 + 10} />
            </Reveal>
          ))}
        </div>

        {/* Große Zahl */}
        <div style={{display: 'flex', alignItems: 'flex-end', gap: isReel ? 34 : 26, marginTop: isReel ? 8 : 4}}>
          <div style={{filter: `drop-shadow(0 0 40px rgba(255,194,75,${0.35 * tween(frame, T.number + 20, 20, ease.soft)}))`}}>
            <Odometer value={value} start={T.number} size={numSize} color={C.amber} stagger={6} dur={30} />
          </div>
          <div
            style={{
              paddingBottom: numSize * 0.14,
              opacity: tween(frame, T.number + 26, 14, ease.out),
              transform: `translateX(${(1 - tween(frame, T.number + 26, 14, ease.out)) * -20}px)`,
            }}
          >
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontStretch: '82%',
                fontSize: isReel ? 64 : 50,
                lineHeight: 1,
                color: C.white,
              }}
            >
              {valueNote}
            </div>
            <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: isReel ? 24 : 20, letterSpacing: '0.08em', color: C.lilac, marginTop: 6}}>
              {valueSub}
            </div>
          </div>
        </div>

        {/* Meeple-Waffle */}
        <div
          style={{
            position: 'relative',
            width: gridW,
            height: rows * mSize + (rows - 1) * gapY,
            marginTop: isReel ? 12 : 6,
            alignSelf: 'center',
          }}
        >
          {Array.from({length: cols * rows}, (_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const drop = pop(frame, fps, T.grid + (c + r * 2) * 0.9, {damping: 12, stiffness: 210, mass: 0.6});
            const col = colorAt(i);
            const lit = col.p;
            const tone = toneOf[i] ?? 'muted';
            const bump = tone === 'highlight' && col.start !== undefined ? pop(frame, fps, col.start, {damping: 8, stiffness: 260}) : 1;
            const idle = tone === 'highlight' ? Math.sin((frame - i * 4) / 9) * 2 * tween(frame, T.legend, 20, ease.soft) : 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: c * (mSize + gapX),
                  top: r * (mSize + gapY) + (1 - drop) * -140 + idle,
                  opacity: Math.min(1, drop * 2),
                  transform: `scale(${tone === 'highlight' && lit > 0 ? 0.85 + 0.15 * Math.min(bump, 1.25) : 1})`,
                  filter: tone === 'highlight' && lit > 0.5 ? `drop-shadow(0 0 12px rgba(255,194,75,${0.6 * lit}))` : undefined,
                }}
              >
                <Meeple size={mSize} color={lit > 0.02 && tone !== 'muted' ? mixHex(C.ink4, col.c, lit) : C.ink4} />
              </div>
            );
          })}
        </div>

        {/* Legende */}
        <div style={{display: 'flex', gap: isReel ? 16 : 12, marginTop: isReel ? 14 : 6}}>
          {segments.map((s, i) => {
            const p = tween(frame, T.legend + i * 8, 16, ease.out);
            const n = s.share * tween(frame, T.legend + i * 8, 26, ease.out);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: isReel ? '14px 18px 13px' : '10px 14px 10px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)',
                  border: `2px solid ${s.tone === 'highlight' ? 'rgba(255,194,75,0.55)' : C.line}`,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{width: 16, height: 16, borderRadius: 5, background: s.tone === 'muted' ? C.mist : TONE[s.tone]}} />
                  <span style={{fontFamily: F.mono, fontWeight: 700, fontSize: isReel ? 22 : 18, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.lilac}}>
                    {s.label}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 800,
                    fontStretch: '82%',
                    fontSize: isReel ? 52 : 40,
                    color: s.tone === 'highlight' ? C.amber : C.white,
                    lineHeight: 1.05,
                    marginTop: 6,
                  }}
                >
                  {fmtDE(n, 1)} %
                </div>
                <div style={{fontFamily: F.mono, fontSize: isReel ? 21 : 17, color: C.mist, marginTop: 2}}>{s.note}</div>
              </div>
            );
          })}
        </div>

        <Reveal start={T.takeaway} dur={18} style={{marginTop: isReel ? 6 : 2}}>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontStretch: '88%',
              fontSize: isReel ? 36 : 28,
              lineHeight: 1.16,
              color: C.paper,
              textWrap: 'balance',
            }}
          >
            {takeaway}
          </div>
        </Reveal>
        <SourceChip text={source} start={T.takeaway + 10} size={isReel ? 21 : 18} />
      </div>

      <SceneBubble config={bubble} />
      <Grain />
      <SafeZones show={showSafeZones} />

      <Sfx enabled={sfx} at={2} name="whoosh-soft" volume={0.6} />
      <Sfx enabled={sfx} at={T.q + question.length * 4 + 10} name="blip" />
      <Sfx enabled={sfx} at={T.grid} name="whoosh" volume={0.45} />
      <Sfx enabled={sfx} at={T.number} name="riser" volume={0.3} />
      <Sfx enabled={sfx} at={T.number + 24} name="impact" volume={0.7} />
      {Array.from({length: counts[0] ?? 0}, (_, k) => (
        <Sfx key={k} enabled={sfx} at={T.hi + k * 2.2} name="pop" volume={0.35} />
      ))}
      <Sfx enabled={sfx} at={T.rest} name="whoosh-soft" volume={0.5} />
      <Sfx enabled={sfx} at={T.takeaway} name="tick" />
    </AbsoluteFill>
  );
};

/** Hex-Farben mischen (t = 0 → a, 1 → b). */
const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * Math.min(1, Math.max(0, t)));
  return `rgb(${m(16)}, ${m(8)}, ${m(0)})`;
};
