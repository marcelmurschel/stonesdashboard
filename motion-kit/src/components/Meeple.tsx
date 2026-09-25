import React from 'react';

/** Klassische Meeple-Silhouette als Daten-Einheit (Waffle-Charts, Score-Track). */
export const MEEPLE_PATH =
  'M50 5 C61 5 69 13 69 24 C69 30 66.5 34.5 62.5 37.5 L86 45 C94.5 47.8 98 54.5 95.5 60.5 C93.2 66 87.2 68 81 66 L71 62.8 L83.5 88.5 C86 93.8 82.6 98 77 98 L61 98 C57.8 98 55.6 96.3 54.6 93.3 L50 80.5 L45.4 93.3 C44.4 96.3 42.2 98 39 98 L23 98 C17.4 98 14 93.8 16.5 88.5 L29 62.8 L19 66 C12.8 68 6.8 66 4.5 60.5 C2 54.5 5.5 47.8 14 45 L37.5 37.5 C33.5 34.5 31 30 31 24 C31 13 39 5 50 5 Z';

export const Meeple: React.FC<{
  size: number;
  color: string;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}> = ({size, color, stroke, strokeWidth = 0, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', ...style}}>
    <path d={MEEPLE_PATH} fill={color} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </svg>
);
