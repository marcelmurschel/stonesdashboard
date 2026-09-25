import './brand/fonts';
import React from 'react';
import {Composition, Folder} from 'remotion';
import {FORMATS} from './brand/format';
import {FPS} from './brand/tokens';
import {Captions, captionsDefaults, captionsMetadata, captionsSchema} from './templates/Captions';
import {ChompDemo} from './templates/ChompDemo';
import {Episode, episodeDefaults, episodeMetadata, showreelDefaults} from './templates/Episode';
import {CreatorCharts, chartsDefaults, chartsDuration, chartsSchema} from './templates/CreatorCharts';
import {Hook, hookDefaults, hookSchema} from './templates/Hook';
import {Intro, introDefaults, introSchema} from './templates/Intro';
import {LowerThird, lowerThirdDefaults, lowerThirdSchema} from './templates/LowerThird';
import {Outro, outroDefaults, outroSchema} from './templates/Outro';
import {STAT_FRAMES, StatReveal, statDefaults, statSchema} from './templates/StatReveal';
import {TREND_FRAMES, TrendLine, trendDefaults, trendSchema} from './templates/TrendLine';
import {VERSUS_FRAMES, Versus, versusDefaults, versusSchema} from './templates/Versus';

const {reel, feed} = FORMATS;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Marke">
        <Composition id="Intro" component={Intro} schema={introSchema} defaultProps={introDefaults} durationInFrames={90} fps={FPS} {...reel} />
        <Composition id="Intro-Feed" component={Intro} schema={introSchema} defaultProps={introDefaults} durationInFrames={90} fps={FPS} {...feed} />
        <Composition id="Bauchbinde" component={LowerThird} schema={lowerThirdSchema} defaultProps={lowerThirdDefaults} durationInFrames={150} fps={FPS} {...reel} />
        <Composition id="Bauchbinde-Feed" component={LowerThird} schema={lowerThirdSchema} defaultProps={lowerThirdDefaults} durationInFrames={150} fps={FPS} {...feed} />
        <Composition id="Krokodil-Blende" component={ChompDemo} durationInFrames={36 + 44 - 22} fps={FPS} {...reel} />
        <Composition id="Outro" component={Outro} schema={outroSchema} defaultProps={outroDefaults} durationInFrames={120} fps={FPS} {...reel} />
        <Composition id="Outro-Feed" component={Outro} schema={outroSchema} defaultProps={outroDefaults} durationInFrames={120} fps={FPS} {...feed} />
      </Folder>
      <Folder name="Daten">
        <Composition
          id="Creator-Charts"
          component={CreatorCharts}
          schema={chartsSchema}
          defaultProps={chartsDefaults}
          durationInFrames={chartsDuration(chartsDefaults.entries.length)}
          calculateMetadata={({props}) => ({durationInFrames: chartsDuration(props.entries.length)})}
          fps={FPS}
          {...reel}
        />
        <Composition
          id="Creator-Charts-Feed"
          component={CreatorCharts}
          schema={chartsSchema}
          defaultProps={chartsDefaults}
          durationInFrames={chartsDuration(chartsDefaults.entries.length)}
          calculateMetadata={({props}) => ({durationInFrames: chartsDuration(props.entries.length)})}
          fps={FPS}
          {...feed}
        />
        <Composition id="Datenpunkt" component={StatReveal} schema={statSchema} defaultProps={statDefaults} durationInFrames={STAT_FRAMES} fps={FPS} {...reel} />
        <Composition id="Datenpunkt-Feed" component={StatReveal} schema={statSchema} defaultProps={statDefaults} durationInFrames={STAT_FRAMES} fps={FPS} {...feed} />
        <Composition id="Hype-Kurve" component={TrendLine} schema={trendSchema} defaultProps={trendDefaults} durationInFrames={TREND_FRAMES} fps={FPS} {...reel} />
        <Composition id="Hype-Kurve-Feed" component={TrendLine} schema={trendSchema} defaultProps={trendDefaults} durationInFrames={TREND_FRAMES} fps={FPS} {...feed} />
        <Composition id="Duell" component={Versus} schema={versusSchema} defaultProps={versusDefaults} durationInFrames={VERSUS_FRAMES} fps={FPS} {...reel} />
        <Composition id="Duell-Feed" component={Versus} schema={versusSchema} defaultProps={versusDefaults} durationInFrames={VERSUS_FRAMES} fps={FPS} {...feed} />
      </Folder>
      <Folder name="Talking-Head">
        <Composition id="Hook" component={Hook} schema={hookSchema} defaultProps={hookDefaults} durationInFrames={120} fps={FPS} {...reel} />
        <Composition id="Hook-Feed" component={Hook} schema={hookSchema} defaultProps={hookDefaults} durationInFrames={120} fps={FPS} {...feed} />
        <Composition
          id="Untertitel"
          component={Captions}
          schema={captionsSchema}
          defaultProps={captionsDefaults}
          calculateMetadata={captionsMetadata}
          durationInFrames={240}
          fps={FPS}
          {...reel}
        />
      </Folder>
      <Folder name="Episoden">
        <Composition
          id="Episode"
          component={Episode}
          defaultProps={episodeDefaults}
          calculateMetadata={episodeMetadata}
          durationInFrames={1200}
          fps={FPS}
          {...reel}
        />
        <Composition
          id="Showreel"
          component={Episode}
          defaultProps={showreelDefaults}
          calculateMetadata={episodeMetadata}
          durationInFrames={1600}
          fps={FPS}
          {...reel}
        />
        <Composition
          id="Episode-Feed"
          component={Episode}
          defaultProps={episodeDefaults}
          calculateMetadata={episodeMetadata}
          durationInFrames={1200}
          fps={FPS}
          {...feed}
        />
      </Folder>
    </>
  );
};
