import {Easing, interpolate, spring} from 'remotion';

/**
 * Bewegungssprache
 * - Daten bewegen sich präzise: Expo-Kurven, kein Nachschwingen.
 * - Spielfiguren (Meeples, Karten, Würfel, Krokodil) federn: Springs mit Overshoot.
 * - Abgänge sind schneller als Auftritte (ca. 60 %).
 */
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
} as const;

export const CLAMP = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

/** 0→1 zwischen `start` und `start + dur`, geclampt und mit Easing. */
export const tween = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = ease.out,
): number =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    ...CLAMP,
    easing,
  });

type SpringCfg = {damping?: number; stiffness?: number; mass?: number};

/** Federnder Auftritt für Spielfiguren (leichtes Overshoot). */
export const pop = (frame: number, fps: number, delay = 0, cfg: SpringCfg = {}) =>
  spring({
    frame: frame - delay,
    fps,
    config: {damping: 12, stiffness: 170, mass: 0.8, ...cfg},
  });

/** Deterministischer Pseudo-Zufall (für Partikel, Cover-Muster …). */
export const hash = (input: string | number): number => {
  const s = String(input);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
};

export const seeded = (seed: number) => {
  let t = Math.floor(seed * 2 ** 31) || 1;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
