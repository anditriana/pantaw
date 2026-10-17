import { SAMPLE_SIZE, type Metrics } from './metrics';
import type { Platform } from './parse';

const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCount = (n: number | null): string => (n === null ? '–' : compact.format(Math.round(n)));

export const formatPercent = (n: number | null): string =>
  n === null ? '–' : `${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Keterangan sampel di bawah angka kartu. `fromReels`: IG tanpa data grid, sampel = reels dari tab Reels. */
export function sampleNote(m: Metrics, platform: Platform = 'tiktok', fromReels = false): string {
  const unit = platform === 'tiktok' ? 'video' : fromReels ? 'reels' : 'post';
  let s = `${m.sampleSize} ${unit} terakhir${m.sampleSize < SAMPLE_SIZE ? ` (kurang dari ${SAMPLE_SIZE})` : ''}, pinned dikecualikan.`;
  if (m.hiddenLikes > 0) s += ` ${m.hiddenLikes} post likes disembunyikan (tidak dihitung).`;
  if (platform === 'instagram' && !fromReels) {
    s += m.viewsSampleSize > 0 ? ` Views: ${m.viewsSampleSize} reels terakhir.` : ' Buka tab Reels untuk views.';
  }
  return s;
}
