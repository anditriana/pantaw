// Berjalan di world MAIN (konteks JS halaman) sejak document_start.
// Hanya MEMBACA respons yang memang diminta halaman sendiri (item_list, user/detail)
// lalu meneruskannya ke content script lewat postMessage. Tidak membuat request baru.
import { SOURCE_CONTENT, SOURCE_MAIN, apiKind, type ApiKind, type ApiMessage } from './lib/messages';

const BUFFER_MAX = 20;
const buffer: ApiMessage[] = [];

function emit(kind: ApiKind, data: unknown) {
  const msg: ApiMessage = { source: SOURCE_MAIN, kind, data };
  buffer.push(msg);
  if (buffer.length > BUFFER_MAX) buffer.shift();
  window.postMessage(msg, location.origin);
}

// Content script bisa siap setelah respons pertama tiba → putar ulang buffer saat diminta.
window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.source !== SOURCE_CONTENT || e.data?.kind !== 'hello') return;
  for (const msg of buffer) window.postMessage(msg, location.origin);
});

const origFetch = window.fetch;
window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>) {
  const promise = origFetch.apply(this, args);
  const input = args[0];
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const kind = apiKind(url);
  if (kind) {
    promise
      .then((res) => res.clone().json())
      .then((data) => emit(kind, data))
      .catch(() => {}); // body kosong (mis. captcha) → abaikan
  }
  return promise;
} as typeof fetch;

const origOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) {
  const kind = apiKind(String(args[1]));
  if (kind) {
    this.addEventListener('load', () => {
      try {
        const data =
          this.responseType === 'json' ? this.response
          : this.responseType === '' || this.responseType === 'text' ? JSON.parse(this.responseText)
          : null;
        if (data) emit(kind, data);
      } catch {
        // abaikan respons yang bukan JSON
      }
    });
  }
  return (origOpen as (...a: unknown[]) => void).apply(this, args);
} as typeof XMLHttpRequest.prototype.open;
