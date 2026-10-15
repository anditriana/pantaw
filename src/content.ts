// Content script (isolated world). Mengumpulkan data dari JSON hidrasi + respons yang
// diteruskan main-world.ts, lalu menampilkan kartu ER di halaman profil.
import { formatCount, formatPercent } from './lib/format';
import { SOURCE_CONTENT, SOURCE_MAIN, type ApiMessage } from './lib/messages';
import { SAMPLE_SIZE, computeMetrics, selectRecentVideos } from './lib/metrics';
import { parseItemList, parseUniversalData, parseUserDetail, type Profile, type Video } from './lib/parse';
import { profileFromPath } from './lib/route';
import { sheetHeader, sheetRow } from './lib/sheet';
import { CARD_CSS } from './card-css';

const key = (uniqueId: string) => uniqueId.toLowerCase();

const profiles = new Map<string, Profile>(); // dari hidrasi / user/detail (angka presisi)
const fallbackProfiles = new Map<string, Profile>(); // dari authorStats di item_list
const videos = new Map<string, Map<string, Video>>();

function addProfile(p: Profile | null) {
  if (p) profiles.set(key(p.uniqueId), p);
}

function addVideos(list: Video[]) {
  for (const v of list) {
    const k = key(v.authorId);
    if (!videos.has(k)) videos.set(k, new Map());
    videos.get(k)!.set(v.id, v);
  }
}

window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.source !== SOURCE_MAIN) return;
  const msg = e.data as ApiMessage;
  if (msg.kind === 'item_list') {
    const { videos: list, author } = parseItemList(msg.data);
    addVideos(list);
    if (author) fallbackProfiles.set(key(author.uniqueId), author);
  } else if (msg.kind === 'user_detail') {
    addProfile(parseUserDetail(msg.data));
  }
  render();
});
window.postMessage({ source: SOURCE_CONTENT, kind: 'hello' }, location.origin);

function readHydration() {
  const el = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
  if (!el?.textContent) return;
  try {
    addProfile(parseUniversalData(JSON.parse(el.textContent)));
  } catch {
    // format berubah → andalkan item_list / user/detail
  }
}

// ---- Kartu (shadow DOM supaya CSS TikTok dan CSS kartu tidak saling bocor) ----

let host: HTMLDivElement | null = null;
let root: ShadowRoot;
let collapsed = false;
let dismissedFor: string | null = null;
let copyFeedback: { action: string; ok: boolean } | null = null; // umpan balik tombol salin
let copyTimer: ReturnType<typeof setTimeout> | undefined;

function currentData() {
  const uid = profileFromPath(location.pathname);
  if (!uid) return { uid, profile: undefined, m: null };
  const k = key(uid);
  const profile = profiles.get(k) ?? fallbackProfiles.get(k);
  const sample = selectRecentVideos([...(videos.get(k)?.values() ?? [])]);
  const m = profile ? computeMetrics(profile.followers, sample) : null;
  return { uid, profile, m };
}

async function copyAction(action: string) {
  const { profile, m } = currentData();
  if (!profile || !m) return;
  let ok = true;
  try {
    await navigator.clipboard.writeText(action === 'copy-row' ? sheetRow(profile, m, new Date()) : sheetHeader());
  } catch {
    ok = false;
  }
  copyFeedback = { action, ok };
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyFeedback = null;
    render();
  }, 1500);
  render();
}

function ensureHost(): ShadowRoot {
  if (!host) {
    host = document.createElement('div');
    host.id = 'kol-ext-card';
    root = host.attachShadow({ mode: 'open' });
    root.addEventListener('click', (e) => {
      const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
      if (action === 'toggle') collapsed = !collapsed;
      if (action === 'close') dismissedFor = profileFromPath(location.pathname);
      if (action === 'copy-row' || action === 'copy-header') void copyAction(action);
      render();
    });
  }
  if (!host.isConnected) document.body.append(host);
  return root;
}

function removeHost() {
  host?.remove();
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function render() {
  if (!document.body) return;
  const uid = profileFromPath(location.pathname);
  if (!uid || dismissedFor === uid) return removeHost();

  const { m } = currentData();

  const label = (action: string, text: string) =>
    copyFeedback?.action === action ? (copyFeedback.ok ? 'Tersalin ✓' : 'Gagal menyalin') : text;
  const row = (label: string, value: string) => `<div class="row"><span>${label}</span><b>${value}</b></div>`;
  let body: string;
  if (!m) {
    body = `<p class="muted">Menunggu data video… Bila tidak muncul, scroll daftar video sedikit atau muat ulang halaman.</p>`;
  } else {
    body =
      `<div class="er">${row('ER (followers)', formatPercent(m.erFollowers))}${row('ER views (total)', formatPercent(m.erViews))}${row('ER views (rata-rata/video)', formatPercent(m.erViewsAvg))}</div>` +
      row('Followers', formatCount(m.followers)) +
      row('Rata-rata views', formatCount(m.avgViews)) +
      row('Rata-rata likes', formatCount(m.avgLikes)) +
      row('Rata-rata komentar', formatCount(m.avgComments)) +
      row('Rata-rata share', formatCount(m.avgShares)) +
      `<p class="muted">${m.sampleSize} video terakhir${m.sampleSize < SAMPLE_SIZE ? ` (kurang dari ${SAMPLE_SIZE})` : ''}, pinned dikecualikan.</p>` +
      `<div class="actions"><button class="copy" data-action="copy-row">${label('copy-row', 'Salin')}</button>` +
      `<button class="link" data-action="copy-header">${label('copy-header', 'Salin judul kolom')}</button></div>`;
  }

  ensureHost().innerHTML =
    `<style>${CARD_CSS}</style>` +
    `<div class="card${collapsed ? ' collapsed' : ''}">` +
    `<div class="head"><button data-action="toggle" title="Ciutkan/buka">KOL · @${esc(uid)}</button>` +
    `<button data-action="close" title="Tutup untuk profil ini">×</button></div>` +
    `<div class="body">${body}</div></div>`;
}

// ---- Navigasi SPA: TikTok berganti profil lewat history API tanpa reload ----

let lastPath = '';
function onTick() {
  if (location.pathname === lastPath) return;
  lastPath = location.pathname;
  render();
}

function start() {
  readHydration();
  onTick();
  setInterval(onTick, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
