import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ease, tween} from '../brand/motion';
import {C} from '../brand/tokens';

/**
 * Textzeile mit *Markierung*: Wörter zwischen Sternchen bekommen einen
 * Textmarker, der von links aufzieht. Unter dem Marker kippt die Schrift
 * in Tinte – wie ein echter Leuchtstift.
 */
export const MarkedLine: React.FC<{
  text: string;
  markStart: number;
  markDur?: number;
  color?: string;
  markColor?: string;
  markText?: string;
}> = ({text, markStart, markDur = 12, color = C.white, markColor = C.amber, markText = C.ink}) => {
  const frame = useCurrentFrame();
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let markIndex = 0;
  return (
    <span style={{color, whiteSpace: 'pre-wrap'}}>
      {parts.map((part, i) => {
        if (!part.startsWith('*')) return <span key={i}>{part}</span>;
        const word = part.slice(1, -1);
        const p = tween(frame, markStart + markIndex++ * 6, markDur, ease.inOut);
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', padding: '0 0.1em', margin: '0 -0.02em'}}>
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '0.1em',
                bottom: '0.02em',
                background: markColor,
                borderRadius: '0.08em',
                transform: `scaleX(${p}) skewX(-6deg)`,
                transformOrigin: '0 50%',
              }}
            />
            <span style={{position: 'relative'}}>{word}</span>
            <span
              style={{
                position: 'absolute',
                left: '0.1em',
                top: 0,
                color: markText,
                clipPath: `inset(-0.2em ${100 - p * 100}% -0.2em -0.2em)`,
              }}
            >
              {word}
            </span>
          </span>
        );
      })}
    </span>
  );
};
