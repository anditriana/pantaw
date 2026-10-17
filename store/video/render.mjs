// node store/video/render.mjs [id|en ...] [--preview]
// → release/video/pantaw-promo-{id,en}.mp4 (1920×1080, 30fps, H.264 yuv420p BT.709, masih tanpa audio — lanjutkan
//   dengan `node store/video/sfx.mjs` untuk menambah efek suara UI sintetis)
//   + release/video/pantaw-promo-{id,en}-thumb.png (1280×720).
// --preview: hanya beberapa frame PNG ke release/video/preview/, tanpa encode video.
// Pipeline (store/video/frames.mjs): Chrome headless via DevTools Protocol, window.seek(t) per frame di
// store/video/promo.html, PNG di-pipe ke ffmpeg. Tanpa dependensi npm. Bukan Remotion.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { openChrome, renderMp4 } from './frames.mjs';

const FPS = 30, W = 1920, H = 1080;
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const langs = args.filter((a) => a === 'id' || a === 'en');
if (!langs.length) langs.push('id', 'en');
const out = resolve('release/video');
mkdirSync(join(out, preview ? 'preview' : ''), { recursive: true });
const page = pathToFileURL(resolve('store/video/promo.html')).href;
const session = await openChrome(W, H);
const { evaluate, png } = session;

// --- Render ----------------------------------------------------------------------------------
const PREVIEW_T = [1.8, 11.5, 16.5, 22.4, 28.0, 39];
try {
  for (const lang of langs) {
    const duration = await session.load(`${page}?lang=${lang}`);
    if (preview) {
      for (const t of PREVIEW_T) {
        await evaluate(`seek(${t})`);
        const f = join(out, 'preview', `${lang}-${t.toFixed(1).padStart(4, '0')}s.png`);
        writeFileSync(f, await png()); console.log(`OK: ${f}`);
      }
    } else {
      await renderMp4(session, join(out, `pantaw-promo-${lang}.mp4`), duration, FPS, lang);
    }
    await evaluate('thumb()');
    const tf = join(out, preview ? 'preview' : '', `pantaw-promo-${lang}-thumb.png`);
    writeFileSync(tf, await png(2 / 3)); console.log(`OK: ${tf}`);
  }
} finally {
  await session.close();
}
