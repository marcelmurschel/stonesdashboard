import React from 'react';
import {Img, staticFile} from 'remotion';
import {hash, seeded} from '../brand/motion';
import {C, F} from '../brand/tokens';

const PALETTES: Array<[string, string, string]> = [
  ['#2F6BE0', '#7FD3FF', '#173A86'],
  ['#E0582F', '#FFB45C', '#7E2A12'],
  ['#138C80', '#8EE8C8', '#0A4C45'],
  ['#8B3FB0', '#F29BCB', '#4B1C63'],
  ['#E8A600', '#FFE38A', '#7A5600'],
  ['#C23A48', '#FF9F8E', '#6B1822'],
  ['#2D6A4F', '#B7E4C7', '#163A2B'],
  ['#3D5A80', '#98C1D9', '#1E2F45'],
  ['#5F58B1', '#43E6A8', '#2E2A66'],
];

export const paletteFor = (title: string, color?: string): [string, string, string] => {
  if (color) {
    return [color, `color-mix(in srgb, ${color} 45%, white)`, `color-mix(in srgb, ${color} 55%, black)`];
  }
  return PALETTES[Math.floor(hash(title) * PALETTES.length) % PALETTES.length];
};

const Pattern: React.FC<{kind: number; size: number; seed: number}> = ({kind, size, seed}) => {
  const r = seeded(seed);
  const s = size;
  const els: React.ReactNode[] = [];
  if (kind === 0) {
    // Hex-Plättchen
    const R = s / 7;
    const h = Math.sqrt(3) * R;
    for (let row = -1; row < 9; row++) {
      for (let col = -1; col < 7; col++) {
        const cx = col * R * 1.5;
        const cy = row * h + (col % 2 ? h / 2 : 0);
        const pts = Array.from({length: 6}, (_, k) => {
          const a = (Math.PI / 3) * k;
          return `${cx + R * 0.92 * Math.cos(a)},${cy + R * 0.92 * Math.sin(a)}`;
        }).join(' ');
        els.push(
          <polygon key={`${row}-${col}`} points={pts} fill={r() > 0.72 ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.06)'} />,
        );
      }
    }
  } else if (kind === 1) {
    // Ringe
    const cx = s * (0.6 + r() * 0.3);
    const cy = s * (0.2 + r() * 0.2);
    for (let k = 1; k < 12; k++) {
      els.push(<circle key={k} cx={cx} cy={cy} r={k * s * 0.09} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={s * 0.018} />);
    }
  } else if (kind === 2) {
    // Diagonale Streifen
    for (let k = -10; k < 20; k++) {
      els.push(
        <rect key={k} x={k * s * 0.09} y={-s} width={s * 0.035} height={s * 3} fill="rgba(255,255,255,0.10)" transform={`rotate(35 ${s / 2} ${s / 2})`} />,
      );
    }
  } else if (kind === 3) {
    // Würfelaugen-Raster
    const n = 7;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const big = r() > 0.8;
        els.push(
          <circle
            key={`${x}-${y}`}
            cx={(x + 0.5) * (s / n)}
            cy={(y + 0.5) * (s / n)}
            r={big ? s * 0.03 : s * 0.014}
            fill={big ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'}
          />,
        );
      }
    }
  } else {
    // Hügel / Landschaft
    for (let k = 0; k < 5; k++) {
      const y0 = s * (0.35 + k * 0.1);
      const a = s * (0.04 + r() * 0.05);
      const ph = r() * 6;
      const pts = Array.from({length: 21}, (_, i) => {
        const x = (i / 20) * s;
        return `${x},${y0 + Math.sin(i * 0.5 + ph) * a}`;
      }).join(' L ');
      els.push(<path key={k} d={`M 0 ${s} L ${pts} L ${s} ${s} Z`} fill={`rgba(0,0,0,${0.06 + k * 0.04})`} />);
    }
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{position: 'absolute', inset: 0}}>
      {els}
    </svg>
  );
};

/** Generierte Cover-Kunst, solange kein echtes Cover vorliegt. */
export const CoverArt: React.FC<{title: string; publisher?: string; size: number; color?: string}> = ({
  title,
  publisher,
  size,
  color,
}) => {
  const [c1, c2, c3] = paletteFor(title, color);
  const h = hash(title);
  const kind = Math.floor(h * 997) % 5;
  const long = title.length > 14;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(150deg, ${c2} -10%, ${c1} 55%, ${c3} 120%)`,
        overflow: 'hidden',
      }}
    >
      <Pattern kind={kind} size={size} seed={h} />
      <div
        style={{
          position: 'absolute',
          inset: size * 0.045,
          border: `${Math.max(2, size * 0.008)}px solid rgba(255,255,255,0.35)`,
          borderRadius: size * 0.02,
        }}
      />
      {publisher ? (
        <div
          style={{
            position: 'absolute',
            top: size * 0.085,
            left: size * 0.09,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: size * 0.042,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {publisher}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: size * 0.09,
          right: size * 0.09,
          bottom: size * 0.09,
          fontFamily: F.display,
          fontWeight: 800,
          fontStretch: '78%',
          fontSize: size * (long ? 0.13 : 0.17),
          lineHeight: 0.92,
          letterSpacing: '-0.01em',
          color: C.white,
          textShadow: `0 ${size * 0.01}px ${size * 0.04}px rgba(0,0,0,0.35)`,
          textWrap: 'balance',
        }}
      >
        {title}
      </div>
    </div>
  );
};

/**
 * Spieleschachtel in echtem 3D (CSS preserve-3d). Front = Cover
 * (eigenes Bild aus public/covers oder generierte Kunst).
 */
export const GameBox: React.FC<{
  title: string;
  publisher?: string;
  image?: string;
  color?: string;
  size: number;
  depth?: number;
  rotY?: number;
  rotX?: number;
  rotZ?: number;
  /** Glanzlicht-Position -1 … 1 */
  shine?: number;
  style?: React.CSSProperties;
}> = ({title, publisher, image, color, size, depth, rotY = -18, rotX = 8, rotZ = 0, shine = 0, style}) => {
  const d = depth ?? size * 0.16;
  const [c1, , c3] = paletteFor(title, color);
  const side = `linear-gradient(180deg, ${c1} 0%, ${c3} 100%)`;
  const face: React.CSSProperties = {position: 'absolute', backfaceVisibility: 'hidden'};
  return (
    <div style={{width: size, height: size, perspective: size * 4, ...style}}>
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
        }}
      >
        {/* Front */}
        <div
          style={{
            ...face,
            inset: 0,
            transform: `translateZ(${d / 2}px)`,
            borderRadius: size * 0.018,
            overflow: 'hidden',
            background: c1,
          }}
        >
          {image ? (
            <Img
              src={image.startsWith('http') ? image : staticFile(image)}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : (
            <CoverArt title={title} publisher={publisher} size={size} color={color} />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(115deg, rgba(255,255,255,0) ${30 + shine * 40}%, rgba(255,255,255,0.28) ${
                40 + shine * 40
              }%, rgba(255,255,255,0) ${52 + shine * 40}%)`,
              mixBlendMode: 'screen',
            }}
          />
        </div>
        {/* Rückseite */}
        <div style={{...face, inset: 0, transform: `rotateY(180deg) translateZ(${d / 2}px)`, background: c3}} />
        {/* Seiten */}
        <div
          style={{
            ...face,
            width: d,
            height: size,
            left: (size - d) / 2,
            top: 0,
            transform: `rotateY(90deg) translateZ(${size / 2}px)`,
            background: side,
            filter: 'brightness(0.72)',
          }}
        />
        <div
          style={{
            ...face,
            width: d,
            height: size,
            left: (size - d) / 2,
            top: 0,
            transform: `rotateY(-90deg) translateZ(${size / 2}px)`,
            background: side,
            filter: 'brightness(0.6)',
          }}
        />
        <div
          style={{
            ...face,
            width: size,
            height: d,
            top: (size - d) / 2,
            left: 0,
            transform: `rotateX(90deg) translateZ(${size / 2}px)`,
            background: side,
            filter: 'brightness(1.08)',
          }}
        />
        <div
          style={{
            ...face,
            width: size,
            height: d,
            top: (size - d) / 2,
            left: 0,
            transform: `rotateX(-90deg) translateZ(${size / 2}px)`,
            background: side,
            filter: 'brightness(0.5)',
          }}
        />
      </div>
    </div>
  );
};
