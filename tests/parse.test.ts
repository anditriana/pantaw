import { describe, expect, it } from 'vitest';
import itemList from './fixtures/item_list.tiktok.json';
import universal from './fixtures/universal_data.tiktok.json';
import { parseItemList, parseUniversalData, parseUserDetail } from '../src/lib/parse';

describe('parseUniversalData', () => {
  it('membaca profil dari JSON hidrasi, statsV2 (presisi) diutamakan', () => {
    expect(parseUniversalData(universal)).toEqual({ uniqueId: 'tiktok', nickname: 'TikTok', followers: 96199454 });
  });

  it('jatuh ke stats bila statsV2 tidak ada', () => {
    const info = structuredClone(universal.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo) as Record<string, unknown>;
    delete info.statsV2;
    expect(parseUserDetail({ userInfo: info })?.followers).toBe(96200000);
  });

  it('null untuk bentuk yang tidak dikenal', () => {
    expect(parseUniversalData(null)).toBeNull();
    expect(parseUniversalData({ __DEFAULT_SCOPE__: {} })).toBeNull();
    expect(parseUserDetail({ userInfo: { user: {} } })).toBeNull();
  });
});

describe('parseItemList', () => {
  it('membaca 16 video dari respons asli', () => {
    const { videos, author } = parseItemList(itemList);
    expect(videos).toHaveLength(16);
    expect(videos[0]).toEqual({
      id: '7694797676306615583',
      authorId: 'tiktok',
      createTime: 1791584711,
      pinned: false,
      views: 550300,
      likes: 3473,
      comments: 1197,
      shares: 225,
    });
    expect(author).toEqual({ uniqueId: 'tiktok', nickname: 'tiktok', followers: 96200000 });
  });

  it('menandai isPinnedItem: true sebagai pinned', () => {
    const data = structuredClone(itemList);
    (data.itemList[2] as Record<string, unknown>).isPinnedItem = true;
    expect(parseItemList(data).videos.filter((v) => v.pinned).map((v) => v.id)).toEqual([data.itemList[2].id]);
  });

  it('respons kosong / rusak → daftar kosong', () => {
    expect(parseItemList({}).videos).toEqual([]);
    expect(parseItemList({ itemList: [null, { id: 1 }] }).videos).toEqual([]);
  });
});
