// Rasterizer mini: assets/icon.svg → PNG (tanpa dependensi). Hanya subset SVG yang dipakai ikon.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

export const ICON_SIZES = [16, 32, 48, 128];
const SS = 8; // supersampling per sumbu

const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const num = (a, k, d = 0) => (a[k] === undefined ? d : Number(a[k]));
const color = (c) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(c)) throw new Error(`warna tidak didukung: ${c}`);
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
};

function parseSvg(svg) {
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!vb) throw new Error('viewBox "0 0 w h" wajib');
  const shapes = [];
  for (const [, tag, rest] of svg.matchAll(/<(rect|circle|line)\b([^>]*)>/g)) {
    const a = attrs(rest);
    if (tag === 'rect') {
      const x = num(a, 'x'), y = num(a, 'y'), w = num(a, 'width'), h = num(a, 'height'), r = num(a, 'rx');
      shapes.push({ rgb: color(a.fill), hit: (px, py) => {
        const dx = Math.max(x + r - px, px - (x + w - r), 0), dy = Math.max(y + r - py, py - (y + h - r), 0);
        return px >= x && px <= x + w && py >= y && py <= y + h && dx * dx + dy * dy <= r * r;
      } });
    } else if (tag === 'circle') {
      const cx = num(a, 'cx'), cy = num(a, 'cy'), r = num(a, 'r');
      if (a.fill && a.fill !== 'none') shapes.push({ rgb: color(a.fill), hit: (px, py) => Math.hypot(px - cx, py - cy) <= r });
      if (a.stroke) {
        const hw = num(a, 'stroke-width', 1) / 2;
        shapes.push({ rgb: color(a.stroke), hit: (px, py) => Math.abs(Math.hypot(px - cx, py - cy) - r) <= hw });
      }
    } else {
      if (a['stroke-linecap'] !== 'round') throw new Error('<line> wajib stroke-linecap="round"');
      const x1 = num(a, 'x1'), y1 = num(a, 'y1'), x2 = num(a, 'x2'), y2 = num(a, 'y2'), hw = num(a, 'stroke-width', 1) / 2;
      const vx = x2 - x1, vy = y2 - y1, len2 = vx * vx + vy * vy;
      shapes.push({ rgb: color(a.stroke), hit: (px, py) => {
        const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / len2));
        return Math.hypot(px - x1 - t * vx, py - y1 - t * vy) <= hw;
      } });
    }
  }
  return { width: Number(vb[1]), height: Number(vb[2]), shapes };
}

// Premultiplied RGBA, tiap sub-sampel dikomposit (source-over, bentuk opak) lalu dirata-rata.
function render({ width, shapes }, size) {
  const out = Buffer.alloc(size * size * 4);
  const k = width / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = (x + (sx + 0.5) / SS) * k, py = (y + (sy + 0.5) / SS) * k;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (shapes[i].hit(px, py)) { const c = shapes[i].rgb; r += c[0]; g += c[1]; b += c[2]; a++; break; }
      }
    }
    const o = (y * size + x) * 4;
    if (a) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
    out[o + 3] = Math.round((a / (SS * SS)) * 255);
  }
  return out;
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = (buf) => { let c = 0xffffffff; for (const v of buf) c = CRC[(c ^ v) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Tulis `<outDir>/icon<size>.png` untuk tiap ukuran. */
export function writeIcons(outDir, src = 'assets/icon.svg') {
  const svg = parseSvg(readFileSync(src, 'utf8'));
  for (const size of ICON_SIZES) writeFileSync(`${outDir}/icon${size}.png`, png(render(svg, size), size));
}
