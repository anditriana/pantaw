// Protokol postMessage antara script world MAIN dan content script (isolated world).
export const SOURCE_MAIN = 'pantaw:main';
export const SOURCE_CONTENT = 'pantaw:content';

export type ApiKind = 'item_list' | 'user_detail';

export interface ApiMessage {
  source: typeof SOURCE_MAIN;
  kind: ApiKind;
  data: unknown;
}

export function apiKind(url: string): ApiKind | null {
  if (url.includes('/api/post/item_list')) return 'item_list';
  if (url.includes('/api/user/detail')) return 'user_detail';
  return null;
}
