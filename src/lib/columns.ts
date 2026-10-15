// Registri kolom: satu pengaturan (urutan + tampil/sembunyi) untuk kartu DAN baris salin.
import { formatCount, formatPercent } from './format';
import type { Metrics } from './metrics';
import type { Profile } from './parse';

export interface ColumnDef {
  id: string;
  /** Label judul kolom di spreadsheet (dan di daftar pengaturan). */
  label: string;
  sheet: (profile: Profile, m: Metrics, date: Date) => string;
  /** Ada = tampil sebagai baris di kartu. */
  card?: { label: string; value: (m: Metrics) => string; er?: boolean };
}

const int = (n: number) => String(Math.round(n));
const pct = (n: number | null) => (n === null ? '' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ','));
const pad = (n: number) => String(n).padStart(2, '0');

export const COLUMNS: ColumnDef[] = [
  { id: 'username', label: 'Username', sheet: (p) => `@${p.uniqueId}` },
  { id: 'nama', label: 'Nama', sheet: (p) => p.nickname.replace(/[\t\r\n]/g, ' ').trim() },
  { id: 'followers', label: 'Followers', sheet: (_p, m) => int(m.followers), card: { label: 'Followers', value: (m) => formatCount(m.followers) } },
  { id: 'avgViews', label: 'Rata-rata views', sheet: (_p, m) => int(m.avgViews), card: { label: 'Rata-rata views', value: (m) => formatCount(m.avgViews) } },
  { id: 'avgLikes', label: 'Rata-rata likes', sheet: (_p, m) => int(m.avgLikes), card: { label: 'Rata-rata likes', value: (m) => formatCount(m.avgLikes) } },
  { id: 'avgComments', label: 'Rata-rata komentar', sheet: (_p, m) => int(m.avgComments), card: { label: 'Rata-rata komentar', value: (m) => formatCount(m.avgComments) } },
  { id: 'avgShares', label: 'Rata-rata share', sheet: (_p, m) => int(m.avgShares), card: { label: 'Rata-rata share', value: (m) => formatCount(m.avgShares) } },
  { id: 'erFollowers', label: 'ER followers (%)', sheet: (_p, m) => pct(m.erFollowers), card: { label: 'ER (followers)', value: (m) => formatPercent(m.erFollowers), er: true } },
  { id: 'erViews', label: 'ER views total (%)', sheet: (_p, m) => pct(m.erViews), card: { label: 'ER views (total)', value: (m) => formatPercent(m.erViews), er: true } },
  { id: 'erViewsAvg', label: 'ER views rata-rata (%)', sheet: (_p, m) => pct(m.erViewsAvg), card: { label: 'ER views (rata-rata/video)', value: (m) => formatPercent(m.erViewsAvg), er: true } },
  { id: 'jumlahVideo', label: 'Jumlah video', sheet: (_p, m) => String(m.sampleSize) },
  { id: 'tanggal', label: 'Tanggal', sheet: (_p, _m, d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` },
  { id: 'link', label: 'Link profil', sheet: (p) => `https://www.tiktok.com/@${p.uniqueId}` },
];

export const COLUMN_BY_ID = new Map(COLUMNS.map((c) => [c.id, c]));

export type ColumnConfig = { id: string; enabled: boolean }[];

export const DEFAULT_CONFIG: ColumnConfig = COLUMNS.map((c) => ({ id: c.id, enabled: true }));

/** Toleran terhadap data rusak/lama: buang id asing & duplikat, tambahkan id yang belum ada di akhir. */
export function normalizeConfig(raw: unknown): ColumnConfig {
  if (!Array.isArray(raw)) return DEFAULT_CONFIG.map((c) => ({ ...c }));
  const seen = new Set<string>();
  const out: ColumnConfig = [];
  for (const item of raw) {
    const id = (item as { id?: unknown } | null)?.id;
    if (typeof id !== 'string' || !COLUMN_BY_ID.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, enabled: (item as { enabled?: unknown }).enabled !== false });
  }
  for (const c of COLUMNS) if (!seen.has(c.id)) out.push({ id: c.id, enabled: true });
  return out;
}

export function moveColumn(config: ColumnConfig, id: string, delta: -1 | 1): ColumnConfig {
  const i = config.findIndex((c) => c.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= config.length) return config;
  const next = config.map((c) => ({ ...c }));
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function toggleColumn(config: ColumnConfig, id: string): ColumnConfig {
  return config.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : { ...c }));
}
