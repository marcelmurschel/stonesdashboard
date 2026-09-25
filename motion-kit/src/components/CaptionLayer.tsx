import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Caption} from '@remotion/captions';
import {z} from 'zod';
import {useFormat} from '../brand/format';
import {ease, tween} from '../brand/motion';
import {C, F} from '../brand/tokens';

export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable(),
  confidence: z.number().nullable(),
  /** Nach diesem Wort eine neue Untertitel-Seite beginnen */
  pageBreakAfter: z.boolean().optional(),
});

/**
 * Satz-Untertitel (z. B. aus einer SRT-Datei) in einzelne Wörter zerlegen.
 * Die Zeit wird nach Wortlänge verteilt – für Karaoke-Hervorhebung reicht das.
 */
export const toWords = (captions: Caption[]): Caption[] => {
  const out: Caption[] = [];
  for (const c of captions) {
    const words = c.text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      out.push({...c, text: c.text.trim()});
      continue;
    }
    // Satz-Untertitel: Zeit nach Wortlänge verteilen, am Ende des Satzes umbrechen
    const weights = words.map((w) => Math.max(2, w.length));
    const total = weights.reduce((a, b) => a + b, 0);
    let t = c.startMs;
    words.forEach((w, i) => {
      const d = ((c.endMs - c.startMs) * weights[i]) / total;
      out.push({
        text: w,
        startMs: t,
        endMs: t + d,
        timestampMs: t + d / 2,
        confidence: c.confidence,
        pageBreakAfter: i === words.length - 1,
      });
      t += d;
    });
  }
  return out;
};

type Page = {startMs: number; endMs: number; tokens: Array<{text: string; fromMs: number; toMs: number}>};

/**
 * Seiten bilden wie ein Cutter: erst in Sinnabschnitte teilen (Satzzeichen,
 * Pausen, manuelle Umbrüche), zu lange Abschnitte dann in gleich lange
 * Stücke – so bleibt nie ein einzelnes Wort allein stehen.
 */
export const paginate = (words: Caption[], maxWords = 4, maxChars = 26, gapMs = 450): Page[] => {
  const clean = words.filter((w) => w.text.trim());
  // 1. Sinnabschnitte
  const phrases: Caption[][] = [];
  let cur: Caption[] = [];
  clean.forEach((w, i) => {
    const prev = clean[i - 1];
    const brk =
      cur.length > 0 &&
      prev &&
      (prev.pageBreakAfter || /[.!?:;,–]$/.test(prev.text.trim()) || w.startMs - prev.endMs > gapMs);
    if (brk) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) phrases.push(cur);

  // 2. Zu lange Abschnitte ausgewogen teilen
  const pages: Page[] = [];
  for (const ph of phrases) {
    const len = (ws: Caption[]) => ws.reduce((a, w) => a + w.text.trim().length + 1, -1);
    const k = Math.max(1, Math.ceil(ph.length / maxWords), Math.ceil(len(ph) / maxChars));
    const target = len(ph) / k;
    let chunk: Caption[] = [];
    const chunks: Caption[][] = [];
    ph.forEach((w, i) => {
      const remainingChunks = k - chunks.length;
      const wouldBe = len([...chunk, w]);
      const wordsLeft = ph.length - i;
      if (chunk.length && remainingChunks > 1 && (wouldBe > target * 1.15 || chunk.length >= maxWords) && wordsLeft >= remainingChunks - 1) {
        chunks.push(chunk);
        chunk = [];
      }
      chunk.push(w);
    });
    if (chunk.length) chunks.push(chunk);
    for (const c of chunks) {
      pages.push({
        startMs: c[0].startMs,
        endMs: c[c.length - 1].endMs,
        tokens: c.map((w) => ({text: w.text.trim(), fromMs: w.startMs, toMs: w.endMs})),
      });
    }
  }
  return pages;
};

/**
 * Untertitel im Kit-Stil: große Versalien, das gesprochene Wort liegt auf
 * einem Amber-Marker. Seiten wechseln nach Sinnabschnitten.
 *
 * `offsetMs` = Zeitpunkt im Clip, der Frame 0 dieser Ebene entspricht.
 */
export const CaptionLayer: React.FC<{
  captions: Caption[];
  offsetMs?: number;
  y?: number;
  size?: number;
  maxWords?: number;
}> = ({captions, offsetMs = 0, y, size, maxWords = 4}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, isReel} = useFormat();
  const words = React.useMemo(() => toWords(captions), [captions]);
  const pages = React.useMemo(() => paginate(words, maxWords), [words, maxWords]);
  const now = offsetMs + (frame / fps) * 1000;
  const page = pages.find((p, i) => {
    const next = i < pages.length - 1 ? pages[i + 1].startMs : Infinity;
    return now >= p.startMs && now < Math.min(next, p.endMs + 700);
  });
  if (!page) return null;

  const pageFrame = ((now - page.startMs) / 1000) * fps;
  const enter = tween(pageFrame, 0, 7, ease.out);
  const fontSize = size ?? (isReel ? 76 : 62);
  const top = y ?? (isReel ? 1030 : 880);

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        width: W - 120,
        top,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        columnGap: fontSize * 0.26,
        rowGap: fontSize * 0.12,
        transform: `translateY(${(1 - enter) * 24}px) scale(${0.94 + 0.06 * enter})`,
        opacity: enter,
      }}
    >
      {page.tokens.map((t, i) => {
        const active = now >= t.fromMs && now < t.toMs;
        const past = now >= t.toMs;
        const aFrame = ((now - t.fromMs) / 1000) * fps;
        const bump = active ? 1 + 0.08 * Math.max(0, 1 - aFrame / 5) : 1;
        return (
          <span
            key={`${t.fromMs}-${i}`}
            style={{
              position: 'relative',
              display: 'inline-block',
              fontFamily: F.display,
              fontWeight: 800,
              fontStretch: '82%',
              fontSize,
              lineHeight: 1.02,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              color: active ? C.ink : C.white,
              opacity: active || past ? 1 : 0.62,
              padding: '0.04em 0.14em 0.02em',
              margin: '0 -0.14em',
              borderRadius: '0.14em',
              background: active ? C.amber : 'transparent',
              transform: `scale(${bump}) rotate(${active ? -1.5 : 0}deg)`,
              textShadow: active ? 'none' : '0 4px 0 rgba(16,13,36,0.55), 0 0 26px rgba(16,13,36,0.85)',
              boxShadow: active ? '0 10px 30px rgba(255,194,75,0.35)' : 'none',
            }}
          >
            {t.text.trim()}
          </span>
        );
      })}
    </div>
  );
};
