# Draft listing Chrome Web Store — Pantaw 0.1.0

Isi untuk disalin ke Developer Dashboard. Folder `store/` sengaja **di luar** `docs/` supaya tidak tayang di GitHub Pages.
Semua klaim di bawah dicocokkan dengan kode (`manifest.json`, `src/`) dan `docs/privacy.html` per 2026-10-16.
Jumlah karakter dihitung dengan `[...teks].length` (Node), tanpa spasi/baris awal-akhir.

---

## 1. Tab "Store listing"

### Nama & summary — dari `_locales/` (tidak diketik di dashboard)

`manifest.json` memakai `__MSG_appName__` / `__MSG_appShortName__` / `__MSG_appDescription__` dengan
`default_locale: "id"`; teksnya di `_locales/id/messages.json` dan `_locales/en/messages.json`. Dashboard mengambil nama &
summary per bahasa dari situ. Mengubahnya berarti zip baru (dan naik `version` bila sudah pernah diupload). Batas karakter
dijaga `tests/locales.test.ts`.

| Field | Indonesian (`id`, default) | English (`en`) |
|---|---|---|
| Nama (`appName`, maks 75) | `Pantaw – KOL ER Checker for TikTok` (34) | sama (34) |
| Nama pendek (`appShortName`, maks 12) | `Pantaw` (6) | sama (6) |
| Summary (`appDescription`, maks 132) | lihat di bawah (131) | lihat di bawah (130) |

Summary `id` — 131/132:

```
Cek engagement rate (ER) kreator TikTok langsung di halaman profil: rata-rata views, likes, komentar. Dihitung lokal, tanpa server.
```

Summary `en` — 130/132:

```
Check TikTok creators' engagement rate (ER) right on their profile: average views, likes, comments. Calculated locally, no server.
```

### Detailed description — Bahasa Indonesia (utama) — 2.060/16.000 karakter

```
Pantaw membantu marketer, brand, dan agensi menilai kreator (KOL) TikTok tanpa hitung manual. Buka profil kreator di tiktok.com, dan kartu kecil Pantaw muncul di pojok kanan bawah dengan ringkasan performa video terbarunya.

Yang ditampilkan:
• Followers
• Rata-rata views, likes, komentar, dan share dari 12 video terbaru (video pinned dikecualikan)
• ER followers = rata-rata (likes + komentar) ÷ followers × 100%
• ER views (total) = total (likes + komentar + share) ÷ total views × 100%
• ER views (rata-rata/video) = rata-rata ER views tiap video

Fitur:
• Salin data: satu klik menyalin satu baris siap tempel ke Google Sheets atau Excel. Tempel banyak kreator berurutan untuk membandingkan shortlist.
• Salin judul kolom: menyalin baris judul untuk baris pertama spreadsheet.
• Atur kolom (⚙): pilih kolom yang tampil dan urutannya. Pengaturan yang sama dipakai untuk kartu dan hasil salin, dan diingat di browser ini.

Cara pakai:
1. Pasang Pantaw.
2. Buka profil kreator TikTok, misalnya tiktok.com/@namakreator. Tidak perlu login.
3. Baca kartunya, lalu klik Salin data bila perlu.

Privasi:
Semua hitungan dilakukan di browser Anda. Pantaw tidak punya server, tidak memakai analytics atau telemetri, tidak membuat permintaan jaringan sendiri, dan tidak mengumpulkan atau mengirim data ke mana pun. Satu-satunya yang disimpan adalah pengaturan kolom, di perangkat Anda sendiri.

Keterbatasan:
• Angka berasal dari data yang sudah dimuat halaman TikTok, jadi hanya akurat sejauh data itu. Bila tampil "Menunggu data video…", gulir atau muat ulang halaman profil.
• Jumlah share tidak ditampilkan di halaman profil TikTok, tapi ikut ada dalam data video yang dimuat halaman; Pantaw membacanya dari situ.
• Hanya 12 video terbaru yang dihitung, tanpa video pinned. Kreator dengan kurang dari 12 video dihitung dari video yang ada.
• Saat ini hanya untuk TikTok di versi web (www.tiktok.com).

Pantaw adalah proyek independen dan tidak berafiliasi dengan, didukung, atau disponsori oleh TikTok maupun ByteDance.

Kode sumber: github.com/anditriana/pantaw
```

### Detailed description — English (localized listing) — 1.792/16.000 karakter

Keputusan user 2026-10-16: **satu listing, dua bahasa** — Indonesian (default) + English sebagai localized listing,
deskripsi lengkap per bahasa. Nama & summary English diambil dari `_locales/en/messages.json`. Teks UI kartu tetap
bahasa Indonesia di kedua locale (diterjemahkan nanti, TO DO 0.1.x) — karena itu deskripsi English menyebut
"The interface is in Indonesian." Langkah di dashboard: bagian 5, "Bahasa kedua".

```
Pantaw helps marketers, brands, and agencies assess TikTok creators (KOLs) without manual math. Open a creator's profile on tiktok.com and a small Pantaw card appears in the bottom-right corner with a summary of their recent videos.

What it shows:
• Followers
• Average views, likes, comments, and shares across the 12 most recent videos (pinned videos excluded)
• ER by followers = average (likes + comments) ÷ followers × 100%
• ER by views (total) = total (likes + comments + shares) ÷ total views × 100%
• ER by views (per-video average) = average of each video's ER by views

Features:
• Copy data: one click copies a single row ready to paste into Google Sheets or Excel. Paste several creators in a row to compare a shortlist.
• Copy column headers: copies the header row for the first line of your sheet.
• Column settings (⚙): choose which columns appear and in what order. The same settings apply to the card and the copied rows, and are remembered in this browser.

The interface is in Indonesian.

Privacy:
All calculations happen in your browser. Pantaw has no server, no analytics or telemetry, makes no network requests of its own, and does not collect or transmit any data. The only thing stored is your column settings, on your own device.

Limitations:
• Numbers come from data the TikTok page has already loaded, so they are only as accurate as that data.
• Share counts are not shown on TikTok profile pages, but they are included in the video data the page loads; Pantaw reads them from there.
• Only the 12 most recent videos are counted, excluding pinned videos.
• Works on TikTok's website (www.tiktok.com) only.

Pantaw is an independent project and is not affiliated with, endorsed by, or sponsored by TikTok or ByteDance.

Source code: github.com/anditriana/pantaw
```

### Category & bahasa

- **Category:** `Productivity` → subkategori yang paling dekat untuk alat kerja marketer (di dashboard saat ini kategori
  terbagi; pilih *Productivity → Tools* bila tersedia, kalau tidak *Productivity → Workflow & Planning*). Alternatif:
  *Social & Communication* — tidak disarankan, karena Pantaw bukan alat berkomunikasi.
- **Bahasa utama:** Indonesian (Bahasa Indonesia) — `default_locale: "id"`, sama dengan UI kartu.
- **Bahasa kedua:** English — localized listing dari `_locales/en/` (keputusan user 2026-10-16).

### URL

| Isian | Nilai |
|---|---|
| Official URL / Website (Homepage URL) | `https://anditriana.github.io/pantaw/` |
| Support URL | `https://github.com/anditriana/pantaw/issues` |
| Privacy policy URL (tab Privacy) | `https://anditriana.github.io/pantaw/privacy.html` |

Catatan: "Official URL" di dashboard hanya bisa memilih situs yang sudah diverifikasi di Google Search Console;
kalau belum, kosongkan dan cukup isi **Homepage URL**. Pastikan GitHub Pages sudah aktif (Settings → Pages → `main` /
`/docs`) dan kedua URL bisa dibuka **sebelum** submit — URL privacy yang 404 adalah alasan penolakan.

---

## 2. Tab "Privacy practices"

### Single purpose — 217 karakter

```
Pantaw shows engagement metrics (followers, average views/likes/comments/shares and engagement rate) for the TikTok creator profile the user is viewing, calculated locally from data the TikTok page has already loaded.
```

### Permission justification

**`storage`** — 223 karakter

```
Used only to save the user's column settings (which metrics are shown and in what order) in chrome.storage.local, so the card and the "Copy data" output keep the same layout across tabs and sessions. Nothing else is stored.
```

**Host permission `https://www.tiktok.com/*`** — 378 karakter

```
Pantaw only works on TikTok profile pages. Its content scripts run on www.tiktok.com to read the profile and recent-video stats that the page itself has already loaded (the page's embedded JSON and the page's own /api/post/item_list and /api/user/detail responses), and to display a small results card. It makes no network requests of its own and does not run on any other site.
```

Cocok dengan kode: `manifest.json` hanya `permissions: ["storage"]` + `host_permissions: ["https://www.tiktok.com/*"]`;
`src/main-world.ts` hanya membungkus `fetch`/`XMLHttpRequest` halaman untuk membaca salinan respons, tidak memanggil
URL baru; `chrome.storage.local` hanya key `columns` (`src/content.ts`).

### Remote code

Pilih **No, I am not using remote code.**

Alasan (tidak perlu diketik, untuk pegangan bila ditanya reviewer): semua JS dibundel esbuild ke dalam paket
(`main-world.js`, `content.js`); tidak ada `<script src>` eksternal, `eval`/`new Function`, atau modul yang diunduh
saat runtime. Link **Request fitur** hanya `<a target="_blank">` ke Google Forms — membuka halaman web, bukan
mengeksekusi kode di extension.

### Data usage

**Kategori data yang dikumpulkan: tidak ada yang dicentang** (keputusan user 2026-10-16).

| Kategori | Centang? | Alasan |
|---|---|---|
| Personally identifiable information | Tidak | Tidak ada akun/login/form di extension. |
| Health information | Tidak | — |
| Financial and payment information | Tidak | — |
| Authentication information | Tidak | Tidak membaca cookie/token/kata sandi. |
| Personal communications | Tidak | — |
| Location | Tidak | — |
| Web history | Tidak | Hanya memeriksa `location.pathname` tab TikTok yang sedang terbuka untuk mengenali profil; tidak dicatat/dikirim. |
| User activity | Tidak | Tidak ada analytics/telemetri; klik tombol hanya memicu aksi lokal. |
| Website content | Tidak* | Angka profil/video dibaca dan dihitung di memori tab, tidak disimpan permanen, tidak dikirim. |

\* Catatan jujur: kebijakan Chrome Web Store tidak menyatakan secara eksplisit apakah data yang **hanya diproses
lokal** dihitung sebagai "collect". Tafsiran umum (dan yang dipakai di sini, konsisten dengan `privacy.html`):
"collect" = data keluar dari perangkat / dikirim ke developer atau pihak ketiga. **Cadangan bila reviewer keberatan:**
centang **Website content** saja — lalu ketiga sertifikasi di bawah tetap benar, dan privacy policy tidak perlu diubah
karena sudah menjelaskan data apa yang dibaca dan bahwa semuanya tetap di browser.

**Tiga sertifikasi — centang ketiganya** (semuanya benar untuk Pantaw):

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://anditriana.github.io/pantaw/privacy.html`
(isinya sudah mencakup: hanya `tiktok.com`, data hanya di memori tab, `chrome.storage.local` untuk pengaturan kolom,
clipboard hanya ditulis saat klik, link Request fitur tanpa data, tanpa remote code, tidak berafiliasi TikTok.)

---

## 3. Aset grafis

| Aset | Ukuran | Wajib? | Status | File |
|---|---|---|---|---|
| Ikon store | 128×128 PNG | Ya | **Ada** — ikut di zip (`icons/icon128.png`, dibuat `scripts/icons.mjs` dari `assets/icon.svg`); upload file yang sama bila dashboard meminta | `dist/icons/icon128.png` (setelah `npm run build`) |
| Screenshot | 1280×800 (atau 640×400), PNG/JPEG, min 1 maks 5 | Ya (min 1) | **3 dibuat** | `store/screenshot-1.png` … `-3.png` |
| Small promo tile | 440×280 PNG/JPEG | Ya | **Dibuat** | `store/promo-small.png` (sumber `store/promo-small.svg`) |
| Marquee promo tile | 1400×560 | Tidak | Belum, tidak perlu untuk rilis pertama | — |
| Video YouTube promo | 1920×1080, 42 dtk | Tidak | **Ada** — diupload Unlisted | ID https://youtu.be/OPiShxayCyk · EN https://youtu.be/EWtBLgPVNeE (sumber `store/video/`) |
| Gambar promo Story (IG/WA, bukan untuk store) | 1080×1920 PNG, 3 slide | Tidak | **Dibuat** — CTA: badge "Segera di Chrome Web Store" + "DM untuk file mentahnya" (file beta via DM, listing belum tayang; tanpa URL); safe zone 250 px atas / 340 px bawah kosong | `release/story/pantaw-story-{1,2,3}.png` (tidak di-commit), sumber `store/story/`, render `node store/story/render.mjs` (`--guide` = overlay safe zone) |
| Gambar carousel feed Instagram (bukan untuk store) | 1080×1350 (4:5) PNG, 3 slide | Tidak | **Dibuat** — isi sama dengan Story, layout ditata ulang untuk 4:5, margin 80 px | `release/story/feed/pantaw-feed-{1,2,3}.png` (tidak di-commit), sumber sama `store/story/story.html?format=feed`, render `node store/story/render.mjs --feed` |

Membuat ulang semua PNG: `node store/render.mjs` (dari akar repo; butuh `google-chrome`, atau set `CHROME=/path/ke/chrome`).
`scripts/icons.mjs` tidak dipakai karena rasterizer mininya tidak bisa merender teks maupun menggabungkan gambar raster.

### Video promo YouTube

Dua versi, visual sama, teks overlay beda bahasa. Dipasang di field **Promo video** listing masing-masing bahasa:

| Listing | URL YouTube (Unlisted) | File lokal |
|---|---|---|
| Indonesian (utama) | https://youtu.be/OPiShxayCyk | `release/video/pantaw-promo-id.mp4` + `-thumb.png` |
| English (localized) | https://youtu.be/EWtBLgPVNeE | `release/video/pantaw-promo-en.mp4` + `-thumb.png` |

Isi: hook "Cek engagement rate KOL TikTok dalam 1 detik" → profil @tiktok + kartu Pantaw (zoom, sorot ER) →
Salin data → "Tersalin ✓" → tabel tempel berlabel "Contoh format · angka ilustrasi" → panel ⚙ → privasi (lokal, tanpa
login/server, tanpa analytics) → penutup "Gratis di Chrome Web Store" + URL landing + "Tidak berafiliasi dengan TikTok".
Footage = screenshot Chrome asli (`store/video/footage/`), hanya diberi sorotan/riak klik. Versi EN menyebut
"Interface in Indonesian". Spesifikasi: H.264 High yuv420p BT.709, 30fps; audio = efek UI sintetis saja (AAC 48 kHz
stereo, puncak -6 dBFS, ±-25,6 LUFS) — **tanpa musik**, musik latar ditambah di YouTube Studio (Audio Library).

Render ulang (dari akar repo; butuh `google-chrome` + `ffmpeg` dengan libx264; tanpa dependensi npm, bukan Remotion):

```
node store/video/render.mjs id en   # frame per frame via Chrome headless → release/video/*.mp4 (tanpa audio) + thumbnail
node store/video/sfx.mjs            # sintesis efek suara → release/video/sfx.wav, mux ke kedua mp4 (-c:v copy)
```

`node store/video/render.mjs id --preview` hanya membuat beberapa frame PNG di `release/video/preview/`. Teks overlay
ada di objek `T` di `store/video/promo.html`; waktu cue suara di `cues` pada `store/video/sfx.mjs` (ikuti timeline
`seek()` di `promo.html` bila timing diubah). Setelah render ulang, video YouTube harus diupload ulang (URL berubah).

### Isi tiap screenshot

Semua: kanvas 1280×800 latar hitam dengan cahaya merah `#FE2C55` di kanan atas, garis aksen cyan `#25F4EE` + judul putih + subjudul abu di kiri, **screenshot asli** dari `docs/img/`
di kanan (hanya diperkecil/diperbesar, isi UI tidak diubah). Profil contoh = akun publik resmi `@tiktok`.

1. **"Cek ER kreator di halaman profil"** — *Buka profil TikTok mana saja, kartu Pantaw muncul di pojok kanan bawah.*
   Gambar: `docs/img/card.jpg` (halaman profil penuh + kartu), diperkecil ke 760×571.
2. **"Rata-rata & ER dari 12 video terbaru"** — *Followers, views, likes, komentar, share, plus ER followers dan ER
   views. Video pinned dikecualikan.* Gambar: `docs/img/card-zoom.png` diperbesar 1,5× (507×620) — sedikit lembut;
   ganti dengan tangkapan ulang resolusi tinggi bila ada.
3. **"Atur kolom sesuai template Anda"** — *Pilih kolom yang tampil dan urutannya. Dipakai juga untuk Salin data ke
   spreadsheet.* Gambar: `docs/img/settings.png` diperbesar 1,2× (366×706).
Screenshot hasil tempel di spreadsheet **tidak dipakai** (keputusan user 2026-10-16) — rilis pertama jalan dengan 3
screenshot di atas.

Screenshot 1 memperlihatkan halaman TikTok apa adanya, termasuk logo TikTok di avatar akun `@tiktok` — **dibiarkan**
(keputusan user 2026-10-16): itu konteks pemakaian, bukan klaim afiliasi. Promo tile tetap tanpa logo/merek TikTok.

### Small promo tile

`store/promo-small.svg` → `store/promo-small.png` (440×280): latar hitam + cahaya merah, ikon Pantaw
(lup merah + aksen cyan di kotak `#121212`), teks **Pantaw** (kata "engagement rate" merah), tagline "Cek engagement rate KOL / langsung di halaman profil kreator".
Kata "TikTok" sengaja tidak dipakai di tile.

---

## 4. Catatan untuk reviewer (Test instructions) — 702 karakter

Isi di tab **Test instructions** (tidak perlu akun uji):

```
No login or test account is needed.

1. Install the extension.
2. Open any public TikTok profile in a normal tab, e.g. https://www.tiktok.com/@tiktok (logging in to TikTok is not required).
3. Wait for the profile and its video grid to load. A small "Pantaw · @username" card appears in the bottom-right corner with followers, average views/likes/comments/shares and three engagement-rate values from the 12 most recent non-pinned videos.
4. Click "Salin data" (Copy data) and paste into a spreadsheet: one tab-separated row. Click ⚙ to reorder/hide columns.

If the card shows "Menunggu data video…" (waiting for video data), scroll the video grid slightly or reload the page. The UI is in Indonesian.
```

---

## 5. Checklist submit

- [ ] GitHub Pages aktif; `https://anditriana.github.io/pantaw/` dan `.../privacy.html` bisa dibuka (bukan 404).
- [ ] Daftar Developer Dashboard (biaya sekali ±USD 5), verifikasi email kontak developer.
- [ ] `npm test && npm run typecheck`, lalu pastikan `release/pantaw-0.1.0.zip` dibuat dari `main` terbaru
      (`npm run zip`; bila zip lama sudah ada dan kode berubah, hapus zip uji coba itu dulu — version belum pernah diupload).
- [ ] Load unpacked dari `dist/` sekali lagi, cek kartu muncul di profil publik.
- [ ] Dashboard → **Add new item** → upload `release/pantaw-0.1.0.zip`.
- [ ] Store listing (bahasa utama **Indonesian**): deskripsi Indonesia (bagian 1), kategori, bahasa, ikon 128,
      `store/screenshot-1..3.png`, `store/promo-small.png`, URL, promo video https://youtu.be/OPiShxayCyk. **Save draft.**
- [ ] Bahasa kedua — English (localized listing; muncul karena paket punya `_locales/en/`):
    1. Di atas form Store listing, buka dropdown bahasa → pilih **English**. Pilihannya hanya `id` dan `en`, sesuai
       folder `_locales/` di zip; nama & summary otomatis dari `_locales/en/messages.json` (tidak bisa diketik).
    2. Tempel **Detailed description — English** (bagian 1) — terpisah dari deskripsi Indonesia, jangan digabung.
    3. Screenshot: pakai 3 file yang sama (`store/screenshot-1..3.png`) — teks judulnya berbahasa Indonesia, sesuai UI
       extension. Promo tile tidak dilokalkan (satu untuk semua bahasa).
       Promo video English: https://youtu.be/EWtBLgPVNeE.
    4. **Save draft**, kembali ke dropdown → Indonesian, pastikan isian bahasa utama tidak berubah.
- [ ] Privacy practices: single purpose, justifikasi `storage` + host, remote code = No, data usage (bagian 2), tiga sertifikasi, privacy policy URL.
- [ ] Test instructions (bagian 4).
- [ ] Distribution: **Visibility = Unlisted** dulu; region = semua (atau minimal Indonesia); gratis.
- [ ] Submit for review; tunggu email (biasanya beberapa hari).
- [ ] Setelah tayang: pasang dari link listing di Chrome biasa, uji di beberapa profil.
- [ ] Bila sudah yakin: ubah ke **Public**; isi `href` tombol **Pasang di Chrome** di `docs/index.html` dengan URL listing.
- [ ] Simpan `release/pantaw-0.1.0.zip` (jangan dihapus) — `npm run zip` berikutnya membandingkan version dengannya.
