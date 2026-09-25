// Rendert Einzelbilder für die visuelle Kontrolle – ein Bundle, ein Browser.
// Aufruf: node scripts/qa-stills.mjs <CompositionId> <frame,frame,...> [scale] [outDir]
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';

const [, , idsArg, framesArg, scaleArg = '0.5', outDir = 'out/qa'] = process.argv;
if (!idsArg || !framesArg) {
  console.error('Usage: node scripts/qa-stills.mjs <Id[,Id2]> <f1,f2,...> [scale] [outDir]');
  process.exit(1);
}
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
fs.mkdirSync(path.join(root, outDir), {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {
  browserExecutable: process.env.REMOTION_CHROME_EXECUTABLE ?? null,
  chromiumOptions: {gl: 'angle'},
});

for (const id of idsArg.split(',')) {
  const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
  const frames =
    framesArg === 'auto'
      ? Array.from({length: 8}, (_, i) => Math.round((i / 7) * (composition.durationInFrames - 1)))
      : framesArg.split(',').map(Number);
  for (const frame of frames) {
    const output = path.join(root, outDir, `${id}-${String(frame).padStart(4, '0')}.png`);
    await renderStill({
      serveUrl,
      composition,
      frame,
      output,
      scale: Number(scaleArg),
      puppeteerInstance: browser,
      overwrite: true,
    });
    console.log('✓', path.relative(root, output));
  }
}
await browser.close({silent: true});
