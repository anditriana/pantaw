// Parser murni untuk data yang sudah dimuat halaman profil TikTok.
// Nama field diverifikasi pada respons asli (2026-10-12), lihat tests/fixtures/.
// `stats` berisi angka yang dibulatkan (mis. 96200000); `statsV2` berisi string
// yang lebih presisi, jadi statsV2 diutamakan.

export interface Profile {
  uniqueId: string;
  nickname: string;
  followers: number;
}

export interface Video {
  id: string;
  authorId: string; // uniqueId pemilik video
  createTime: number; // detik epoch
  pinned: boolean;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;

function num(v2: unknown, v1: unknown, key: string): number {
  for (const src of [v2, v1]) {
    if (!isObj(src)) continue;
    const n = Number(src[key]);
    if (src[key] !== undefined && src[key] !== '' && Number.isFinite(n)) return n;
  }
  return 0;
}

/** userInfo dari JSON hidrasi atau /api/user/detail → Profile. */
export function parseUserInfo(userInfo: unknown): Profile | null {
  if (!isObj(userInfo) || !isObj(userInfo.user)) return null;
  const uniqueId = userInfo.user.uniqueId;
  if (typeof uniqueId !== 'string' || !uniqueId) return null;
  return {
    uniqueId,
    nickname: typeof userInfo.user.nickname === 'string' ? userInfo.user.nickname : uniqueId,
    followers: num(userInfo.statsV2, userInfo.stats, 'followerCount'),
  };
}

/** Isi script#__UNIVERSAL_DATA_FOR_REHYDRATION__ (sudah di-JSON.parse). */
export function parseUniversalData(data: unknown): Profile | null {
  if (!isObj(data) || !isObj(data.__DEFAULT_SCOPE__)) return null;
  const detail = data.__DEFAULT_SCOPE__['webapp.user-detail'];
  return isObj(detail) ? parseUserInfo(detail.userInfo) : null;
}

/** Respons /api/user/detail/. */
export function parseUserDetail(data: unknown): Profile | null {
  return isObj(data) ? parseUserInfo(data.userInfo) : null;
}

/** Respons /api/post/item_list/ → video + profil cadangan dari authorStats. */
export function parseItemList(data: unknown): { videos: Video[]; author: Profile | null } {
  const list = isObj(data) && Array.isArray(data.itemList) ? data.itemList : [];
  const videos: Video[] = [];
  let author: Profile | null = null;
  for (const it of list) {
    if (!isObj(it) || typeof it.id !== 'string' || !isObj(it.author)) continue;
    const authorId = it.author.uniqueId;
    if (typeof authorId !== 'string') continue;
    videos.push({
      id: it.id,
      authorId,
      createTime: Number(it.createTime) || 0,
      pinned: it.isPinnedItem === true,
      views: num(it.statsV2, it.stats, 'playCount'),
      likes: num(it.statsV2, it.stats, 'diggCount'),
      comments: num(it.statsV2, it.stats, 'commentCount'),
      shares: num(it.statsV2, it.stats, 'shareCount'),
    });
    if (!author && (isObj(it.authorStatsV2) || isObj(it.authorStats))) {
      author = {
        uniqueId: authorId,
        nickname: typeof it.author.nickname === 'string' ? it.author.nickname : authorId,
        followers: num(it.authorStatsV2, it.authorStats, 'followerCount'),
      };
    }
  }
  return { videos, author };
}
