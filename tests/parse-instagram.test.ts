import { describe, expect, it } from 'vitest';
import natgeo from './fixtures/timeline.natgeo.instagram.json';
import radit from './fixtures/timeline.raditya_dika.instagram.json';
import tasya from './fixtures/timeline.tasyafarasya.instagram.json';
import reels from './fixtures/reels.raditya_dika.instagram.json';
import users from './fixtures/user.instagram.json';
import { apiKind } from '../src/lib/messages';
import { computeMetrics, selectRecentVideos, withViewsFrom } from '../src/lib/metrics';
import { parseInstagram, parseInstagramBody, parseOgDescription, timeFromPk } from '../src/lib/parse-instagram';

const postsOf = (pages: unknown[], user: string) =>
  pages.flatMap((p) => parseInstagram(p).posts).filter((p) => p.authorId === user);

describe('parseInstagram — profil (data.user)', () => {
  it('membaca followers presisi dari respons asli', () => {
    expect(users.map((u) => parseInstagram(u).profiles[0])).toEqual([
      { platform: 'instagram', uniqueId: 'raditya_dika', nickname: 'Raditya Dika', followers: 21808091 },
      { platform: 'instagram', uniqueId: 'natgeo', nickname: 'National Geographic', followers: 268357727 },
      { platform: 'instagram', uniqueId: 'tasyafarasya', nickname: 'Tasya Farasya', followers: 7353432 },
    ]);
  });

  it('respons lain / rusak → kosong', () => {
    for (const x of [null, {}, { data: null }, { data: { user: { username: 'a' } } }, { data: { xig_user_by_igid_v2: { id: '1' } } }]) {
      expect(parseInstagram(x)).toEqual({ profiles: [], posts: [], reels: [] });
    }
  });
});

describe('parseInstagram — grid profil', () => {
  it('raditya_dika: 2 halaman grid, views kosong (bukan 0), share kosong', () => {
    const posts = postsOf(radit, 'raditya_dika');
    expect(posts).toHaveLength(24); // termasuk collab milik @bibit.id yang tampil di grid raditya_dika
    expect(posts[1]).toEqual({
      id: '4008520087469763759',
      authorId: 'raditya_dika',
      createTime: 1792072940,
      pinned: false,
      views: null,
      likes: 26888,
      comments: 282,
      shares: null,
    });
    expect(posts.every((p) => p.views === null && p.shares === null)).toBe(true);
  });

  it('pinned per akun: id akun ada di timeline_pinned_user_ids (bukan sekadar tidak kosong)', () => {
    const posts = postsOf(radit, 'raditya_dika');
    expect(posts.filter((p) => p.pinned).map((p) => p.id)).toEqual(['3992339884160944230']);
    // Dd6SRA-gf9V di-pin oleh kolaborator @colab.asia, bukan oleh raditya_dika.
    const colab = parseInstagram(radit[1]).posts.filter((p) => p.id === '3997587953361747797');
    expect(colab.map((p) => [p.authorId, p.pinned])).toEqual([['raditya_dika', false], ['colab.asia', true]]);
    expect(postsOf(natgeo, 'natgeo').filter((p) => p.pinned)).toHaveLength(3);
  });

  it('post collab dihitung untuk pemilik dan kolaborator', () => {
    const p = parseInstagram(radit[1]).posts.filter((x) => x.id === '3999684669737626357');
    expect(p.map((x) => x.authorId)).toEqual(['bibit.id', 'raditya_dika']);
  });

  it('likes disembunyikan (kasus sisipan, belum diverifikasi data asli) → likes & views null', () => {
    const page = structuredClone(radit[0]);
    const node = page.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges[1].node as Record<string, unknown>;
    node.like_and_view_counts_disabled = true;
    const p = parseInstagram(page).posts.find((x) => x.id === node.pk)!;
    expect(p.likes).toBeNull();
    expect(p.views).toBeNull();
    expect(p.comments).toBe(282);
  });

  it('ER followers dari fixture asli: 12 post terbaru, pinned dikecualikan, semua tipe post', () => {
    const cases = [
      [radit, 'raditya_dika', 21808091, 259883, 2085],
      [natgeo, 'natgeo', 268357727, 1045888, 2554],
      [tasya, 'tasyafarasya', 7353432, 237415, 1916],
    ] as const;
    for (const [pages, user, followers, likes, comments] of cases) {
      const m = computeMetrics(followers, selectRecentVideos(postsOf([...pages], user)))!;
      expect(m.sampleSize).toBe(12);
      expect(m.hiddenLikes).toBe(0);
      expect(m.avgLikes).toBeCloseTo(likes / 12);
      expect(m.erFollowers).toBeCloseTo(((likes + comments) / 12 / followers) * 100, 10);
      expect(m.avgViews).toBeNull();
      expect(m.avgShares).toBeNull();
      expect(m.erViews).toBeNull();
      expect(m.erViewsAvg).toBeNull();
    }
  });
});

describe('parseInstagram — tab Reels', () => {
  it('play_count jadi views; waktu dari pk karena taken_at tidak ada', () => {
    const r = parseInstagram(reels).reels;
    expect(r).toHaveLength(12 + 14); // 12 reels + satu baris per kolaborator (14)
    const mine = r.filter((x) => x.authorId === 'raditya_dika');
    expect(mine).toHaveLength(12);
    expect(mine[0]).toMatchObject({ id: '4008520087469763759', views: 604524, likes: 26890, comments: 282, shares: null, pinned: false });
    expect(Math.abs(mine[0].createTime - 1792072940)).toBeLessThan(600); // taken_at asli di grid
  });

  it('ER views reels saja, tanpa share, digabung ke metrik grid', () => {
    const grid = computeMetrics(21808091, selectRecentVideos(postsOf(radit, 'raditya_dika')))!;
    const rv = computeMetrics(21808091, selectRecentVideos(parseInstagram(reels).reels.filter((x) => x.authorId === 'raditya_dika')))!;
    const m = withViewsFrom(grid, rv);
    // Σ views 5814965, Σ likes 259890, Σ komentar 2085 (dihitung terpisah dari fixture)
    expect(m.viewsSampleSize).toBe(12);
    expect(m.avgViews).toBeCloseTo(5814965 / 12);
    expect(m.erViews).toBeCloseTo(((259890 + 2085) / 5814965) * 100, 10);
    expect(m.erViewsAvg).toBeCloseTo(4.068817912091817, 10);
    expect(m.erFollowers).toBe(grid.erFollowers); // ER followers tetap dari grid
    expect(m.avgShares).toBeNull();
  });

  it('timeFromPk ≈ taken_at', () => {
    expect(timeFromPk('3992339884160944230')).toBe(1790144022);
    expect(timeFromPk('bukan angka')).toBe(0);
  });
});

describe('parseInstagramBody', () => {
  const text = JSON.stringify(users[0]);
  it('JSON biasa, prefix for (;;);, dan multi-baris', () => {
    expect(parseInstagramBody(text).profiles).toHaveLength(1);
    expect(parseInstagramBody(`for (;;);${text}`).profiles).toHaveLength(1);
    const multi = `${text}\n{"extensions":{"is_final":true}}\n${JSON.stringify(radit[0])}\nrusak{`;
    const d = parseInstagramBody(multi);
    expect(d.profiles).toHaveLength(1);
    expect(d.posts).toHaveLength(12 + 12); // 12 post + satu baris per kolaborator (12)
  });
  it('respons tanpa kunci yang dikenal dilewati tanpa JSON.parse', () => {
    expect(parseInstagramBody('{"data":{"xdt_get_inbox_tray_items":{"inbox_tray_items":[]}}}')).toEqual({ profiles: [], posts: [], reels: [] });
    expect(parseInstagramBody('bukan json "follower_count"')).toEqual({ profiles: [], posts: [], reels: [] });
  });
});

describe('parseOgDescription (cadangan, dibulatkan)', () => {
  const og = (s: string, u: string) =>
    `${s} Followers, 725 Following, 7,495 Posts - See Instagram photos and videos from Raditya Dika (@${u})`;
  it('membaca K/M/B dan ribuan berkoma', () => {
    expect(parseOgDescription(og('22M', 'raditya_dika'), 'raditya_dika')).toEqual({
      platform: 'instagram', uniqueId: 'raditya_dika', nickname: 'Raditya Dika', followers: 22000000,
    });
    expect(parseOgDescription(og('1.2K', 'a'), 'a')?.followers).toBe(1200);
    expect(parseOgDescription(og('7,495', 'a'), 'a')?.followers).toBe(7495);
  });
  it('username tidak cocok (meta basi setelah pindah profil) / format lain → null', () => {
    expect(parseOgDescription(og('22M', 'raditya_dika'), 'natgeo')).toBeNull();
    expect(parseOgDescription('22 jt Pengikut, …', 'raditya_dika')).toBeNull();
  });
});

describe('apiKind per host', () => {
  it('IG: hanya endpoint GraphQL web, TikTok tidak berubah', () => {
    expect(apiKind('/api/graphql', 'www.instagram.com')).toBe('instagram');
    expect(apiKind('https://www.instagram.com/graphql/query', 'www.instagram.com')).toBe('instagram');
    expect(apiKind('https://www.instagram.com/api/v1/web/fxcal/ig_sso_users/', 'www.instagram.com')).toBeNull();
    expect(apiKind('https://www.tiktok.com/api/post/item_list/?x=1')).toBe('item_list');
    expect(apiKind('/api/graphql', 'www.tiktok.com')).toBeNull();
  });
});
