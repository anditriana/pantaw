// npm run zip: build lalu zip ISI dist/ (manifest di akar) → release/pantaw-<version>.zip.
// Ditolak kalau version manifest tidak lebih tinggi dari zip rilis terakhir di release/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { version } = JSON.parse(readFileSync('manifest.json', 'utf8'));
const parts = (v) => v.split('.').map(Number);
const cmp = (a, b) => {
  const x = parts(a), y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

mkdirSync('release', { recursive: true });
const released = readdirSync('release')
  .map((f) => /^pantaw-(\d+(?:\.\d+){0,3})\.zip$/.exec(f)?.[1])
  .filter(Boolean)
  .sort(cmp);
const last = released.at(-1);
if (last && cmp(version, last) <= 0) {
  console.error(`Ditolak: version manifest ${version} tidak lebih tinggi dari rilis terakhir ${last} (release/pantaw-${last}.zip). Naikkan "version" di manifest.json.`);
  process.exit(1);
}

execFileSync('node', ['scripts/build.mjs'], { stdio: 'inherit' });
if (!existsSync('dist/manifest.json')) throw new Error('dist/manifest.json tidak ada setelah build');

const out = resolve(`release/pantaw-${version}.zip`);
execFileSync('zip', ['-r', '-X', '-q', out, '.'], { cwd: 'dist', stdio: 'inherit' });
console.log(`OK: ${out}`);
