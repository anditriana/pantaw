// node store/story/reels.mjs [--preview]
// → release/story/reels/pantaw-reels.mp4 (1080×1920, 30fps, H.264 + AAC, 23 dtk, efek suara UI sintetis tanpa musik —
//   musik ditambah user di aplikasi IG, jadi puncak efek -6 dBFS) + release/story/reels/pantaw-reels-cover.png (1080×1920).
// --preview: hanya frame PNG ber-overlay area aman Reels (?guide=1) ke release/story/reels/preview/, tanpa encode.
// Komposisi = store/story/story.html?format=reels (3 slide yang sama dengan Story/feed, dianimasikan window.seek(t)).
// Pipeline dipakai ulang dari video YouTube: store/video/frames.mjs (Chrome/CDP + ffmpeg) dan store/video/sfx-lib.mjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openChrome, renderMp4 } from '../video/frames.mjs';
import { click, pop, ding, whoosh, chime, mixWav, muxAudio } from '../video/sfx-lib.mjs';

const FPS = 30, W = 1080, H = 1920, PEAK_DB = -6;
const preview = process.argv.includes('--preview');
const out = resolve('release/story/reels');
mkdirSync(join(out, preview ? 'preview' : ''), { recursive: true });
const page = pathToFileURL(resolve('store/story/story.html')).href + '?format=reels';

// awal & akhir animasi tiap slide (lihat seek() di story.html): slide 1 = 0, slide 2 = 7,6, slide 3 = 15,4 dtk
const PREVIEW_T = [0.6, 2.4, 6.5, 7.35, 8.5, 10.6, 14.5, 15.15, 16.6, 19.5, 22.9];

const session = await openChrome(W, H);
try {
  if (preview) {
    await session.load(page + '&guide=1');
    for (const t of PREVIEW_T) {
      await session.evaluate(`seek(${t})`);
      const f = join(out, 'preview', `${t.toFixed(2).padStart(5, '0')}s.png`);
      writeFileSync(f, await session.png()); console.log(`OK: ${f}`);
    }
  } else {
    const duration = await session.load(page);
    const mp4 = join(out, 'pantaw-reels.mp4');
    await renderMp4(session, mp4, duration, FPS, 'reels');
    await session.evaluate('thumb()');
    const cover = join(out, 'pantaw-reels-cover.png');
    writeFileSync(cover, await session.png()); console.log(`OK: ${cover}`);

    // --- skor: [detik, bunyi, gain dB, pan -1..1] — waktu = timeline seek() di story.html
    const a = 7.6, b = 15.4;
    const cues = [
      [0.4, whoosh(0.5, 700, 2400), -22, 0],          // judul hook masuk
      [1.0, pop(0.9), -14, 0],                         // "manual?" pop
      ...[0, 1, 2, 3].map((i) => [1.5 + i * 0.7, pop(1 + i * 0.08), -18, -0.15]), // langkah 1–4
      [4.5, click(0.9), -13, 0],                       // "Lama, dan rawan salah hitung."
      [a - 0.5, whoosh(0.6, 700, 2400), -20, 0],       // → slide 2
      [a + 1.6, whoosh(0.9, 400, 1800), -21, 0.2],     // kartu zoom dari pojok kanan
      ...[0, 1, 2, 3].map((i) => [a + 2.6 + i * 0.4, pop(1.05 + i * 0.07), -18, -0.2]), // chip metrik
      [a + 4.3, ding(), -14, 0.2],                     // ER disorot
      [b - 0.5, whoosh(0.6, 700, 2400), -20, 0],       // → slide 3
      [b + 0.15, pop(0.8), -14, 0],                    // logo
      ...[0, 1, 2].map((i) => [b + 1.1 + i * 0.3, pop(1.1 + i * 0.08), -19, 0]), // butir keunggulan
      [b + 2.3, pop(1.3), -17, 0],                     // "Segera di Chrome Web Store"
      [b + 2.8, chime(), -15, 0],                      // tombol DM
    ];
    const wav = join(out, 'sfx.wav');
    mixWav(wav, cues, duration, PEAK_DB);
    muxAudio(mp4, wav, duration);
  }
} finally {
  await session.close();
}
