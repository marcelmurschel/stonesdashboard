// Synthetisiert die Soundeffekte des Motion-Kits (keine Lizenzfragen,
// reproduzierbar). Aufruf: npm run sfx  →  public/sfx/*.wav
import fs from 'node:fs';
import path from 'node:path';

const SR = 48000;
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'public', 'sfx');
fs.mkdirSync(OUT, {recursive: true});

// ---------- Werkzeuge ----------
let seed = 1337;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const white = () => rnd() * 2 - 1;

const coeffs = (type, f0, Q) => {
  const w0 = (2 * Math.PI * Math.min(f0, SR * 0.45)) / SR;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * Q);
  let b0, b1, b2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  if (type === 'lp') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else [b0, b1, b2] = [alpha, 0, -alpha];
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
};

/** Zeitvariabler Biquad-Filter. freq(t) und q(t) werden alle 16 Samples neu berechnet. */
const filter = (input, type, freq, q = () => 0.9) => {
  const out = new Float32Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let c = coeffs(type, freq(0), q(0));
  for (let i = 0; i < input.length; i++) {
    if (i % 16 === 0) c = coeffs(type, freq(i / SR), q(i / SR));
    const x = input[i];
    const y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    out[i] = y;
  }
  return out;
};

const buf = (sec) => new Float32Array(Math.round(sec * SR));
const noise = (sec) => buf(sec).map(white);
const env = (arr, fn) => arr.map((v, i) => v * fn(i / SR));
const mix = (...layers) => {
  const len = Math.max(...layers.map((l) => l.length));
  const out = new Float32Array(len);
  for (const l of layers) for (let i = 0; i < l.length; i++) out[i] += l[i];
  return out;
};
const delay = (arr, sec) => {
  const off = Math.round(sec * SR);
  const out = new Float32Array(arr.length + off);
  out.set(arr, off);
  return out;
};
const gain = (arr, g) => arr.map((v) => v * g);
const sine = (sec, freqFn, phase0 = 0) => {
  const out = buf(sec);
  let ph = phase0;
  for (let i = 0; i < out.length; i++) {
    ph += (2 * Math.PI * freqFn(i / SR)) / SR;
    out[i] = Math.sin(ph);
  }
  return out;
};
const expDecay = (tau) => (t) => Math.exp(-t / tau);
const attackDecay = (att, tau) => (t) => (t < att ? t / att : Math.exp(-(t - att) / tau));
const bell = (dur, peak = 0.5, sharp = 2) => (t) => {
  const x = t / dur;
  if (x <= 0 || x >= 1) return 0;
  return x < peak ? Math.pow(x / peak, sharp) : Math.pow((1 - x) / (1 - peak), sharp * 0.8);
};

const normalize = (arr, peakDb = -1) => {
  let peak = 0;
  for (const v of arr) peak = Math.max(peak, Math.abs(v));
  const target = Math.pow(10, peakDb / 20);
  return peak > 0 ? arr.map((v) => (v / peak) * target) : arr;
};

const fadeOut = (arr, sec = 0.01) => {
  const n = Math.round(sec * SR);
  for (let i = 0; i < n && i < arr.length; i++) arr[arr.length - 1 - i] *= i / n;
  return arr;
};

/** Stereo-WAV schreiben. pan(t) ∈ [-1, 1] */
const write = (name, mono, {peakDb = -1, pan = () => 0} = {}) => {
  const data = fadeOut(normalize(mono, peakDb));
  const n = data.length;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const p = pan(i / SR);
    const l = data[i] * Math.cos(((p + 1) * Math.PI) / 4) * Math.SQRT2;
    const r = data[i] * Math.sin(((p + 1) * Math.PI) / 4) * Math.SQRT2;
    b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(l * 32767))), 44 + i * 4);
    b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(r * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(path.join(OUT, `${name}.wav`), b);
  console.log(`✓ ${name}.wav  ${(n / SR).toFixed(2)} s`);
};

// ---------- Sounds ----------

// Whoosh: Bandpass-Rauschen, Frequenz-Sweep, Glocken-Hüllkurve, Panorama L→R
{
  const d = 0.55;
  const n = noise(d);
  const sweep = (t) => 350 * Math.pow(12, Math.sin((Math.PI * t) / d) ** 1.4);
  const a = filter(n, 'bp', sweep, () => 1.1);
  const b = filter(noise(d), 'lp', (t) => 300 + 2500 * Math.sin((Math.PI * t) / d), () => 0.7);
  write('whoosh', env(mix(a, gain(b, 0.35)), bell(d, 0.55, 2.2)), {peakDb: -4, pan: (t) => -0.6 + (1.2 * t) / d});
}

// Soft Whoosh für kleine Elemente
{
  const d = 0.32;
  const a = filter(noise(d), 'bp', (t) => 700 + 2600 * Math.sin((Math.PI * t) / d), () => 1.4);
  write('whoosh-soft', env(a, bell(d, 0.45, 2)), {peakDb: -9, pan: (t) => -0.3 + (0.6 * t) / d});
}

// Chomp: zwei Zahn-Klacks + tiefer Schlag
{
  const clack = (f) => env(filter(noise(0.06), 'bp', () => f, () => 2.2), attackDecay(0.0015, 0.012));
  const thump = env(
    sine(0.32, (t) => 55 + 95 * Math.exp(-t / 0.035)),
    attackDecay(0.002, 0.09),
  );
  const body = env(filter(noise(0.2), 'lp', () => 900, () => 0.8), attackDecay(0.001, 0.035));
  const snap = mix(gain(clack(2600), 1.0), delay(gain(clack(1800), 0.8), 0.016), gain(thump, 0.9), gain(body, 0.45));
  write('chomp', snap, {peakDb: -2});
}

// Tick: kurzer, heller Klick (Listen, Zähler)
{
  const d = 0.06;
  const s = env(sine(d, () => 2300), expDecay(0.009));
  const c = env(filter(noise(d), 'hp', () => 3500, () => 0.8), expDecay(0.004));
  write('tick', mix(s, gain(c, 0.5)), {peakDb: -12});
}

// Pop: Meeples, Karten, Badges
{
  const d = 0.14;
  const s = env(sine(d, (t) => 320 + 700 * Math.exp(-t / 0.018)), attackDecay(0.002, 0.04));
  write('pop', s, {peakDb: -9});
}

// Card: Karte ausspielen ("fwip")
{
  const d = 0.16;
  const a = filter(noise(d), 'bp', (t) => 5200 - 3200 * (t / d), () => 0.9);
  const b = env(filter(noise(d), 'lp', () => 700, () => 0.7), attackDecay(0.004, 0.02));
  write('card', mix(env(a, attackDecay(0.012, 0.035)), gain(b, 0.6)), {peakDb: -8});
}

// Impact: tiefer Schlag für große Zahlen
{
  const d = 1.1;
  const sub = env(sine(d, (t) => 42 + 78 * Math.exp(-t / 0.06)), attackDecay(0.003, 0.32));
  const air = env(filter(noise(d), 'lp', (t) => 180 + 2400 * Math.exp(-t / 0.05), () => 0.7), attackDecay(0.002, 0.18));
  const click = env(filter(noise(0.03), 'hp', () => 2500, () => 0.7), expDecay(0.004));
  write('impact', mix(gain(sub, 1), gain(air, 0.55), gain(click, 0.3)), {peakDb: -2});
}

// Riser: Spannungsaufbau vor der Headline
{
  const d = 1.2;
  const a = filter(noise(d), 'bp', (t) => 250 * Math.pow(26, t / d), () => 2.2);
  const tone = env(sine(d, (t) => 180 * Math.pow(4, t / d)), (t) => (t / d) ** 2 * 0.25);
  write('riser', env(mix(a, tone), (t) => Math.pow(t / d, 2.2)), {peakDb: -6});
}

// Ding: Platz 1 / Aha-Moment – zwei Glockentöne mit leichtem Detune
{
  const note = (f, d) =>
    env(
      mix(
        sine(d, () => f),
        gain(sine(d, () => f * 2.01), 0.35),
        gain(sine(d, () => f * 3.02), 0.12),
        gain(sine(d, () => f * 1.003), 0.5),
      ),
      attackDecay(0.004, 0.35),
    );
  const s = mix(gain(note(659.25, 1.2), 0.9), delay(gain(note(987.77, 1.2), 0.8), 0.09));
  write('ding', s, {peakDb: -7});
}

// Blip: sanftes Daten-Signal (Chips, Tags)
{
  const d = 0.1;
  const s = env(mix(sine(d, () => 1318.5), gain(sine(d, () => 1975.5), 0.3)), attackDecay(0.003, 0.025));
  write('blip', s, {peakDb: -14});
}

console.log(`\nFertig → ${OUT}`);
