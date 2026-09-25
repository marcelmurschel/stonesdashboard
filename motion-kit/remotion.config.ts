import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');

// Optional: eigenen Chrome/Chromium nutzen (z. B. in CI oder Cloud-Containern).
if (process.env.REMOTION_CHROME_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME_EXECUTABLE);
}
