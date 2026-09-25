import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import sample from '../../data/charts-beispiel.json';
import {useFormat} from '../brand/format';
import {CLAMP, ease, pop, seeded, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {MoveBadge, Pill, SourceChip} from '../components/Chips';
import {CoverArt, GameBox} from '../components/GameBox';
import {ScoreTrack, SafeZones, Sfx} from '../components/Kit';
import {Meeple} from '../components/Meeple';
import {bubbleDefaults, bubbleSchema, SceneBubble, useTitleWidth} from '../components/SceneBubble';
import {Reveal} from '../components/Text';

export const chartEntrySchema = z.object({
  title: z.string(),
  publisher: z.string(),
  /** Erwähnungen in der Woche */
  mentions: z.number(),
  /** Veränderung der Erwähnungen ggü. Vorwoche */
  delta: z.number(),
  /** Platzierungs-Veränderung (+ = aufgestiegen) */
  move: z.number(),
  /** Neueinsteiger (überschreibt move) */
  isNew: z.boolean(),
  /** Empfehlungsquote in Prozent */
  recommend: z.number(),
  /** Ein Satz, warum das Spiel gerade läuft */
  note: z.string(),
  /** Cover-Bild in public/covers/ (leer = generiertes Cover) */
  cover: z.string(),
  /** Farbe fürs generierte Cover (leer = automatisch) */
  color: z.string(),
});
export type ChartEntry = z.infer<typeof chartEntrySchema>;

export const chartsSchema = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()),
  /** Einträge nach Platz sortiert: Platz 1 zuerst */
  entries: z.array(chartEntrySchema).min(1).max(7),
  source: z.string(),
  bubble: bubbleSchema,
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type ChartsProps = z.infer<typeof chartsSchema>;

export const chartsDefaults: ChartsProps = chartsSchema.parse({
  ...sample,
  bubble: bubbleDefaults,
  sfx: true,
  showSafeZones: false,
});

/** Maße der Abschlussliste (werden auch für den Flug der Platz-1-Schachtel gebraucht). */
const summaryLayout = (isReel: boolean) => ({
  rowH: isReel ? 134 : 104,
  rowGap: isReel ? 14 : 10,
  thumb: isReel ? 100 : 76,
  top: isReel ? 560 : 290,
  pad: isReel ? 22 : 16,
  rankW: isReel ? 64 : 50,
  gap: isReel ? 22 : 16,
});

/** Horizontale Bewegungsunschärfe als SVG-Filter (für schnelle Flüge). */
const BlurX: React.FC<{id: string; amount: number}> = ({id, amount}) =>
  amount > 0.4 ? (
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <filter id={id} x="-30%" y="-10%" width="160%" height="120%">
        <feGaussianBlur stdDeviation={`${amount} 0`} />
      </filter>
    </svg>
  ) : null;

// Taktung
const HEAD = 44;
const ENTRY = 66;
const SUMMARY = 126;
export const chartsDuration = (n: number) => HEAD + n * ENTRY + SUMMARY;

/** Eintrag im Countdown (großes Schachtel-Motiv). */
const HeroEntry: React.FC<{
  e: ChartEntry;
  rank: number;
  start: number;
  max: number;
  last: boolean;
  sfx: boolean;
}> = ({e, rank, start, max, last, sfx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, isReel, safe} = useFormat();
  const f = frame - start;
  const FLY_START = ENTRY - 8;
  const FLY_END = ENTRY + 18;
  if (f < -2 || f > (last ? FLY_END + 1 : ENTRY + 12)) return null;

  const exitAt = ENTRY - 10;
  const leave = last ? tween(f, ENTRY - 12, 12, ease.in) : tween(f, exitAt, 12, ease.in);
  const box = pop(f, fps, 2, {damping: 15, stiffness: 120, mass: 0.9});
  const boxPrev = pop(f - 1, fps, 2, {damping: 15, stiffness: 120, mass: 0.9});
  const leavePrev = last ? 0 : tween(f - 1, exitAt, 12, ease.in);
  // Platz 1 fliegt am Ende in seine Zeile der Abschlussliste
  const fly = last ? tween(f, FLY_START, FLY_END - FLY_START, ease.inOut) : 0;
  const numIn = tween(f, 0, 20, ease.out);
  const isOne = rank === 1;

  const boxSize = isReel ? 430 : 290;
  const top = isReel ? 600 : 380;
  const boxX = W - safe.right - boxSize - (isReel ? 30 : 20);
  const textTop = top + boxSize + (isReel ? 56 : 30);
  const L = summaryLayout(isReel);
  const target = {x: safe.left + L.pad + L.rankW + L.gap, y: L.top + (L.rowH - L.thumb) / 2, s: L.thumb / boxSize};
  const blurAmt = Math.min(22, (Math.abs(box - boxPrev) * 640 + Math.abs(leave - leavePrev) * 900) * 0.28);

  const barW = isReel ? 600 : 520;
  const barP = tween(f, 22, 26, ease.out);
  const count = Math.round(e.mentions * barP);
  const glow = isOne ? tween(f, 26, 20, ease.soft) : 0;
  const shine = -1 + 2 * tween(f, 10, 34, ease.inOut);

  // Konfetti aus Meeples + Würfelaugen bei Platz 1
  const confetti =
    isOne && f > 28
      ? Array.from({length: 22}, (_, i) => {
          const r = seeded(i + 0.321);
          const t = f - 28 - r() * 6;
          if (t < 0 || t > 50) return null;
          const ang = -Math.PI / 2 + (r() - 0.5) * 2.2;
          const v = 18 + r() * 16;
          const x = boxX + boxSize / 2 + Math.cos(ang) * v * t;
          const y = top + boxSize * 0.3 + Math.sin(ang) * v * t + 0.9 * t * t;
          const col = [C.amber, C.mint, C.violetHi, C.paper][i % 4];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                opacity: Math.min(1, (50 - t) / 12),
                transform: `rotate(${t * 14 * (i % 2 ? 1 : -1)}deg)`,
              }}
            >
              {i % 3 === 0 ? (
                <Meeple size={34} color={col} />
              ) : (
                <div style={{width: 18, height: 18, borderRadius: i % 3 === 1 ? '50%' : 4, background: col}} />
              )}
            </div>
          );
        })
      : null;

  return (
    <AbsoluteFill style={{opacity: last ? 1 : 1 - leave * 0.2}}>
      {/* Riesige Platzziffer im Hintergrund */}
      <div
        style={{
          position: 'absolute',
          left: safe.left - 20 + (1 - numIn) * 260 - leave * 320,
          top: top - (isReel ? 110 : 60),
          fontFamily: F.display,
          fontWeight: 800,
          fontStretch: '75%',
          fontSize: isReel ? 620 : 420,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: isOne ? `rgba(255,194,75,${0.9 * glow})` : 'transparent',
          WebkitTextStroke: `${isReel ? 5 : 4}px ${isOne ? C.amber : C.violetHi}`,
          opacity: numIn * (1 - leave) * (isOne ? 1 : 0.75),
          textShadow: isOne ? `0 0 ${60 * glow}px rgba(255,194,75,0.45)` : undefined,
        }}
      >
        {rank}
      </div>

      {/* Leuchten hinter Platz 1 */}
      {isOne ? (
        <div
          style={{
            position: 'absolute',
            left: boxX - boxSize * 0.5,
            top: top - boxSize * 0.5,
            width: boxSize * 2,
            height: boxSize * 2,
            background: 'radial-gradient(circle, rgba(255,194,75,0.35), rgba(255,194,75,0) 62%)',
            opacity: glow * (1 - leave),
          }}
        />
      ) : null}

      {/* Schachtel */}
      <BlurX id={`hb-${rank}`} amount={blurAmt} />
      <div
        style={{
          position: 'absolute',
          left: (1 - fly) * (boxX + (1 - box) * 640 - (last ? 0 : leave * 900)) + fly * target.x,
          top: (1 - fly) * (top + (1 - box) * 40) + fly * target.y,
          transform: `scale(${1 + (target.s - 1) * fly})`,
          transformOrigin: '0 0',
          filter: `${blurAmt > 0.4 ? `url(#hb-${rank}) ` : ''}drop-shadow(0 ${40 * (1 - fly) + 10}px ${50 * (1 - fly) + 12}px rgba(0,0,0,0.55))`,
        }}
      >
        <GameBox
          title={e.title}
          publisher={e.publisher}
          image={e.cover || undefined}
          color={e.color || undefined}
          size={boxSize}
          rotY={(1 - fly) * (-18 - (1 - box) * 62 + (last ? 0 : leave * 55) + Math.sin(f / 18) * 2)}
          rotX={(1 - fly) * (8 + (1 - box) * 6)}
          rotZ={(1 - fly) * (1 - box) * 10}
          shine={shine}
        />
      </div>
      {confetti}

      {/* Text */}
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: textTop,
          width: W - safe.left - safe.right,
          transform: `translateX(${-leave * 120}px)`,
          opacity: 1 - leave,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <Reveal start={start + 10} dur={16} display="inline-block">
            <div
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontStretch: '80%',
                fontSize: isReel ? 84 : 62,
                lineHeight: 0.95,
                letterSpacing: '-0.015em',
                color: isOne ? C.amber : C.white,
                whiteSpace: 'nowrap',
              }}
            >
              {e.title}
            </div>
          </Reveal>
          <div style={{transform: `scale(${pop(f, fps, 18)})`}}>
            <MoveBadge move={e.isNew ? 'new' : e.move} size={isReel ? 32 : 26} />
          </div>
        </div>
        <Reveal start={start + 14} dur={16}>
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: isReel ? 25 : 20,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.lilac,
              marginTop: 10,
            }}
          >
            {e.publisher}
          </div>
        </Reveal>

        {/* Erwähnungen */}
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: isReel ? 30 : 18}}>
          <div style={{width: barW, height: isReel ? 18 : 14, borderRadius: 9, background: C.ink3, overflow: 'hidden'}}>
            <div
              style={{
                width: `${(e.mentions / max) * 100 * barP}%`,
                height: '100%',
                borderRadius: 9,
                background: isOne
                  ? `linear-gradient(90deg, ${C.amber}, #FFD98A)`
                  : `linear-gradient(90deg, ${C.violet}, ${C.violetHi})`,
                boxShadow: isOne ? '0 0 20px rgba(255,194,75,0.5)' : undefined,
              }}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 10, opacity: tween(f, 22, 8, ease.out)}}>
            <span
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontStretch: '82%',
                fontSize: isReel ? 56 : 44,
                color: C.white,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 22,
            marginTop: 10,
            fontFamily: F.mono,
            fontWeight: 600,
            fontSize: isReel ? 22 : 18,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.mist,
            opacity: tween(f, 26, 12, ease.out),
          }}
        >
          <span>Erwähnungen</span>
          <span style={{color: e.delta >= 0 ? C.mint : C.coral}}>
            {e.delta >= 0 ? '+' : '−'}
            {Math.abs(e.delta)} zur Vorwoche
          </span>
        </div>

        {/* Empfehlung + Notiz */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: isReel ? 30 : 16,
            opacity: tween(f, 30, 14, ease.out),
            transform: `translateY(${(1 - tween(f, 30, 14, ease.out)) * 16}px)`,
          }}
        >
          <div
            style={{
              padding: '10px 18px 9px',
              borderRadius: 999,
              background: 'rgba(67,230,168,0.12)',
              border: '2px solid rgba(67,230,168,0.5)',
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: isReel ? 23 : 19,
              color: C.mint,
              whiteSpace: 'nowrap',
            }}
          >
            {e.recommend} % empfehlen
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontStretch: '90%',
              fontSize: isReel ? 32 : 26,
              color: C.paper,
              lineHeight: 1.1,
            }}
          >
            {e.note}
          </div>
        </div>
      </div>

      <Sfx enabled={sfx} at={start} name="whoosh" volume={0.55} />
      <Sfx enabled={sfx} at={start + 4} name="card" volume={0.9} />
      <Sfx enabled={sfx} at={start + 18} name="pop" volume={0.5} />
      <Sfx enabled={sfx} at={start + 22} name="tick" />
      {isOne ? <Sfx enabled={sfx} at={start + 28} name="ding" /> : null}
      {isOne ? <Sfx enabled={sfx} at={start + 26} name="impact" volume={0.5} /> : null}
    </AbsoluteFill>
  );
};

/** Zusammenfassung: komplette Liste zum Screenshotten. */
const Summary: React.FC<{
  entries: ChartEntry[];
  start: number;
  max: number;
  source: string;
  sfx: boolean;
  /** Ab diesem Frame ist das Cover von Platz 1 sichtbar (vorher fliegt die Schachtel ein) */
  firstThumbAt: number;
}> = ({entries, start, max, source, sfx, firstThumbAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {isReel, safe, innerW} = useFormat();
  if (frame < start - 1) return null;
  const {rowH, rowGap, thumb, top, pad, rankW, gap} = summaryLayout(isReel);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: safe.left, top, width: innerW}}>
        {entries.map((e, i) => {
          const p = pop(frame, fps, start + i * 4, {damping: 16, stiffness: 150});
          const barP = tween(frame, start + 10 + i * 4, 24, ease.out);
          const isOne = i === 0;
          // Zeile 1 steht schon, wenn die Schachtel landet – sonst springt das Cover
          const rowP = isOne ? 1 : p;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: i * (rowH + rowGap),
                width: innerW,
                height: rowH,
                display: 'flex',
                alignItems: 'center',
                gap,
                padding: `0 ${pad}px`,
                borderRadius: 24,
                background: isOne ? 'rgba(255,194,75,0.10)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isOne ? 'rgba(255,194,75,0.6)' : C.line}`,
                transform: `translateY(${(1 - rowP) * 80}px) scale(${0.96 + 0.04 * rowP})`,
                opacity: Math.min(1, p * 1.4),
              }}
            >
              <div
                style={{
                  width: rankW,
                  fontFamily: F.display,
                  fontWeight: 800,
                  fontStretch: '80%',
                  fontSize: isReel ? 72 : 56,
                  color: isOne ? C.amber : C.violetHi,
                  textAlign: 'center',
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  width: thumb,
                  height: thumb,
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  flex: 'none',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
                  opacity: isOne && frame < firstThumbAt ? 0 : 1,
                }}
              >
                {e.cover ? (
                  <Img src={staticFile(e.cover)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <CoverArt title={e.title} size={thumb} color={e.color || undefined} />
                )}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div
                  style={{
                    fontFamily: F.display,
                    fontWeight: 800,
                    fontStretch: '82%',
                    fontSize: isReel ? 44 : 34,
                    lineHeight: 1,
                    color: C.white,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {e.title}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: isReel ? 14 : 10}}>
                  <div style={{flex: 1, height: 10, borderRadius: 5, background: C.ink3, overflow: 'hidden'}}>
                    <div
                      style={{
                        width: `${(e.mentions / max) * 100 * barP}%`,
                        height: '100%',
                        borderRadius: 5,
                        background: isOne ? C.amber : C.violetHi,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontWeight: 700,
                      fontSize: isReel ? 24 : 19,
                      color: C.lilac,
                      width: isReel ? 44 : 36,
                      textAlign: 'right',
                    }}
                  >
                    {Math.round(e.mentions * barP)}
                  </span>
                </div>
              </div>
              <div style={{width: isReel ? 86 : 70, display: 'flex', justifyContent: 'flex-end'}}>
                <MoveBadge move={e.isNew ? 'new' : e.move} size={isReel ? 28 : 22} />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: top + entries.length * (rowH + rowGap) + (isReel ? 16 : 8),
        }}
      >
        <SourceChip text={source} start={start + entries.length * 4 + 10} size={isReel ? 21 : 17} />
      </div>
      {entries.map((_, i) => (
        <Sfx key={i} enabled={sfx} at={start + i * 4} name="tick" volume={0.7} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Creator-Charts (Countdown): Platz n … 1 als 3D-Schachteln, danach die
 * komplette Liste. Ein Meeple hüpft über den Score-Track.
 */
export const CreatorCharts: React.FC<ChartsProps> = ({eyebrow, title, entries, source, bubble, sfx, showSafeZones}) => {
  const frame = useCurrentFrame();
  const {isReel, safe} = useFormat();
  const titleW = useTitleWidth(bubble.show);
  const n = entries.length;
  const max = Math.max(...entries.map((e) => e.mentions), 1);
  const summaryStart = HEAD + n * ENTRY + 4;

  // Countdown-Reihenfolge: letzter Platz zuerst
  const order = entries.map((e, i) => ({e, rank: i + 1})).reverse();
  const k = Math.floor((frame - HEAD) / ENTRY);
  const local = frame - HEAD - k * ENTRY;
  const hop = interpolate(local, [0, 12], [0, 1], {...CLAMP, easing: ease.inOut});
  const trackPos = k <= 0 ? 0 : Math.min(n - 1, k - 1 + hop);
  const trackOut = tween(frame, summaryStart - 12, 12, ease.in);

  return (
    <AbsoluteFill>
      <Backdrop glow={frame > HEAD + (n - 1) * ENTRY ? 'amber' : 'violet'} />

      {/* Kopf */}
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: safe.top,
          width: titleW,
          display: 'flex',
          flexDirection: 'column',
          gap: isReel ? 20 : 14,
        }}
      >
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
            fontSize: isReel ? 88 : 64,
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

      {/* Score-Track */}
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: isReel ? 505 : 290,
          opacity: 1 - trackOut,
          transform: `translateY(${-trackOut * 20}px)`,
        }}
      >
        <ScoreTrack
          labels={order.map((o) => String(o.rank))}
          position={frame < HEAD ? 0 : trackPos}
          cell={isReel ? 50 : 40}
          gap={isReel ? 12 : 10}
          start={14}
        />
      </div>

      {order.map((o, i) => (
        <HeroEntry
          key={i}
          e={o.e}
          rank={o.rank}
          start={HEAD + i * ENTRY}
          max={max}
          last={i === n - 1}
          sfx={sfx}
        />
      ))}

      <Summary
        entries={entries}
        start={summaryStart}
        max={max}
        source={source}
        sfx={sfx}
        firstThumbAt={HEAD + (n - 1) * ENTRY + ENTRY + 18}
      />

      <SceneBubble config={bubble} />
      <Grain />
      <SafeZones show={showSafeZones} />
      <Sfx enabled={sfx} at={2} name="whoosh-soft" volume={0.6} />
      <Sfx enabled={sfx} at={summaryStart - 6} name="whoosh" volume={0.5} />
    </AbsoluteFill>
  );
};
