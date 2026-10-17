import type { Platform } from './parse';

/** uniqueId dari path halaman profil (`/@user`), selain itu null (mis. `/@user/video/123`). */
export function profileFromPath(pathname: string): string | null {
  const m = /^\/@([^/?#]+)\/?$/.exec(pathname);
  return m ? decodeURIComponent(m[1]) : null;
}

// Segmen pertama path IG yang bukan username.
const IG_RESERVED = new Set([
  'p', 'reel', 'reels', 'tv', 'explore', 'stories', 'accounts', 'direct', 'about', 'legal', 'developer',
  'web', 'api', 'graphql', 'challenge', 'oauth', 'privacy', 'session', 'emails', 'topics', 'locations',
  'directory', 'create', 'your_activity', 'ar', 'threads', 'lite', 'nametag', 'meta-verified',
]);

export interface IgRoute {
  username: string;
  /** Tab Reels profil (`/<user>/reels/`) — satu-satunya tempat views reels dimuat. */
  reelsTab: boolean;
}

/** `/<user>/`, `/<user>/reels/`, `/<user>/tagged/` → username; post, reel, explore, dll. → null. */
export function igProfileFromPath(pathname: string): IgRoute | null {
  const m = /^\/([A-Za-z0-9._]{1,30})\/(?:(reels|tagged)\/?)?$/.exec(pathname.endsWith('/') ? pathname : `${pathname}/`);
  if (!m || IG_RESERVED.has(m[1].toLowerCase())) return null;
  return { username: m[1], reelsTab: m[2] === 'reels' };
}

export function platformFromHost(hostname: string): Platform | null {
  if (hostname === 'www.tiktok.com') return 'tiktok';
  if (hostname === 'www.instagram.com') return 'instagram';
  return null;
}
