import type { Post } from './parse';

export const SAMPLE_SIZE = 12;

export interface Metrics {
  sampleSize: number; // jumlah post yang diambil (≤ SAMPLE_SIZE), termasuk yang likes-nya disembunyikan
  /** Post dengan likes disembunyikan — dikeluarkan dari semua rata-rata & ER. */
  hiddenLikes: number;
  /** Jumlah post yang punya views (TikTok: semua; IG: reels dari tab Reels). */
  viewsSampleSize: number;
  followers: number;
  /** null bila tidak ada post dengan views. */
  avgViews: number | null;
  /** null bila semua post likes-nya disembunyikan. */
  avgLikes: number | null;
  avgComments: number | null;
  /** null bila platform tidak menyediakan share (IG). */
  avgShares: number | null;
  /** (likes + komentar) / followers × 100, rata-rata per post. null bila followers 0 / likes semua disembunyikan. */
  erFollowers: number | null;
  /** Σ(likes + komentar + share) / Σviews × 100. null bila total views 0. Share tidak tersedia dihitung 0. */
  erViews: number | null;
  /** Rata-rata (likes + komentar + share) / views × 100 per post; post dengan views 0 dilewati. */
  erViewsAvg: number | null;
}

/** N post terbaru, post pinned dikecualikan, duplikat id dibuang. */
export function selectRecentVideos<T extends Post>(videos: T[], n = SAMPLE_SIZE): T[] {
  const seen = new Set<string>();
  return videos
    .filter((v) => !v.pinned && !seen.has(v.id) && seen.add(v.id))
    .sort((a, b) => b.createTime - a.createTime)
    .slice(0, n);
}

export function computeMetrics(followers: number, videos: Post[]): Metrics | null {
  const n = videos.length;
  if (n === 0) return null;
  // Likes disembunyikan → post dikeluarkan dari rata-rata & ER (bukan dihitung 0).
  const visible = videos.filter((v) => v.likes !== null);
  const withViews = visible.filter((v) => v.views !== null);
  const withShares = visible.filter((v) => v.shares !== null);
  const k = visible.length;
  const sum = (list: Post[], f: (v: Post) => number) => list.reduce((s, v) => s + f(v), 0);
  const eng = (v: Post) => v.likes! + v.comments + (v.shares ?? 0);
  const likes = sum(visible, (v) => v.likes!);
  const comments = sum(visible, (v) => v.comments);
  const views = sum(withViews, (v) => v.views!);
  const perVideo = withViews.filter((v) => v.views! > 0).map((v) => (eng(v) / v.views!) * 100);
  const avg = (total: number, count: number) => (count > 0 ? total / count : null);
  return {
    sampleSize: n,
    hiddenLikes: n - k,
    viewsSampleSize: withViews.length,
    followers,
    avgViews: avg(views, withViews.length),
    avgLikes: avg(likes, k),
    avgComments: avg(comments, k),
    avgShares: avg(sum(withShares, (v) => v.shares!), withShares.length),
    erFollowers: followers > 0 && k > 0 ? ((likes + comments) / k / followers) * 100 : null,
    erViews: views > 0 ? (sum(withViews, eng) / views) * 100 : null,
    erViewsAvg: perVideo.length > 0 ? perVideo.reduce((s, x) => s + x, 0) / perVideo.length : null,
  };
}

/** Metrik views (rata-rata views, ER views) diambil dari sampel lain — IG: reels dari tab Reels. */
export function withViewsFrom(base: Metrics, from: Metrics | null): Metrics {
  if (!from) return base;
  const { viewsSampleSize, avgViews, erViews, erViewsAvg } = from;
  return { ...base, viewsSampleSize, avgViews, erViews, erViewsAvg };
}
