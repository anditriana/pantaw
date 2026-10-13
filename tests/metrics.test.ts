import { describe, expect, it } from 'vitest';
import itemList from './fixtures/item_list.tiktok.json';
import { computeMetrics, selectRecentVideos } from '../src/lib/metrics';
import { parseItemList, type Video } from '../src/lib/parse';

const v = (id: string, createTime: number, s: Partial<Video> = {}): Video => ({
  id, authorId: 'a', createTime, pinned: false, views: 0, likes: 0, comments: 0, shares: 0, ...s,
});

describe('selectRecentVideos', () => {
  it('ambil 12 terbaru, kecualikan pinned walau paling baru', () => {
    const list = Array.from({ length: 16 }, (_, i) => v(`v${i}`, 1000 + i));
    list.push(v('pin', 9999, { pinned: true }));
    const picked = selectRecentVideos(list.reverse());
    expect(picked).toHaveLength(12);
    expect(picked.map((x) => x.id)).not.toContain('pin');
    expect(picked[0].id).toBe('v15');
    expect(picked[11].id).toBe('v4');
  });

  it('buang duplikat id (respons item_list bisa tumpang tindih)', () => {
    expect(selectRecentVideos([v('a', 1), v('a', 1), v('b', 2)]).map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('computeMetrics', () => {
  it('rumus ER dasar', () => {
    const m = computeMetrics(1000, [
      v('1', 1, { views: 1000, likes: 80, comments: 20, shares: 10 }),
      v('2', 2, { views: 3000, likes: 40, comments: 10, shares: 0 }),
    ])!;
    expect(m.avgLikes).toBe(60);
    expect(m.avgComments).toBe(15);
    expect(m.avgViews).toBe(2000);
    expect(m.avgShares).toBe(5);
    expect(m.erFollowers).toBeCloseTo(7.5); // (60 + 15) / 1000 × 100
    expect(m.erViews).toBeCloseTo(4); // (120 + 30 + 10) / 4000 × 100
    expect(m.erViewsAvg).toBeCloseTo((11 + 50 / 30) / 2); // rata-rata 110/1000 dan 50/3000 (× 100)
  });

  it('followers 0 / views 0 → ER null, tanpa video → null', () => {
    const m = computeMetrics(0, [v('1', 1)])!;
    expect(m.erFollowers).toBeNull();
    expect(m.erViews).toBeNull();
    expect(m.erViewsAvg).toBeNull();
    expect(computeMetrics(100, [])).toBeNull();
  });

  it('ER views rata-rata melewati video dengan views 0', () => {
    const m = computeMetrics(1000, [
      v('1', 1, { views: 1000, likes: 40, comments: 10, shares: 0 }), // 5%
      v('2', 2, { views: 0, likes: 30, comments: 5, shares: 1 }), // dilewati
      v('3', 3, { views: 500, likes: 5, comments: 0, shares: 0 }), // 1%
    ])!;
    expect(m.erViewsAvg).toBeCloseTo(3);
    expect(m.erViews).toBeCloseTo((91 / 1500) * 100); // total tetap memakai semua video
  });

  it('fixture asli @tiktok: 12 video terbaru dari 16', () => {
    const picked = selectRecentVideos(parseItemList(itemList).videos);
    const m = computeMetrics(96199454, picked)!;
    expect(m.sampleSize).toBe(12);
    // Σ likes 12 terbaru = 113411, Σ komentar = 23472, Σ share = 7916, Σ views = 4810900
    expect(m.avgLikes).toBeCloseTo(113411 / 12);
    expect(m.erFollowers).toBeCloseTo(((113411 + 23472) / 12 / 96199454) * 100, 10);
    expect(m.erViews).toBeCloseTo(((113411 + 23472 + 7916) / 4810900) * 100, 10);
    expect(m.erViewsAvg).toBeCloseTo(3.21474160930007, 10); // dihitung terpisah dari fixture
  });
});
