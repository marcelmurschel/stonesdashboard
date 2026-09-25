import {useVideoConfig} from 'remotion';

export type FormatId = 'reel' | 'feed';

/** 9:16 – Reels, Stories, TikTok, LinkedIn vertikal · 4:5 – Instagram- und LinkedIn-Feed */
export const FORMATS: Record<FormatId, {width: number; height: number}> = {
  reel: {width: 1080, height: 1920},
  feed: {width: 1080, height: 1350},
};

/**
 * Safe-Zones:
 * Reels/Stories – oben liegen Kamera- und Reels-Label, unten Caption,
 * Username und Audio, rechts die Like/Comment/Share-Buttons (ab etwa y=1000).
 * Feed 4:5 – kaum Overlays, nur ein ruhiger Rand.
 */
export const useFormat = () => {
  const {width: W, height: H} = useVideoConfig();
  const isReel = H / W > 1.5;
  const safe = isReel
    ? {top: 230, bottom: 470, left: 72, right: 72, rightLow: 150}
    : {top: 76, bottom: 76, left: 72, right: 72, rightLow: 72};
  return {
    W,
    H,
    isReel,
    isFeed: !isReel,
    safe,
    /** Innenbreite zwischen den seitlichen Safe-Rändern */
    innerW: W - safe.left - safe.right,
  };
};
