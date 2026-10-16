// node store/render.mjs → store/promo-small.png (440×280) + store/screenshot-{1,2,3}.png (1280×800).
// Pakai Chrome headless (google-chrome) karena scripts/icons.mjs tidak bisa merender teks/raster.
// Screenshot = bingkai merek + screenshot ASLI dari docs/img/ (tidak diubah isinya) + judul singkat.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const here = resolve('store');
const img = (f) => `file://${resolve('docs/img', f)}`;
const chrome = process.env.CHROME ?? 'google-chrome';
const profile = mkdtempSync(join(tmpdir(), 'pantaw-render-'));

function shot(url, out, w, h) {
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`, `--window-size=${w},${h}`, `--screenshot=${join(here, out)}`, url,
  ], { stdio: 'ignore' });
  console.log(`OK: store/${out}`);
}

const frame = (title, sub, body) => `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0;width:1280px;height:800px;overflow:hidden}
  body{background:#4F46E5;color:#fff;font-family:'Noto Sans','DejaVu Sans',sans-serif;display:flex;align-items:center;gap:56px;padding:0 64px;box-sizing:border-box}
  .t{flex:0 0 340px} h1{font-size:44px;line-height:1.15;margin:0 0 16px} p{font-size:22px;line-height:1.45;margin:0;color:#E0E7FF}
  .m{flex:1;display:flex;justify-content:center;align-items:center;gap:32px}
  img{display:block;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,.35)}
</style><div class="t"><h1>${title}</h1><p>${sub}</p></div><div class="m">${body}</div>`;

const screens = [
  ['Cek ER kreator di halaman profil', 'Buka profil TikTok mana saja, kartu Pantaw muncul di pojok kanan bawah.',
    `<img src="${img('card.jpg')}" width="760" height="571">`],
  ['Rata-rata & ER dari 12 video terbaru', 'Followers, views, likes, komentar, share, plus ER followers dan ER views. Video pinned dikecualikan.',
    `<img src="${img('card-zoom.png')}" width="507" height="620">`],
  ['Atur kolom sesuai template Anda', 'Pilih kolom yang tampil dan urutannya. Dipakai juga untuk Salin data ke spreadsheet.',
    `<img src="${img('settings.png')}" width="366" height="706">`],
];

shot(`file://${join(here, 'promo-small.svg')}`, 'promo-small.png', 440, 280);
screens.forEach(([t, s, b], i) => {
  const html = join(profile, `s${i + 1}.html`);
  writeFileSync(html, frame(t, s, b));
  shot(`file://${html}`, `screenshot-${i + 1}.png`, 1280, 800);
});
