import React from 'react';
import {C} from './tokens';

/**
 * Krokodil-Bildmarke (Platzhalter).
 *
 * Aufgebaut aus Einzelteilen, damit sie animierbar ist:
 * Oberkiefer, Unterkiefer, Zahnreihen, Auge mit Lid und drei
 * Rückenschuppen, die als kleines Balkendiagramm wachsen.
 *
 * Sobald die Original-Datei aus den CI-Guidelines vorliegt, wird dieses
 * Bauteil nachgebaut – die Props bleiben gleich.
 */
export type CrocMarkProps = {
  /** Breite in px (Höhe ergibt sich aus 420:210) */
  size?: number;
  /** Maul-Öffnung 0 (zu) … 1 (weit offen) */
  open?: number;
  /** Rückenschuppen-Balken 0 … 1 */
  bars?: number;
  /** Lid 0 (offen) … 1 (geschlossen) */
  blink?: number;
  /** Pupillen-Verschiebung in px (Blickrichtung) */
  look?: number;
  /** 'brand' = Lila-Krokodil, 'light' = für helle Flächen, 'mono' = einfarbig */
  variant?: 'brand' | 'light' | 'mono';
  monoColor?: string;
  /** Detailfarbe (Auge, Zähne) in der Mono-Variante, meist die Hintergrundfarbe */
  monoCut?: string;
  style?: React.CSSProperties;
};

const UPPER =
  'M 44 128 L 36 100 C 34 84 44 72 62 68 L 112 63 A 34 34 0 0 1 180 63 L 344 75 A 15.5 15.5 0 0 1 374 77 C 394 79 408 90 409 104 C 410 115 404 122 393 123 Z';
const LOWER =
  'M 48 131 L 390 127 C 402 127 408 135 404 143 C 399 151 386 155 364 157 C 290 164 190 170 120 168 C 84 167 62 156 48 131 Z';

const rot = (x: number, y: number, deg: number, cx: number, cy: number) => {
  const r = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)];
};

const mouthPath = (upperRot: number, lowerRot: number) => {
  const [ux, uy] = rot(396, 122, upperRot, 40, 128);
  const [lx, ly] = rot(394, 129, lowerRot, 44, 131);
  return `M 42 130 L ${ux} ${uy} L ${lx} ${ly} Z`;
};

const upperEdgeY = (x: number) => 128 - (5 * (x - 44)) / 349;
const lowerEdgeY = (x: number) => 131 - (4 * (x - 48)) / 342;

const teeth = (from: number, to: number, step: number, dir: 'down' | 'up') => {
  const out: string[] = [];
  for (let x = from; x <= to; x += step) {
    if (dir === 'down') {
      const y = upperEdgeY(x) - 2;
      out.push(`M ${x - 12} ${y} L ${x + 12} ${y} L ${x + 1} ${y + 22} Z`);
    } else {
      const y = lowerEdgeY(x) + 2;
      out.push(`M ${x - 11} ${y} L ${x + 11} ${y} L ${x - 1} ${y - 19} Z`);
    }
  }
  return out.join(' ');
};

const UPPER_TEETH = teeth(134, 374, 48, 'down');
const LOWER_TEETH = teeth(158, 350, 48, 'up');

export const CrocMark: React.FC<CrocMarkProps> = ({
  size = 420,
  open = 0,
  bars = 1,
  blink = 0,
  look = 0,
  variant = 'brand',
  monoColor = C.white,
  monoCut = C.violet,
  style,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const upperRot = -open * 26;
  const lowerRot = open * 9;

  const pal =
    variant === 'mono'
      ? {
          upper: monoColor,
          lower: monoColor,
          teeth: monoCut,
          mouth: monoCut,
          bar: monoColor,
          eyeWhite: monoCut,
          iris: monoColor,
          pupil: monoCut,
          nostril: monoCut,
          lid: monoColor,
        }
      : {
          upper: `url(#croc-up-${uid})`,
          lower: variant === 'light' ? '#7C75DA' : '#7770D6',
          teeth: C.paper,
          mouth: C.ink3,
          bar: C.mint,
          eyeWhite: C.white,
          iris: C.amber,
          pupil: C.ink,
          nostril: C.ink,
          lid: C.violet,
        };

  const barH = [18, 30, 44].map((h) => h * Math.max(0, bars));

  return (
    <svg
      width={size}
      height={(size * 210) / 420}
      viewBox="0 -10 420 210"
      style={{overflow: 'visible', ...style}}
    >
      <defs>
        <linearGradient id={`croc-up-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={variant === 'light' ? '#6B64C4' : '#6E67C9'} />
          <stop offset="1" stopColor={C.violet} />
        </linearGradient>
        <clipPath id={`croc-eye-${uid}`}>
          <circle cx={146} cy={50} r={15.5} />
        </clipPath>
      </defs>

      {/* Mundraum (nur sichtbar, wenn geöffnet) */}
      {open > 0.001 ? (
        <path d={mouthPath(upperRot, lowerRot)} fill={pal.mouth} />
      ) : null}

      {/* Unterkiefer */}
      <g transform={`rotate(${lowerRot} 44 131)`}>
        <path d={LOWER} fill={pal.lower} />
      </g>

      {/* Oberkiefer mit Rückenschuppen-Balken */}
      <g transform={`rotate(${upperRot} 40 128)`}>
        {[0, 1, 2].map((i) => {
          const x = 48 + i * 19;
          const h = barH[i];
          const bottom = 86 - i * 4;
          return h > 0.5 ? (
            <rect
              key={i}
              x={x}
              y={bottom - 22 - h}
              width={14}
              height={h + 22}
              rx={6}
              fill={pal.bar}
            />
          ) : null;
        })}
        <path d={UPPER} fill={pal.upper} />
        {/* Nasenloch */}
        <ellipse cx={362} cy={71} rx={4.2} ry={3} fill={pal.nostril} />
        {/* Auge */}
        <g clipPath={`url(#croc-eye-${uid})`}>
          <circle cx={146} cy={50} r={15.5} fill={pal.eyeWhite} />
          <circle cx={148 + look} cy={51} r={11} fill={pal.iris} />
          <ellipse cx={149 + look} cy={51} rx={3.3} ry={8.6} fill={pal.pupil} />
          <circle cx={151 + look} cy={45} r={2.4} fill={variant === 'mono' ? monoCut : C.white} />
          {blink > 0.001 ? (
            <rect x={128} y={33} width={36} height={34 * Math.min(1, blink)} fill={pal.lid} />
          ) : null}
        </g>
      </g>

      {/* Zahnreihen liegen über beiden Kiefern (Krokodile zeigen die Zähne auch geschlossen) */}
      <g transform={`rotate(${lowerRot} 44 131)`}>
        <path d={LOWER_TEETH} fill={pal.teeth} />
      </g>
      <g transform={`rotate(${upperRot} 40 128)`}>
        <path d={UPPER_TEETH} fill={pal.teeth} />
      </g>
    </svg>
  );
};
