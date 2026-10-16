// node store/video/sfx.mjs  (jalankan SETELAH store/video/render.mjs)
// Efek suara UI sintetis untuk video promo — tanpa sampel/unduhan, tanpa musik (musik latar ditambah user di
// YouTube Studio, jadi mix sengaja ber-headroom: puncak efek -6 dBFS). Semua dibangkitkan di sini: osilator,
// noise ber-seed, biquad RBJ, envelope (diadaptasi dari sfx.py proyek brainstorming). Deterministik.
// → release/video/sfx.wav (48 kHz stereo 16-bit), lalu di-mux ke release/video/pantaw-promo-{id,en}.mp4
//   (video -c:v copy, audio AAC 192 kbps 48 kHz stereo). Waktu cue = timeline window.seek() di promo.html.
import { spawnSync } from 'node:child_process';
import { renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SR = 48000, DUR = 42, N = DUR * SR, PEAK_DB = -6;
const out = resolve('release/video');

// --- primitif -------------------------------------------------------------------------------
let seed = 20261016;
const rand = () => { seed = (seed + 0x6d2b79f5) | 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const len = (d) => Math.round(d * SR);
const db = (g) => 10 ** (g / 20);
const noise = (d) => Float64Array.from({ length: len(d) }, gauss);
const tone = (d, f, phase = 0) => Float64Array.from({ length: len(d) }, (_, i) => Math.sin(2 * Math.PI * f * i / SR + phase));
// sweep eksponensial f0 → f1
const sweep = (f0, f1, d) => { const n = len(d), y = new Float64Array(n); let ph = 0; for (let i = 0; i < n; i++) { ph += 2 * Math.PI * f0 * (f1 / f0) ** (i / n) / SR; y[i] = Math.sin(ph); } return y; };
// envelope attack linear a detik, lalu decay eksponensial tau
const envAD = (d, a, tau) => Float64Array.from({ length: len(d) }, (_, i) => { const t = i / SR; return t < a ? t / a : Math.exp(-(t - a) / tau); });
const mul = (x, e) => x.map((v, i) => v * (typeof e === 'function' ? e(i / SR, i) : e[i] ?? 0));
const norm = (x) => { let m = 0; for (const v of x) m = Math.max(m, Math.abs(v)); return m ? x.map((v) => v / m) : x; };
function add(dst, src, at = 0, g = 1) { for (let i = 0; i < src.length && at + i < dst.length; i++) dst[at + i] += g * src[i]; return dst; }
// biquad RBJ (lp/hp/bp); f boleh fungsi per-sampel (sweep filter)
function biquad(x, kind, f, q = 0.707) {
  const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const w = 2 * Math.PI * Math.min(typeof f === 'function' ? f(i / x.length) : f, SR * 0.45) / SR;
    const cw = Math.cos(w), al = Math.sin(w) / (2 * q);
    const [b0, b1, b2] = kind === 'lp' ? [(1 - cw) / 2, 1 - cw, (1 - cw) / 2] : kind === 'hp' ? [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2] : [al, 0, -al];
    const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
    const yi = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = yi; y[i] = yi;
  }
  return y;
}

// --- bunyi -----------------------------------------------------------------------------------
// klik mouse/tombol: transien noise HP + dering pendek + body rendah
function click(pitch = 1) {
  const d = 0.09, o = new Float64Array(len(d));
  add(o, mul(tone(d, 2300 * pitch), envAD(d, 0.0005, 0.016)), 0, 0.4);
  add(o, mul(tone(d, 190 * pitch), envAD(d, 0.001, 0.02)), 0, 0.55);
  add(o, mul(biquad(noise(0.004), 'hp', 2500), envAD(0.004, 0.0002, 0.0012)), 0, 0.9);
  return norm(o);
}
// pop kecil: sine turun cepat (bubble) + sedikit tick
function pop(pitch = 1) {
  const d = 0.14, o = new Float64Array(len(d));
  add(o, mul(sweep(900 * pitch, 380 * pitch, d), envAD(d, 0.002, 0.03)));
  add(o, mul(biquad(noise(0.006), 'bp', 3000 * pitch, 1.2), envAD(0.006, 0.0003, 0.0015)), 0, 0.3);
  return norm(o);
}
// ding konfirmasi lembut: dua nada (E6 → A6) bertumpuk, decay lunak
function ding() {
  const d = 1.2, o = new Float64Array(len(d));
  const bell = (f, tau) => add(new Float64Array(len(d)), mul(tone(d, f), (t) => Math.min(1, t / 0.004) * Math.exp(-t / tau)));
  add(o, bell(1318.5, 0.32), 0, 0.7); add(o, bell(2637, 0.12), 0, 0.12);
  add(o, bell(1760, 0.42), len(0.085), 0.8); add(o, bell(3520, 0.14), len(0.085), 0.1);
  for (let i = 0; i < len(0.05); i++) o[o.length - 1 - i] *= i / len(0.05);
  return norm(o);
}
// whoosh: noise band-pass yang filternya menyapu, envelope sin^1.5
function whoosh(d, f0 = 500, f1 = 2600) {
  const x = biquad(noise(d), 'bp', (u) => f0 * (f1 / f0) ** u, 1.1);
  return norm(mul(x, (t) => Math.sin(Math.PI * Math.min(t / d, 1)) ** 1.5));
}
// chime penutup: lebih rendah & panjang dari ding
function chime() {
  const d = 1.8, o = new Float64Array(len(d));
  for (const [f, g, tau] of [[784, 1, 0.5], [1174.7, 0.5, 0.4], [1568, 0.25, 0.25]]) add(o, mul(tone(d, f), (t) => Math.min(1, t / 0.006) * Math.exp(-t / tau)), 0, g);
  for (let i = 0; i < len(0.05); i++) o[o.length - 1 - i] *= i / len(0.05);
  return norm(o);
}

// --- skor: [detik, bunyi, gain dB, pan -1..1] ----------------------------------------------
// kartu/klik ada di kanan layar → pan sedikit ke kanan; transisi di tengah.
const cues = [
  [0.05, pop(0.8), -14, 0],              // logo hook muncul
  [3.05, whoosh(0.55, 700, 2400), -20, 0], // hook → footage profil
  [3.55, pop(1.0), -12, 0.3],            // kartu Pantaw tampak di footage
  [7.5, whoosh(1.5, 400, 1800), -22, 0.2], // zoom ke kartu
  [10.0, pop(1.25), -16, 0.3],           // sorot ER
  [15.0, click(1.0), -10, 0.3],          // klik Salin data (riak)
  [15.38, ding(), -13, 0.3],             // Tersalin ✓
  [17.55, whoosh(0.7, 600, 2600), -19, 0], // panel spreadsheet naik
  [18.9, pop(1.1), -17, 0],              // baris 2 ditempel
  [19.9, pop(1.2), -17, 0],              // baris 3 ditempel
  [20.9, whoosh(1.1, 900, 2200), -26, 0], // tabel bergeser ke kolom ER
  [23.05, whoosh(0.6, 2400, 700), -21, 0], // keluar spreadsheet → footage ⚙
  [23.8, click(1.15), -11, 0.3],         // ⚙ dibuka
  [24.9, whoosh(1.5, 400, 1800), -22, 0.2], // zoom ke panel ⚙
  [30.15, whoosh(0.6, 700, 2400), -20, 0], // → privasi
  [31.5, pop(1.0), -18, -0.15], [32.0, pop(1.1), -18, 0], [32.5, pop(1.2), -18, 0.15], // butir privasi
  [35.95, whoosh(0.6, 700, 2400), -20, 0], // → penutup
  [36.6, chime(), -15, 0],               // logo penutup
];

const L = new Float64Array(N), R = new Float64Array(N);
for (const [t, sig, g, pan] of cues) {
  const a = Math.PI / 4 * (pan + 1); // equal-power pan
  add(L, sig, len(t), db(g) * Math.cos(a) * Math.SQRT2);
  add(R, sig, len(t), db(g) * Math.sin(a) * Math.SQRT2);
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const k = db(PEAK_DB) / peak;

const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28);
wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4);
}
const sfx = join(out, 'sfx.wav');
writeFileSync(sfx, wav);
console.log(`OK: ${sfx} (puncak ${PEAK_DB} dBFS, gain trim ${(20 * Math.log10(k)).toFixed(2)} dB)`);

for (const lang of ['id', 'en']) {
  const file = join(out, `pantaw-promo-${lang}.mp4`), tmp = join(out, `pantaw-promo-${lang}.tmp.mp4`);
  const r = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', file, '-i', sfx, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', String(DUR),
    '-movflags', '+faststart', tmp,
  ], { stdio: 'inherit' });
  if (r.status) throw new Error(`ffmpeg exit ${r.status} (${lang})`);
  renameSync(tmp, file); console.log(`OK: ${file}`);
}
