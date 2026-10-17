// node store/story/render.mjs [--feed] [--guide]
// → release/story/pantaw-story-{1,2,3}.png (1080×1920, IG Story & WA Story; tidak di-commit).
// --feed: carousel feed Instagram → release/story/feed/pantaw-feed-{1,2,3}.png (1080×1350, 4:5).
// Komposisi = store/story/story.html?s=N[&format=feed], di-screenshot Chrome headless (google-chrome) seperti store/render.mjs.
// --guide: tambah overlay merah zona yang harus kosong (story: 250 px atas / 340 px bawah; feed: margin 80 px)
//   → nama file berakhiran -guide.png, untuk cek.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const feed = process.argv.includes('--feed');
const guide = process.argv.includes('--guide');
const [h, dir, name] = feed ? [1350, 'release/story/feed', 'pantaw-feed'] : [1920, 'release/story', 'pantaw-story'];
const out = resolve(dir);
mkdirSync(out, { recursive: true });
const page = pathToFileURL(resolve('store/story/story.html')).href;
const chrome = process.env.CHROME ?? 'google-chrome';
const profile = mkdtempSync(join(tmpdir(), 'pantaw-story-'));

for (const s of [1, 2, 3]) {
  const file = join(out, `${name}-${s}${guide ? '-guide' : ''}.png`);
  const query = `?s=${s}${feed ? '&format=feed' : ''}${guide ? '&guide=1' : ''}`;
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
    `--user-data-dir=${profile}`, `--window-size=1080,${h}`, `--screenshot=${file}`, page + query,
  ], { stdio: 'ignore' });
  console.log(`OK: ${file}`);
}
