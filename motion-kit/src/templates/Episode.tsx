import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, type CalculateMetadataFunction} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import type {Caption} from '@remotion/captions';
import sample from '../../data/episode-beispiel.json';
import showreel from '../../data/showreel.json';
import {FPS} from '../brand/tokens';
import {CaptionLayer} from '../components/CaptionLayer';
import {Footage} from '../components/Footage';
import {SafeZones} from '../components/Kit';
import {bubbleDefaults} from '../components/SceneBubble';
import {chomp} from '../transitions/Chomp';
import {chartsDefaults, chartsDuration, CreatorCharts, type ChartsProps} from './CreatorCharts';
import {Hook, hookDefaults, type HookProps} from './Hook';
import {Intro, introDefaults} from './Intro';
import {LowerThird, lowerThirdDefaults} from './LowerThird';
import {Outro, outroDefaults, type OutroProps} from './Outro';
import {STAT_FRAMES, StatReveal, statDefaults, type StatProps} from './StatReveal';
import {TREND_FRAMES, TrendLine, trendDefaults, type TrendProps} from './TrendLine';
import {VERSUS_FRAMES, Versus, versusDefaults, type VersusProps} from './Versus';

/**
 * Szenen einer Folge. Die Inhalte sind optional – alles, was fehlt,
 * kommt aus den Beispiel-Daten (data/*-beispiel.json).
 */
export type Scene =
  | {type: 'intro'}
  | {
      type: 'talk';
      seconds: number;
      /** Hook-Overlay am Anfang der Szene ({} = Beispiel-Hook) */
      hook?: Partial<Pick<HookProps, 'eyebrow' | 'lines' | 'receipt'>>;
      /** Bauchbinde einblenden */
      lowerThird?: boolean;
      /** Untertitel relativ zum Szenenstart */
      captions?: Caption[];
    }
  | {type: 'charts'; data?: Partial<ChartsProps>}
  | {type: 'stat'; data?: Partial<StatProps>}
  | {type: 'trend'; data?: Partial<TrendProps>}
  | {type: 'versus'; data?: Partial<VersusProps>}
  | {type: 'outro'; data?: Partial<OutroProps>};

export type EpisodeProps = {
  /** Talking-Head-Clip (ein durchgehender Take) in public/, leer = Platzhalter */
  footage: string;
  /** Untertitel relativ zum Clip-Start (z. B. aus Whisper) */
  captions: Caption[];
  scenes: Scene[];
  sfx: boolean;
  showSafeZones: boolean;
};

export const episodeDefaults: EpisodeProps = {
  footage: sample.footage,
  captions: sample.captions as Caption[],
  scenes: sample.scenes as Scene[],
  sfx: true,
  showSafeZones: false,
};

/** Alle Templates hintereinander – zum Durchsehen des Kits. */
export const showreelDefaults: EpisodeProps = {
  footage: showreel.footage,
  captions: showreel.captions as Caption[],
  scenes: showreel.scenes as Scene[],
  sfx: true,
  showSafeZones: false,
};

export const TRANSITION = 22;
const HOOK_LEN = 118;
const LT_LEN = 150;

export const sceneFrames = (s: Scene): number => {
  switch (s.type) {
    case 'intro':
      return 90;
    case 'talk':
      return Math.max(30, Math.round(s.seconds * FPS));
    case 'charts':
      return chartsDuration((s.data?.entries ?? chartsDefaults.entries).length);
    case 'stat':
      return STAT_FRAMES;
    case 'trend':
      return TREND_FRAMES;
    case 'versus':
      return VERSUS_FRAMES;
    case 'outro':
      return 120;
  }
};

/** Start-Frames aller Szenen (Blenden überlappen um TRANSITION Frames). */
export const timeline = (scenes: Scene[]) => {
  let t = 0;
  return scenes.map((scene, i) => {
    const dur = sceneFrames(scene);
    const start = t;
    t += dur - (i < scenes.length - 1 ? TRANSITION : 0);
    return {scene, start, dur};
  });
};

export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({props}) => {
  const tl = timeline(props.scenes);
  const last = tl[tl.length - 1];
  return {durationInFrames: last ? last.start + last.dur : 30};
};

/**
 * Eine komplette Folge aus Szenen: Intro → Talking Head mit Hook,
 * Bauchbinde und Untertiteln → Datengrafiken (du bleibst als Bubble im
 * Bild) → Outro. Zwischen allen Szenen die Krokodil-Blende.
 *
 * Der Ton deines Clips läuft durchgehend – die Grafiken liegen darüber
 * wie ein Voice-over, die Bubble zeigt dich lippensynchron.
 */
export const Episode: React.FC<EpisodeProps> = ({footage, captions, scenes, sfx, showSafeZones}) => {
  const tl = timeline(scenes);
  const firstTalk = tl.find((t) => t.scene.type === 'talk');
  const clipStart = firstTalk ? firstTalk.start : 0;
  const outro = tl.find((t) => t.scene.type === 'outro');
  const total = tl.length ? tl[tl.length - 1].start + tl[tl.length - 1].dur : 0;
  const audioEnd = outro ? outro.start + 10 : total;
  const clipTime = (start: number) => Math.max(0, (start - clipStart) / FPS);
  const bubble = (start: number) => ({...bubbleDefaults, footage, trimStart: clipTime(start)});

  const render = ({scene, start, dur}: ReturnType<typeof timeline>[number]) => {
    switch (scene.type) {
      case 'intro':
        return <Intro {...introDefaults} sfx={sfx} />;
      case 'talk':
        return (
          <AbsoluteFill>
            <Footage src={footage || undefined} trimStart={clipTime(start)} muted length={dur} push={1.05} />
            {captions.length ? <CaptionLayer captions={captions} offsetMs={clipTime(start) * 1000} /> : null}
            {scene.captions?.length ? <CaptionLayer captions={scene.captions} /> : null}
            {scene.hook ? (
              <Sequence durationInFrames={Math.min(HOOK_LEN, dur)} layout="none">
                <Hook {...hookDefaults} {...scene.hook} transparent sfx={sfx} length={Math.min(HOOK_LEN, dur)} />
              </Sequence>
            ) : null}
            {scene.lowerThird ? (
              <Sequence
                from={scene.hook ? Math.min(HOOK_LEN - 20, Math.max(0, dur - LT_LEN)) : 12}
                durationInFrames={Math.min(LT_LEN, dur)}
                layout="none"
              >
                <LowerThird {...lowerThirdDefaults} transparent sfx={sfx} length={Math.min(LT_LEN, dur)} />
              </Sequence>
            ) : null}
          </AbsoluteFill>
        );
      case 'charts':
        return <CreatorCharts {...chartsDefaults} {...scene.data} bubble={bubble(start)} sfx={sfx} />;
      case 'stat':
        return <StatReveal {...statDefaults} {...scene.data} bubble={bubble(start)} sfx={sfx} />;
      case 'trend':
        return <TrendLine {...trendDefaults} {...scene.data} bubble={bubble(start)} sfx={sfx} />;
      case 'versus':
        return <Versus {...versusDefaults} {...scene.data} bubble={bubble(start)} sfx={sfx} />;
      case 'outro':
        return <Outro {...outroDefaults} {...scene.data} sfx={sfx} length={dur} />;
    }
  };

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {tl.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <TransitionSeries.Transition presentation={chomp({sfx})} timing={linearTiming({durationInFrames: TRANSITION})} />
            ) : null}
            <TransitionSeries.Sequence durationInFrames={item.dur} name={`${i + 1} · ${item.scene.type}`}>
              {render(item)}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      {footage && firstTalk ? (
        <Sequence from={clipStart} durationInFrames={Math.max(1, audioEnd - clipStart)} name="Ton: Talking Head">
          <Html5Audio src={footage.startsWith('http') ? footage : staticFile(footage)} />
        </Sequence>
      ) : null}
      <SafeZones show={showSafeZones} />
    </AbsoluteFill>
  );
};
