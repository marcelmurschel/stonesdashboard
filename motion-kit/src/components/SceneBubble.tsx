import React from 'react';
import {z} from 'zod';
import {useFormat} from '../brand/format';
import {PERSON} from '../brand/tokens';
import {PresenterBubble} from './Presenter';

/** Du im Kreis während Vollbild-Grafiken (oben rechts, außerhalb der Reels-UI). */
export const bubbleSchema = z.object({
  show: z.boolean(),
  /** Gleicher Clip wie im Talking Head (Pfad in public/), leer = Platzhalter */
  footage: z.string(),
  /** Sekunde im Clip, an der diese Szene beginnt (für lippensynchrone Episoden) */
  trimStart: z.number(),
  name: z.string(),
});
export type BubbleConfig = z.infer<typeof bubbleSchema>;

export const bubbleDefaults: BubbleConfig = {
  show: true,
  footage: '',
  trimStart: 0,
  name: PERSON.name.split(' ')[0],
};

export const BUBBLE_SIZE = {reel: 196, feed: 150};

export const SceneBubble: React.FC<{config: BubbleConfig; start?: number; exit?: number}> = ({config, start = 4, exit}) => {
  const {W, isReel, safe} = useFormat();
  if (!config.show) return null;
  const size = isReel ? BUBBLE_SIZE.reel : BUBBLE_SIZE.feed;
  return (
    <PresenterBubble
      src={config.footage || undefined}
      trimStart={config.trimStart}
      size={size}
      x={W - safe.right - size - 6}
      y={safe.top + (isReel ? 6 : 0)}
      start={start}
      exit={exit}
      name={config.name || undefined}
    />
  );
};

/** Breite, die links neben der Bubble für Titel bleibt. */
export const useTitleWidth = (bubble: boolean) => {
  const {innerW, isReel} = useFormat();
  if (!bubble) return innerW;
  return innerW - (isReel ? BUBBLE_SIZE.reel : BUBBLE_SIZE.feed) - 40;
};
