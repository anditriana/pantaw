import type { Video } from './parse';

export const SAMPLE_SIZE = 12;

export interface Metrics {
  sampleSize: number; // jumlah video yang dihitung (≤ SAMPLE_SIZE)
  followers: number;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  /** (likes + komentar) / followers × 100, rata-rata per video. null bila followers 0. */
  erFollowers: number | null;
  /** Σ(likes + komentar + share) / Σviews × 100. null bila total views 0. */
  erViews: number | null;
  /** Rata-rata (likes + komentar + share) / views × 100 per video; video dengan views 0 dilewati. */
  erViewsAvg: number | null;
}

/** N video terbaru, video pinned dikecualikan, duplikat id dibuang. */
export function selectRecentVideos(videos: Video[], n = SAMPLE_SIZE): Video[] {
  const seen = new Set<string>();
  return videos
    .filter((v) => !v.pinned && !seen.has(v.id) && seen.add(v.id))
    .sort((a, b) => b.createTime - a.createTime)
    .slice(0, n);
}

export function computeMetrics(followers: number, videos: Video[]): Metrics | null {
  const n = videos.length;
  if (n === 0) return null;
  const sum = (f: (v: Video) => number) => videos.reduce((s, v) => s + f(v), 0);
  const views = sum((v) => v.views);
  const likes = sum((v) => v.likes);
  const comments = sum((v) => v.comments);
  const shares = sum((v) => v.shares);
  const perVideo = videos.filter((v) => v.views > 0).map((v) => ((v.likes + v.comments + v.shares) / v.views) * 100);
  return {
    sampleSize: n,
    followers,
    avgViews: views / n,
    avgLikes: likes / n,
    avgComments: comments / n,
    avgShares: shares / n,
    erFollowers: followers > 0 ? ((likes + comments) / n / followers) * 100 : null,
    erViews: views > 0 ? ((likes + comments + shares) / views) * 100 : null,
    erViewsAvg: perVideo.length > 0 ? perVideo.reduce((s, x) => s + x, 0) / perVideo.length : null,
  };
}
