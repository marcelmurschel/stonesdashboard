import React from 'react';
import {AbsoluteFill, staticFile, type CalculateMetadataFunction} from 'remotion';
import {parseSrt, type Caption} from '@remotion/captions';
import {z} from 'zod';
import sample from '../../data/untertitel-beispiel.json';
import {FPS} from '../brand/tokens';
import {captionSchema, CaptionLayer} from '../components/CaptionLayer';
import {Footage} from '../components/Footage';
import {SafeZones} from '../components/Kit';

export const captionsSchema = z.object({
  footage: z.string(),
  /** Alternativ zu `captions`: SRT-Datei in public/ (z. B. aus CapCut, Premiere, Whisper) */
  srtFile: z.string(),
  captions: z.array(captionSchema),
  transparent: z.boolean(),
  showSafeZones: z.boolean(),
});
export type CaptionsProps = z.infer<typeof captionsSchema>;

export const captionsDefaults: CaptionsProps = {
  footage: '',
  srtFile: '',
  captions: sample.captions as Caption[],
  transparent: false,
  showSafeZones: false,
};

/** Länge aus den Untertiteln ableiten, SRT-Datei bei Bedarf laden. */
export const captionsMetadata: CalculateMetadataFunction<CaptionsProps> = async ({props}) => {
  let captions = props.captions;
  if (props.srtFile) {
    const text = await fetch(staticFile(props.srtFile)).then((r) => r.text());
    captions = parseSrt({input: text}).captions;
  }
  const endMs = captions.reduce((m, c) => Math.max(m, c.endMs), 0);
  return {
    props: {...props, captions},
    durationInFrames: Math.max(30, Math.ceil(((endMs + 800) / 1000) * FPS)),
  };
};

/** Untertitel-Spur über dem Talking Head (oder transparent zum Drüberlegen). */
export const Captions: React.FC<CaptionsProps> = ({footage, captions, transparent, showSafeZones}) => {
  return (
    <AbsoluteFill>
      {transparent ? null : <Footage src={footage || undefined} push={1.03} />}
      <CaptionLayer captions={captions as Caption[]} />
      <SafeZones show={showSafeZones} />
    </AbsoluteFill>
  );
};
