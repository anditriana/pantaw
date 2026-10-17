// Protokol postMessage antara script world MAIN dan content script (isolated world).
export const SOURCE_MAIN = 'pantaw:main';
export const SOURCE_CONTENT = 'pantaw:content';

/** item_list / user_detail: JSON mentah TikTok. instagram: IgData yang sudah diparse di world MAIN. */
export type ApiKind = 'item_list' | 'user_detail' | 'instagram';

export interface ApiMessage {
  source: typeof SOURCE_MAIN;
  kind: ApiKind;
  data: unknown;
}

export function apiKind(url: string, hostname = 'www.tiktok.com'): ApiKind | null {
  if (hostname === 'www.instagram.com') {
    // Semua query GraphQL web IG; isinya disaring dari bentuk JSON (parseInstagramBody).
    return /^(?:https:\/\/www\.instagram\.com)?\/(?:api\/graphql|graphql\/query)\b/.test(url) ? 'instagram' : null;
  }
  if (url.includes('/api/post/item_list')) return 'item_list';
  if (url.includes('/api/user/detail')) return 'user_detail';
  return null;
}
