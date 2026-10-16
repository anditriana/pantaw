// node store/video/render.mjs [id|en ...] [--preview]
// → release/video/pantaw-promo-{id,en}.mp4 (1920×1080, 30fps, H.264 yuv420p BT.709, masih tanpa audio — lanjutkan
//   dengan `node store/video/sfx.mjs` untuk menambah efek suara UI sintetis)
//   + release/video/pantaw-promo-{id,en}-thumb.png (1280×720).
// --preview: hanya beberapa frame PNG ke release/video/preview/, tanpa encode video.
// Pipeline: Chrome headless (google-chrome) via DevTools Protocol, window.seek(t) per frame di store/video/promo.html,
// PNG di-pipe ke ffmpeg. Tanpa dependensi npm (WebSocket bawaan Node ≥ 22). Bukan Remotion.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const FPS = 30, W = 1920, H = 1080;
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const langs = args.filter((a) => a === 'id' || a === 'en');
if (!langs.length) langs.push('id', 'en');
const out = resolve('release/video');
mkdirSync(join(out, preview ? 'preview' : ''), { recursive: true });
const page = pathToFileURL(resolve('store/video/promo.html')).href;

// --- Chrome + CDP ---------------------------------------------------------------------------
const profile = mkdtempSync(join(tmpdir(), 'pantaw-video-'));
const chrome = spawn(process.env.CHROME ?? 'google-chrome', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });
const portFile = join(profile, 'DevToolsActivePort');
for (let i = 0; !existsSync(portFile) || !readFileSync(portFile, 'utf8').includes('\n'); i++) {
  if (i > 100) throw new Error('Chrome tidak membuka DevTools port');
  await new Promise((r) => setTimeout(r, 100));
}
const port = readFileSync(portFile, 'utf8').split('\n')[0];
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.j(new Error(m.error.message)) : p.r(m.result); }
};
const cdp = (method, params = {}) => new Promise((r, j) => { const id = ++seq; pending.set(id, { r, j }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr) => {
  const res = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? expr);
  return res.result.value;
};
const png = async (scale = 1) => Buffer.from((await cdp('Page.captureScreenshot', {
  format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale },
})).data, 'base64');

await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

async function load(lang) {
  await cdp('Page.navigate', { url: `${page}?lang=${lang}` });
  for (let i = 0; i < 100; i++) {
    if (await evaluate('typeof window.ready !== "undefined"').catch(() => false)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  return evaluate('window.ready');
}

// --- Render ----------------------------------------------------------------------------------
const PREVIEW_T = [1.8, 11.5, 16.5, 22.4, 28.0, 39];
try {
  for (const lang of langs) {
    const duration = await load(lang);
    if (preview) {
      for (const t of PREVIEW_T) {
        await evaluate(`seek(${t})`);
        const f = join(out, 'preview', `${lang}-${t.toFixed(1).padStart(4, '0')}s.png`);
        writeFileSync(f, await png()); console.log(`OK: ${f}`);
      }
    } else {
      const file = join(out, `pantaw-promo-${lang}.mp4`);
      const ff = spawn('ffmpeg', [
        '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-r', String(FPS),
        '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
        '-movflags', '+faststart', '-an', file,
      ], { stdio: ['pipe', 'inherit', 'inherit'] });
      const done = new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error(`ffmpeg exit ${c}`)) : r())));
      const frames = Math.round(duration * FPS);
      for (let i = 0; i < frames; i++) {
        await evaluate(`seek(${i / FPS})`);
        const buf = await png();
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
        if (i % 150 === 0) console.log(`${lang}: frame ${i}/${frames}`);
      }
      ff.stdin.end(); await done; console.log(`OK: ${file}`);
    }
    await evaluate('thumb()');
    const tf = join(out, preview ? 'preview' : '', `pantaw-promo-${lang}-thumb.png`);
    writeFileSync(tf, await png(2 / 3)); console.log(`OK: ${tf}`);
  }
} finally {
  ws.close();
  await new Promise((r) => { chrome.once('exit', r); chrome.kill(); });
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* sisa profil Chrome di tmp, tidak penting */ }
}
