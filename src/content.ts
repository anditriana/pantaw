// Content script (isolated world). Mengumpulkan data dari JSON hidrasi + respons yang
// diteruskan main-world.ts, lalu menampilkan kartu ER di halaman profil.
import { COLUMN_BY_ID, moveColumn, normalizeConfig, toggleColumn, type ColumnConfig } from './lib/columns';
import { SOURCE_CONTENT, SOURCE_MAIN, type ApiMessage } from './lib/messages';
import { SAMPLE_SIZE, computeMetrics, selectRecentVideos } from './lib/metrics';
import { parseItemList, parseUniversalData, parseUserDetail, type Profile, type Video } from './lib/parse';
import { profileFromPath } from './lib/route';
import { sheetHeader, sheetRow } from './lib/sheet';
import { CARD_CSS } from './card-css';

// Form Google untuk request fitur; dibuka di tab baru tanpa prefill (tidak ada data yang dikirim ke form).
const FEATURE_REQUEST_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScbND6vNpF3qs1xwdoRVBqN4rPflwlAMZY8rtbEgm_pzU4eSw/viewform';

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
let settingsOpen = false;

// Pengaturan kolom (urutan + tampil) — dipakai kartu DAN baris salin; disimpan di chrome.storage.local.
const STORAGE_KEY = 'columns';
let config: ColumnConfig = normalizeConfig(null);

async function loadConfig() {
  try {
    config = normalizeConfig((await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]);
  } catch {
    config = normalizeConfig(null);
  }
  render();
}

function changeConfig(next: ColumnConfig) {
  config = next;
  try {
    void chrome.storage.local.set({ [STORAGE_KEY]: config }).catch(() => {});
  } catch {
    // gagal simpan → tetap berlaku di tab ini
  }
}

try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;
    config = normalizeConfig(changes[STORAGE_KEY].newValue);
    render();
  });
} catch {
  // storage tidak tersedia → pakai default
}

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
  if (!profile || !m || !config.some((c) => c.enabled)) return;
  let ok = true;
  try {
    await navigator.clipboard.writeText(
      action === 'copy-row' ? sheetRow(profile, m, new Date(), config) : sheetHeader(config),
    );
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
      // Klik tanpa aksi (mis. teks <label>) jangan render: innerHTML yang diganti memutus label dari checkbox-nya.
      if (!action) return;
      if (action === 'toggle') collapsed = !collapsed;
      if (action === 'close') dismissedFor = profileFromPath(location.pathname);
      const id = (e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id') ?? '';
      if (action === 'settings') settingsOpen = !settingsOpen;
      if (action === 'settings-done') settingsOpen = false;
      if (action === 'settings-reset') changeConfig(normalizeConfig(null));
      if (action === 'col-toggle') changeConfig(toggleColumn(config, id));
      if (action === 'col-up') changeConfig(moveColumn(config, id, -1));
      if (action === 'col-down') changeConfig(moveColumn(config, id, 1));
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
  const row = (label: string, value: string, er?: boolean) =>
    `<div class="row${er ? ' er' : ''}"><span>${label}</span><b>${value}</b></div>`;
  const none = !config.some((c) => c.enabled);
  const copyLabel = (action: string, text: string) => (none ? 'Pilih kolom dulu' : label(action, text));
  let body: string;
  if (settingsOpen) {
    body =
      `<p class="muted intro">Atur kolom yang tampil di kartu dan di hasil Salin data / Salin judul kolom. ` +
      `Centang = tampil, kosongkan = sembunyi; ↑ ↓ = ubah urutan; Kembalikan default = reset. ` +
      `Tersimpan di browser ini, berlaku di semua tab.</p>` +
      `<div class="cols">${config
        .map((c, i) => {
          const def = COLUMN_BY_ID.get(c.id)!;
          return (
            `<div class="col" data-id="${c.id}"><input type="checkbox" id="c-${c.id}" data-action="col-toggle"${c.enabled ? ' checked' : ''}>` +
            `<label for="c-${c.id}">${def.label}</label>` +
            `<button data-action="col-up" title="Naik"${i === 0 ? ' disabled' : ''}>↑</button>` +
            `<button data-action="col-down" title="Turun"${i === config.length - 1 ? ' disabled' : ''}>↓</button></div>`
          );
        })
        .join('')}</div>` +
      `<div class="actions"><button class="copy" data-action="settings-done">Selesai</button>` +
      `<button class="link" data-action="settings-reset">Kembalikan default</button></div>`;
  } else if (!m) {
    body = `<p class="muted">Menunggu data video… Bila tidak muncul, scroll daftar video sedikit atau muat ulang halaman.</p>`;
  } else {
    body =
      config
        .map((c) => COLUMN_BY_ID.get(c.id)!)
        .filter((d) => d.card && config.find((c) => c.id === d.id)!.enabled)
        .map((d) => row(d.card!.label, d.card!.value(m), d.card!.er))
        .join('') +
      `<p class="muted">${m.sampleSize} video terakhir${m.sampleSize < SAMPLE_SIZE ? ` (kurang dari ${SAMPLE_SIZE})` : ''}, pinned dikecualikan.</p>` +
      `<div class="actions"><button class="copy" data-action="copy-row"${none ? ' disabled' : ''}>${copyLabel('copy-row', 'Salin data')}</button>` +
      `<button class="link" data-action="copy-header"${none ? ' disabled' : ''}>${copyLabel('copy-header', 'Salin judul kolom')}</button></div>` +
      `<div class="foot"><a href="${FEATURE_REQUEST_URL}" target="_blank" rel="noopener noreferrer">Request fitur</a></div>`;
  }

  ensureHost().innerHTML =
    `<style>${CARD_CSS}</style>` +
    `<div class="card${collapsed ? ' collapsed' : ''}">` +
    `<div class="head"><button class="title" data-action="toggle" title="Ciutkan/buka">Pantaw · @${esc(uid)}</button>` +
    `<button data-action="settings" title="Pengaturan kolom">⚙</button>` +
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
  void loadConfig();
  readHydration();
  onTick();
  setInterval(onTick, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
