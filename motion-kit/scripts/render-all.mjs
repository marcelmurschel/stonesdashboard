// Rendert alle Vorschau-Videos in einem Rutsch (ein Bundle, ein Browser).
//
//   npm run render:all                 → alle 9:16-Vorlagen als MP4 nach out/
//   npm run render:all -- --feed       → zusätzlich die 4:5-Varianten
//   npm run render:all -- --alpha      → Overlays (Bauchbinde, Hook, Untertitel) als ProRes 4444 mit Alpha
//   npm run render:all -- --only=Episode,Creator-Charts
//   npm run render:all -- --props=data/charts-kw39.json --only=Creator-Charts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const REEL = [
  'Showreel',
  'Episode',
  'Intro',
  'Bauchbinde',
  'Hook',
  'Untertitel',
  'Krokodil-Blende',
  'Creator-Charts',
  'Datenpunkt',
  'Hype-Kurve',
  'Duell',
  'Outro',
];
const FEED = ['Intro-Feed', 'Bauchbinde-Feed', 'Hook-Feed', 'Creator-Charts-Feed', 'Datenpunkt-Feed', 'Hype-Kurve-Feed', 'Duell-Feed', 'Outro-Feed', 'Episode-Feed'];
const ALPHA = ['Bauchbinde', 'Hook', 'Untertitel'];

const only = typeof args.only === 'string' ? args.only.split(',') : null;
const extraProps = typeof args.props === 'string' ? JSON.parse(fs.readFileSync(path.resolve(root, args.props), 'utf8')) : {};
const outDir = path.join(root, typeof args.out === 'string' ? args.out : 'out');
fs.mkdirSync(outDir, {recursive: true});

const jobs = [];
for (const id of [...REEL, ...(args.feed ? FEED : [])]) {
  if (only && !only.includes(id)) continue;
  jobs.push({id, file: `${id.toLowerCase()}.mp4`, alpha: false});
}
if (args.alpha) {
  for (const id of ALPHA) {
    if (only && !only.includes(id)) continue;
    jobs.push({id, file: `${id.toLowerCase()}-alpha.mov`, alpha: true});
  }
}

console.log(`Bundle wird erstellt …`);
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {
  browserExecutable: process.env.REMOTION_CHROME_EXECUTABLE ?? null,
  chromiumOptions: {gl: 'angle'},
});

for (const job of jobs) {
  const inputProps = {...extraProps, ...(job.alpha ? {transparent: true, sfx: false} : {})};
  const composition = await selectComposition({serveUrl, id: job.id, inputProps, puppeteerInstance: browser});
  const outputLocation = path.join(outDir, job.file);
  const t0 = Date.now();
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    puppeteerInstance: browser,
    outputLocation,
    overwrite: true,
    concurrency: Number(args.concurrency ?? os.cpus().length),
    ...(job.alpha
      ? {codec: 'prores', proResProfile: '4444', pixelFormat: 'yuva444p10le', imageFormat: 'png'}
      : {codec: 'h264', crf: 18, pixelFormat: 'yuv420p', imageFormat: 'jpeg', jpegQuality: 94, audioCodec: 'aac'}),
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`\r${job.id.padEnd(22)} ${String(p * 10).padStart(3)} %`);
      }
    },
  });
  const mb = (fs.statSync(outputLocation).size / 1e6).toFixed(1);
  console.log(`\r✓ ${job.id.padEnd(22)} → ${path.relative(root, outputLocation)}  (${mb} MB, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

await browser.close({silent: true});
