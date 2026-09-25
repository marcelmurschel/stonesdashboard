import React from 'react';
import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {C} from '../brand/tokens';
import {Backdrop, Grain} from '../components/Backdrop';
import {Footage} from '../components/Footage';
import {Display, Label} from '../components/Text';
import {chomp} from '../transitions/Chomp';

export const CHOMP_FRAMES = 22;

/** Vorschau der Krokodil-Blende: Talking Head → Grafik. */
export const ChompDemo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={36}>
        <Footage />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={chomp()} timing={linearTiming({durationInFrames: CHOMP_FRAMES})} />
      <TransitionSeries.Sequence durationInFrames={44}>
        <Backdrop>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 20}}>
            <Label color={C.mint}>Nächste Szene</Label>
            <Display size={140}>Die Daten</Display>
          </AbsoluteFill>
          <Grain />
        </Backdrop>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
