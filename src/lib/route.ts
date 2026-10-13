/** uniqueId dari path halaman profil (`/@user`), selain itu null (mis. `/@user/video/123`). */
export function profileFromPath(pathname: string): string | null {
  const m = /^\/@([^/?#]+)\/?$/.exec(pathname);
  return m ? decodeURIComponent(m[1]) : null;
}
