// Format baris metrik untuk ditempel ke spreadsheet (TSV, desimal koma).
import type { Metrics } from './metrics';
import type { Profile } from './parse';

export const SHEET_COLUMNS = [
  'Username',
  'Nama',
  'Followers',
  'Rata-rata views',
  'Rata-rata likes',
  'Rata-rata komentar',
  'Rata-rata share',
  'ER followers (%)',
  'ER views total (%)',
  'ER views rata-rata (%)',
  'Jumlah video',
  'Tanggal',
  'Link profil',
];

export const sheetHeader = (): string => SHEET_COLUMNS.join('\t');

const int = (n: number) => String(Math.round(n));
const pct = (n: number | null) => (n === null ? '' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ','));
const pad = (n: number) => String(n).padStart(2, '0');

/** Satu baris TSV tanpa newline di akhir. Tanggal memakai zona waktu lokal browser. */
export function sheetRow(profile: Profile, m: Metrics, date: Date): string {
  return [
    `@${profile.uniqueId}`,
    profile.nickname.replace(/[\t\r\n]/g, ' ').trim(),
    int(m.followers),
    int(m.avgViews),
    int(m.avgLikes),
    int(m.avgComments),
    int(m.avgShares),
    pct(m.erFollowers),
    pct(m.erViews),
    pct(m.erViewsAvg),
    String(m.sampleSize),
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `https://www.tiktok.com/@${profile.uniqueId}`,
  ].join('\t');
}
