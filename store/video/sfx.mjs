// node store/video/sfx.mjs  (jalankan SETELAH store/video/render.mjs)
// Efek suara UI sintetis untuk video promo — tanpa sampel/unduhan, tanpa musik (musik latar ditambah user di
// YouTube Studio, jadi mix sengaja ber-headroom: puncak efek -6 dBFS). Semua dibangkitkan di sini: osilator,
// noise ber-seed, biquad RBJ, envelope (diadaptasi dari sfx.py proyek brainstorming). Deterministik.
// → release/video/sfx.wav (48 kHz stereo 16-bit), lalu di-mux ke release/video/pantaw-promo-{id,en}.mp4
//   (video -c:v copy, audio AAC 192 kbps 48 kHz stereo). Waktu cue = timeline window.seek() di promo.html.
import { join, resolve } from 'node:path';
import { click, pop, ding, whoosh, chime, mixWav, muxAudio } from './sfx-lib.mjs';

const DUR = 42, PEAK_DB = -6;
const out = resolve('release/video');

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

const sfx = join(out, 'sfx.wav');
mixWav(sfx, cues, DUR, PEAK_DB);
for (const lang of ['id', 'en']) muxAudio(join(out, `pantaw-promo-${lang}.mp4`), sfx, DUR);
