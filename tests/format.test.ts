import { describe, expect, it } from 'vitest';
import { formatCount, sampleNote } from '../src/lib/format';
import type { Metrics } from '../src/lib/metrics';

const m = (o: Partial<Metrics> = {}): Metrics => ({
  sampleSize: 12, hiddenLikes: 0, viewsSampleSize: 0, followers: 1, avgViews: null, avgLikes: 1, avgComments: 1,
  avgShares: null, erFollowers: 1, erViews: null, erViewsAvg: null, ...o,
});

describe('sampleNote', () => {
  it('TikTok tidak berubah', () => {
    expect(sampleNote(m({ viewsSampleSize: 12 }))).toBe('12 video terakhir, pinned dikecualikan.');
    expect(sampleNote(m({ sampleSize: 3 }), 'tiktok')).toBe('3 video terakhir (kurang dari 12), pinned dikecualikan.');
  });
  it('IG grid tanpa reels → petunjuk tab Reels', () => {
    expect(sampleNote(m(), 'instagram')).toBe('12 post terakhir, pinned dikecualikan. Buka tab Reels untuk views.');
  });
  it('IG dengan views reels + likes disembunyikan', () => {
    expect(sampleNote(m({ viewsSampleSize: 12, hiddenLikes: 2 }), 'instagram')).toBe(
      '12 post terakhir, pinned dikecualikan. 2 post likes disembunyikan (tidak dihitung). Views: 12 reels terakhir.',
    );
  });
  it('IG hanya data tab Reels', () => {
    expect(sampleNote(m({ viewsSampleSize: 12 }), 'instagram', true)).toBe('12 reels terakhir, pinned dikecualikan.');
  });
});

describe('formatCount', () => {
  it('null → –', () => {
    expect(formatCount(null)).toBe('–');
  });
});
