// Format baris metrik untuk ditempel ke spreadsheet (TSV, desimal koma).
// Kolom & urutan mengikuti ColumnConfig (default: semua kolom, urutan bawaan).
import { COLUMN_BY_ID, COLUMNS, DEFAULT_CONFIG, type ColumnConfig } from './columns';
import type { Metrics } from './metrics';
import type { Profile } from './parse';

export const SHEET_COLUMNS = COLUMNS.map((c) => c.label);

const enabled = (config: ColumnConfig) => config.filter((c) => c.enabled).map((c) => COLUMN_BY_ID.get(c.id)!);

export const sheetHeader = (config: ColumnConfig = DEFAULT_CONFIG): string =>
  enabled(config).map((c) => c.label).join('\t');

/** Satu baris TSV tanpa newline di akhir. Tanggal memakai zona waktu lokal browser. */
export function sheetRow(profile: Profile, m: Metrics, date: Date, config: ColumnConfig = DEFAULT_CONFIG): string {
  return enabled(config).map((c) => c.sheet(profile, m, date)).join('\t');
}
