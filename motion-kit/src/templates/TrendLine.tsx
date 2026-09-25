import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {z} from 'zod';
import sample from '../../data/hype-kurve-beispiel.json';
import {useFormat} from '../brand/format';
import {ease, pop, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {Pill, SourceChip} from '../components/Chips';
import {SafeZones, Sfx} from '../components/Kit';
import {fmtDE} from '../components/Odometer';
import {bubbleDefaults, bubbleSchema, SceneBubble, useTitleWidth} from '../components/SceneBubble';
import {Reveal} from '../components/Text';

export const trendSchema = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()),
  subtitle: z.string(),
  points: z.array(z.object({label: z.string(), value: z.number()})).min(2),
  events: z.array(z.object({index: z.number(), label: z.string()})),
  callout: z.string(),
  /** Index des Punkts, an dem der Callout hängt (-1 = Maximum) */
  calloutIndex: z.number(),
  takeaway: z.string(),
  source: z.string(),
  bubble: bubbleSchema,
  sfx: z.boolean(),
  showSafeZones: z.boolean(),
});
export type TrendProps = z.infer<typeof trendSchema>;

export const trendDefaults: TrendProps = trendSchema.parse({
  ...sample,
  bubble: bubbleDefaults,
  sfx: true,
  showSafeZones: false,
});

export const TREND_FRAMES = 270;

const niceMax = (v: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
  return (steps.find((s) => m <= s) ?? 10) * p;
};

/** Catmull-Rom → kubische Béziers: weiche, ehrliche Kurve durch alle Punkte. */
const smooth = (pts: Array<[number, number]>) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const t = 0.16;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
};

/** Hype-Kurve (9 s): Linie zeichnet sich, Ereignisse poppen auf, Callout am Peak. */
export const TrendLine: React.FC<TrendProps> = ({
  eyebrow,
  title,
  subtitle,
  points,
  events,
  callout,
  calloutIndex,
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

  const T = {chart: 26, draw: 44, drawDur: 118, callout: 170, takeaway: 186};

  const cx = safe.left;
  const cy = isReel ? 660 : 350;
  const cw = innerW;
  const chh = isReel ? 540 : 420;
  const padL = 78;
  const padB = 50;
  const plotW = cw - padL - 20;
  const plotH = chh - padB - 30;

  const maxV = niceMax(Math.max(...points.map((p) => p.value)) * 1.12);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxV);
  const xs = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const ys = (v: number) => 30 + plotH - (v / maxV) * plotH;
  const pts: Array<[number, number]> = points.map((p, i) => [xs(i), ys(p.value)]);
  const d = smooth(pts);
  const len = getLength(d);

  const prog = tween(frame, T.draw, T.drawDur, ease.soft);
  const {strokeDasharray, strokeDashoffset} = evolvePath(prog, d);
  const head = getPointAtLength(d, Math.max(0.01, prog * len)) ?? {x: pts[0][0], y: pts[0][1]};
  // Wert am Kopf: linear zwischen den Datenpunkten
  const fi = ((head.x - padL) / plotW) * (points.length - 1);
  const i0 = Math.max(0, Math.min(points.length - 2, Math.floor(fi)));
  const headV = points[i0].value + (points[i0 + 1].value - points[i0].value) * Math.max(0, Math.min(1, fi - i0));

  // Frame, in dem die Linie einen x-Wert erreicht (für exaktes Timing der Ereignisse)
  const reachFrame = React.useMemo(() => {
    const cache = new Map<number, number>();
    return (x: number) => {
      if (cache.has(x)) return cache.get(x) as number;
      let hit = T.draw + T.drawDur;
      for (let f = T.draw; f <= T.draw + T.drawDur; f++) {
        const p = tween(f, T.draw, T.drawDur, ease.soft);
        if ((getPointAtLength(d, Math.max(0.01, p * len))?.x ?? 0) >= x - 1) {
          hit = f;
          break;
        }
      }
      cache.set(x, hit);
      return hit;
    };
  }, [d, len, T.draw, T.drawDur]);

  const gridIn = tween(frame, T.chart, 20, ease.out);
  const cIdx = calloutIndex < 0 ? points.reduce((b, p, i) => (p.value > points[b].value ? i : b), 0) : calloutIndex;
  const calloutP = pop(frame, fps, T.callout, {damping: 12, stiffness: 180});

  return (
    <AbsoluteFill>
      <Backdrop glow="mint" />
      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: safe.top,
          width: titleW,
          display: 'flex',
          flexDirection: 'column',
          gap: isReel ? 20 : 12,
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
            fontSize: isReel ? 88 : 62,
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
        <Reveal start={16} dur={16}>
          <div
            style={{
              fontFamily: F.mono,
              fontWeight: 600,
              fontSize: isReel ? 24 : 19,
              letterSpacing: '0.06em',
              color: C.lilac,
            }}
          >
            {subtitle}
          </div>
        </Reveal>
      </div>

      {/* Diagramm */}
      <svg width={cw} height={chh} style={{position: 'absolute', left: cx, top: cy, overflow: 'visible'}}>
        <defs>
          <linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.mint} stopOpacity={0.32} />
            <stop offset="1" stopColor={C.mint} stopOpacity={0} />
          </linearGradient>
          <clipPath id="trend-reveal">
            <rect x={0} y={-50} width={head.x} height={chh + 100} />
          </clipPath>
          <filter id="trend-glow" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {ticks.map((t, i) => (
          <g key={i} opacity={gridIn}>
            <line
              x1={padL}
              x2={padL + plotW * gridIn}
              y1={ys(t)}
              y2={ys(t)}
              stroke={i === 0 ? C.lineStrong : C.line}
              strokeWidth={2}
              strokeDasharray={i === 0 ? undefined : '4 10'}
            />
            <text
              x={padL - 16}
              y={ys(t) + 8}
              textAnchor="end"
              fill={C.mist}
              fontFamily={F.mono}
              fontSize={isReel ? 22 : 18}
              fontWeight={600}
            >
              {fmtDE(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          (i % 3 === 0 && points.length - 1 - i >= 2) || i === points.length - 1 ? (
            <text
              key={i}
              x={xs(i)}
              y={30 + plotH + 40}
              textAnchor="middle"
              fill={C.mist}
              fontFamily={F.mono}
              fontSize={isReel ? 21 : 17}
              fontWeight={600}
              opacity={gridIn}
            >
              {p.label}
            </text>
          ) : null,
        )}

        {/* Ereignisse */}
        {events.map((ev, k) => {
          const x = xs(ev.index);
          const y = ys(points[ev.index]?.value ?? 0);
          const t0 = reachFrame(x);
          const p = pop(frame, fps, t0, {damping: 13, stiffness: 190});
          const line = tween(frame, t0, 12, ease.out);
          // Labels unten im Diagramm (über der x-Achse), Linie führt hoch zum Punkt
          const labelY = 30 + plotH - (isReel ? 64 : 54) - (k % 2) * (isReel ? 62 : 52);
          const alignRight = x > padL + plotW * 0.62;
          return (
            <g key={k}>
              <line
                x1={x}
                x2={x}
                y1={labelY}
                y2={labelY - (labelY - y) * line}
                stroke={C.lilac}
                strokeWidth={2}
                strokeDasharray="3 8"
                opacity={0.8}
              />
              <circle cx={x} cy={y} r={11 * p} fill={C.ink} stroke={C.lilac} strokeWidth={4} />
              <g transform={`translate(${x} ${labelY}) scale(${p})`} opacity={Math.min(1, p)}>
                <foreignObject x={alignRight ? -430 : -12} y={-4} width={440} height={60} style={{overflow: 'visible'}}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: alignRight ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        padding: '9px 16px 8px',
                        borderRadius: 12,
                        background: C.paper,
                        color: C.ink,
                        fontFamily: F.mono,
                        fontWeight: 700,
                        fontSize: isReel ? 21 : 17,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                      }}
                    >
                      {ev.label}
                    </div>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}

        {/* Fläche + Linie */}
        <g clipPath="url(#trend-reveal)">
          <path d={`${d} L ${pts[pts.length - 1][0]} ${30 + plotH} L ${pts[0][0]} ${30 + plotH} Z`} fill="url(#trend-area)" />
        </g>
        <path
          d={d}
          fill="none"
          stroke={C.mint}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          filter="url(#trend-glow)"
          opacity={0.55}
        />
        <path
          d={d}
          fill="none"
          stroke={C.mint}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
        />

        {/* Kopf mit Wert */}
        {prog > 0.001 ? (
          <g transform={`translate(${head.x} ${head.y})`}>
            <circle r={24} fill={C.mint} opacity={0.18 + 0.1 * Math.sin(frame / 4)} />
            <circle r={11} fill={C.white} stroke={C.mint} strokeWidth={5} />
            <g transform={`translate(0 ${-58})`} opacity={1 - tween(frame, T.callout - 6, 10, ease.in)}>
              <rect x={-64} y={-26} width={128} height={48} rx={12} fill={C.ink2} stroke={C.mint} strokeWidth={2} />
              <text
                textAnchor="middle"
                y={9}
                fill={C.white}
                fontFamily={F.display}
                fontWeight={800}
                fontSize={30}
                style={{fontStretch: '85%'}}
              >
                {fmtDE(Math.round(headV))}
              </text>
            </g>
          </g>
        ) : null}

        {/* Callout */}
        {calloutP > 0.01 ? (
          <g transform={`translate(${xs(cIdx)} ${ys(points[cIdx].value)})`}>
            <circle r={16 * calloutP} fill={C.amber} />
            <circle r={34 * calloutP} fill="none" stroke={C.amber} strokeWidth={3} opacity={0.6} />
            <foreignObject x={-300} y={-126} width={600} height={90} style={{overflow: 'visible'}}>
              <div style={{display: 'flex', justifyContent: 'center', transform: `scale(${calloutP})`}}>
                <div
                  style={{
                    padding: '14px 24px 12px',
                    borderRadius: 16,
                    background: C.amber,
                    color: C.ink,
                    fontFamily: F.display,
                    fontWeight: 800,
                    fontStretch: '82%',
                    fontSize: isReel ? 46 : 38,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 16px 40px rgba(255,194,75,0.35)',
                  }}
                >
                  {callout}
                </div>
              </div>
            </foreignObject>
          </g>
        ) : null}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: safe.left,
          top: cy + chh + (isReel ? 34 : 18),
          width: innerW,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <Reveal start={T.takeaway} dur={18}>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 600,
              fontStretch: '88%',
              fontSize: isReel ? 38 : 28,
              lineHeight: 1.16,
              color: C.paper,
              textWrap: 'balance',
            }}
          >
            {takeaway}
          </div>
        </Reveal>
        <SourceChip text={source} start={T.takeaway + 10} size={isReel ? 21 : 17} />
      </div>

      <SceneBubble config={bubble} />
      <Grain />
      <SafeZones show={showSafeZones} />
      <Sfx enabled={sfx} at={2} name="whoosh-soft" volume={0.6} />
      <Sfx enabled={sfx} at={T.draw} name="riser" volume={0.28} />
      {events.map((ev, k) => (
        <Sfx key={k} enabled={sfx} at={reachFrame(xs(ev.index))} name="pop" volume={0.6} />
      ))}
      <Sfx enabled={sfx} at={T.callout} name="impact" volume={0.5} />
      <Sfx enabled={sfx} at={T.callout + 2} name="ding" volume={0.6} />
    </AbsoluteFill>
  );
};
