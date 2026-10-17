// Parser murni untuk respons yang dimuat halaman profil Instagram (instagram.com/<user>/ dan /<user>/reels/).
// Nama field diverifikasi pada respons asli 2026-10-17 (akun cadangan, login), lihat tests/fixtures/*.instagram.json.
// doc_id / nama operasi GraphQL berubah-ubah → respons dikenali dari bentuk JSON-nya, bukan dari URL.
import type { Post, Profile } from './parse';

export interface IgData {
  profiles: Profile[];
  /** Grid profil: likes & komentar, views selalu null (grid tidak memuat views). */
  posts: Post[];
  /** Tab Reels: dengan views (play_count). */
  reels: Post[];
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Epoch ID media IG (ms): `pk >> 23` = ms sejak epoch ini. Dipakai bila taken_at tidak ada (respons tab Reels). */
const IG_EPOCH_MS = 1314220021721;

export function timeFromPk(pk: string): number {
  try {
    return Math.floor((Number(BigInt(pk) >> 23n) + IG_EPOCH_MS) / 1000);
  } catch {
    return 0;
  }
}

/** Pemilik + kolaborator: post collab tampil di grid semua akun itu. */
function owners(m: Obj): { pk: string; username: string }[] {
  const out: { pk: string; username: string }[] = [];
  for (const u of [m.user, ...(Array.isArray(m.coauthor_producers) ? m.coauthor_producers : [])]) {
    if (isObj(u) && typeof u.username === 'string' && u.username) out.push({ pk: str(u.pk), username: u.username });
  }
  return out;
}

/** Satu media → satu Post per akun yang menampilkannya. Pinned dihitung per akun (id akun ada di daftar pin). */
function toPosts(m: Obj, pinKey: string, withViews: boolean): Post[] {
  const id = str(m.pk);
  if (!id) return [];
  const comments = count(m.comment_count);
  if (comments === null) return [];
  const hidden = m.like_and_view_counts_disabled === true;
  const pins = Array.isArray(m[pinKey]) ? (m[pinKey] as unknown[]).map(str) : [];
  // Views hanya untuk video (media_type 2); foto/carousel → null, bukan 0.
  const views = !hidden && withViews && m.media_type === 2 ? count(m.play_count) ?? count(m.view_count) : null;
  return owners(m).map((o) => ({
    id,
    authorId: o.username,
    createTime: count(m.taken_at) ?? timeFromPk(id),
    pinned: pins.includes(o.pk),
    views,
    likes: hidden ? null : count(m.like_count),
    comments,
    shares: null,
  }));
}

/** Satu objek JSON respons /api/graphql atau /graphql/query. Bentuk lain → semua daftar kosong. */
export function parseInstagram(json: unknown): IgData {
  const out: IgData = { profiles: [], posts: [], reels: [] };
  const data = isObj(json) && isObj(json.data) ? json.data : null;
  if (!data) return out;

  // Profil: data.user dengan follower_count (respons kecil yang dimuat bersama halaman profil).
  const u = data.user;
  if (isObj(u) && typeof u.username === 'string' && u.username && count(u.follower_count) !== null) {
    out.profiles.push({
      platform: 'instagram',
      uniqueId: u.username,
      nickname: typeof u.full_name === 'string' && u.full_name ? u.full_name : u.username,
      followers: count(u.follower_count)!,
    });
  }

  // Grid profil.
  const grid = data.xdt_api__v1__feed__user_timeline_graphql_connection;
  if (isObj(grid) && Array.isArray(grid.edges)) {
    for (const e of grid.edges) if (isObj(e) && isObj(e.node)) out.posts.push(...toPosts(e.node, 'timeline_pinned_user_ids', false));
  }

  // Tab Reels: nama kunci induk berubah-ubah (fetch__XDTUserDict) → cari clips_connection satu tingkat di bawah data.
  for (const v of Object.values(data)) {
    const clips = isObj(v) ? v.clips_connection : null;
    if (!isObj(clips) || !Array.isArray(clips.edges)) continue;
    for (const e of clips.edges) {
      const m = isObj(e) && isObj(e.node) ? e.node.media : null;
      if (isObj(m)) out.reels.push(...toPosts(m, 'clips_tab_pinned_user_ids', true));
    }
  }
  return out;
}

/** Kunci yang menandai respons berguna — dicek pada teks sebelum JSON.parse supaya respons lain dilewati murah. */
const RELEVANT = ['"follower_count"', 'user_timeline_graphql_connection', '"clips_connection"'];

/**
 * Teks body respons → IgData gabungan. Body bisa diawali `for (;;);` dan bisa berisi beberapa
 * JSON per baris (streaming); baris yang bukan JSON dilewati.
 */
export function parseInstagramBody(text: string): IgData {
  const out: IgData = { profiles: [], posts: [], reels: [] };
  if (!RELEVANT.some((k) => text.includes(k))) return out;
  const body = text.replace(/^\s*for \(;;\);/, '');
  let objs: unknown[];
  try {
    objs = [JSON.parse(body)];
  } catch {
    objs = [];
    for (const line of body.split('\n')) {
      try {
        if (line.trim()) objs.push(JSON.parse(line));
      } catch {
        // bukan JSON → lewati
      }
    }
  }
  for (const o of objs) {
    const d = parseInstagram(o);
    out.profiles.push(...d.profiles);
    out.posts.push(...d.posts);
    out.reels.push(...d.reels);
  }
  return out;
}

const SUFFIX: Record<string, number> = { '': 1, K: 1e3, M: 1e6, B: 1e9 };

/**
 * Cadangan followers dari <meta property="og:description"> — angka DIBULATKAN (mis. "22M Followers").
 * Hanya format bahasa Inggris; username di teks harus cocok supaya meta basi setelah navigasi SPA tidak terpakai.
 */
export function parseOgDescription(og: string, username: string): Profile | null {
  const m = /^([\d.,]+)\s*([KMB]?)\s+Followers\b.*\bfrom (.*) \(@([^)]+)\)/.exec(og);
  if (!m || m[4].toLowerCase() !== username.toLowerCase()) return null;
  // "7,495" = ribuan; "1.2M" = desimal.
  const n = Number(m[1].replace(/,/g, '')) * SUFFIX[m[2]];
  if (!Number.isFinite(n)) return null;
  return { platform: 'instagram', uniqueId: m[4], nickname: m[3].trim() || m[4], followers: Math.round(n) };
}
