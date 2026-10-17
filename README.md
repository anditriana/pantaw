# Pantaw

**Pantaw – KOL ER Checker** (merek dipilih user 2026-10-16; "for TikTok" dibuang di 0.2.0, 2026-10-17). Chrome extension (Manifest V3) analitik KOL: cek engagement rate kreator langsung di halaman profil.
Referensi produk: justkol.id. 0.1.0: **TikTok** (tanpa login). 0.2.0: + **Instagram** (memakai sesi login IG user sendiri).

Prinsip:
- Jalan hanya saat user membuka profil; semua hitungan lokal di browser; tanpa server/database terpusat.
- Tanpa request jaringan sendiri; host permission hanya `https://www.tiktok.com/*` + `https://www.instagram.com/*` (wajib, keputusan user 2026-10-17); satu-satunya permission tambahan `storage` (disetujui user 2026-10-15, untuk pengaturan kolom).
- Tanpa remote code (aturan MV3 / Chrome Web Store).
- Gratis penuh; versi berbayar (KOL Manager / spreadsheet) belakangan.

## Pengembangan

```bash
npm install
npm run build      # hasil di dist/
npm run watch      # build ulang otomatis saat file berubah
npm test           # vitest (rumus + parser, fixture JSON asli di tests/fixtures/)
npm run typecheck
npm run zip        # build + zip isi dist/ → release/pantaw-<version>.zip (untuk Chrome Web Store)
```

### Load unpacked di Chrome

1. `npm run build`
2. Buka `chrome://extensions`, nyalakan **Developer mode** (kanan atas).
3. Klik **Load unpacked**, pilih folder `dist/`.
4. Buka profil TikTok, mis. `https://www.tiktok.com/@tiktok`, atau profil Instagram (login), mis.
   `https://www.instagram.com/natgeo/` → kartu ER muncul di kanan bawah. Views IG terisi setelah tab **Reels** profil dibuka.
5. Setelah `npm run build` ulang, klik ikon reload pada kartu extension lalu muat ulang tab TikTok/Instagram.

### Paket rilis (Chrome Web Store)

1. Naikkan `version` di `manifest.json` (rilis pertama: `0.1.0`).
2. `npm run zip` → build, lalu zip **isi** `dist/` (manifest di akar zip) ke `release/pantaw-<version>.zip`
   (`release/` di-.gitignore; butuh program `zip`). Ditolak kalau `version` tidak lebih tinggi dari zip
   `pantaw-*.zip` terakhir di `release/` — jadi simpan zip yang sudah diupload, hapus zip uji coba.
3. Upload zip itu di Developer Dashboard.

Ikon: sumber `assets/icon.svg`; PNG 16/32/48/128 dibuat ke `dist/icons/` saat build oleh `scripts/icons.mjs`
(rasterizer mini tanpa dependensi, hanya mengenal `<rect rx>`, `<circle>`, `<line>` bertutup bulat, warna `#RRGGBB`).

### Cara kerja singkat

- `src/main-world.ts` (world MAIN, `document_start`): membaca salinan respons `/api/post/item_list` dan
  `/api/user/detail` yang memang diminta halaman, diteruskan via `postMessage`. Tidak membuat request baru.
- `src/content.ts` (isolated world): baca JSON hidrasi `#__UNIVERSAL_DATA_FOR_REHYDRATION__`
  (`webapp.user-detail.userInfo.statsV2.followerCount`), gabungkan dengan video, render kartu (shadow DOM,
  posisi fixed — tidak mengubah layout TikTok). Pindah profil via SPA dideteksi dari perubahan `location.pathname`.
- Instagram: `main-world.ts` membaca teks respons `/api/graphql` & `/graphql/query` yang diminta halaman, menyaring dari
  **bentuk JSON** (doc_id berubah-ubah) dengan `parseInstagramBody`, dan hanya meneruskan angka hasil parse. Profil dari
  `data.user.follower_count` (cadangan `og:description`, dibulatkan); grid dari
  `data.xdt_api__v1__feed__user_timeline_graphql_connection` (likes/komentar, **tanpa views**); views reels (`play_count`)
  hanya dari `clips_connection` di tab `/<user>/reels/`. Pinned = id akun ada di `timeline_pinned_user_ids` /
  `clips_tab_pinned_user_ids` (kolaborator bisa mem-pin post yang sama di profilnya); post collab dihitung untuk pemilik
  dan kolaborator (tampil di grid keduanya).
- `src/lib/` modul murni: `parse.ts` (TikTok + model `Post`), `parse-instagram.ts`, `metrics.ts` (rumus, toleran nilai
  kosong), `route.ts` (path profil per platform), `format.ts`, `columns.ts`, `sheet.ts`.

## TO DO

- [x] Kerangka extension MV3 + build + tes unit (rumus ER/CPM) + cara load unpacked — esbuild (`scripts/build.mjs`) → `dist/`, TypeScript + vitest, host permission hanya `https://www.tiktok.com/*`; rumus CPM belum (ikut item Budget → CPM)
- [x] TikTok: ambil data profil & 12 video terakhir (pinned dikecualikan) dari halaman `tiktok.com/@<user>` — followers dari JSON hidrasi (`statsV2`), video dari respons `/api/post/item_list` yang disadap script world MAIN + `postMessage`; field diverifikasi pada respons asli (fixture di `tests/fixtures/`). **Belum diverifikasi di Chrome biasa:** penanda pinned `isPinnedItem` (baru diuji fixture sisipan) dan data terisi setelah navigasi SPA antar profil (headless kena captcha TikTok)
- [x] Kartu ER: followers, rata-rata views/likes/komentar/share, ER = (likes+komentar)/followers×100% (tampilkan juga ER per views) — kartu shadow DOM posisi fixed kanan bawah (`src/content.ts`), rumus di `src/lib/metrics.ts`; ER per views ditampilkan dua-duanya (rumus dikonfirmasi user 2026-10-13): `ER views (total)` = Σ(likes+komentar+share)/Σviews dan `ER views (rata-rata/video)` = rata-rata ER views tiap video, video dengan views 0 dilewati; dicoba di profil asli @tiktok
- [ ] Grafik tren 12 video + pratinjau per video (views, likes, komentar, ER)
- [ ] Budget → CPM: input harga per post → CPM per 1.000 views & per 1.000 engagement; nilai diingat antar profil
- [x] Salin baris metrik (profil & per video) ke clipboard, format siap tempel ke spreadsheet — profil saja (keputusan user 2026-10-15): tombol **Salin data** = 1 baris TSV tanpa header (supaya banyak KOL bisa ditempel berurutan) + tombol **Salin judul kolom** untuk baris 1; 13 kolom, angka bulat tanpa pemisah ribuan, ER desimal koma (4,21) tanpa `%`, ER null = sel kosong; format di `src/lib/sheet.ts` (tes `tests/sheet.test.ts`), tombol di `src/content.ts` via `navigator.clipboard` (tanpa permission baru). Per video belum. Dicek user di Chrome 2026-10-15.
- [x] Pengaturan kolom (urutan + tampil/sembunyi) untuk kartu dan hasil salin — tombol ⚙ di kartu, ↑ ↓ + centang per kolom, "Kembalikan default"; satu `ColumnConfig` dipakai kartu, **Salin data**, dan **Salin judul kolom** (registri di `src/lib/columns.ts`, tes `tests/columns.test.ts`); disimpan di `chrome.storage.local` key `columns`, sinkron antar tab via `onChanged`; permission `storage` ditambahkan (satu-satunya, disetujui user 2026-10-15). Username/Nama/Jumlah video/Tanggal/Link hanya di hasil salin. Panel ⚙ diberi satu paragraf keterangan di atas daftar (fungsi centang, ↑ ↓, Kembalikan default, tersimpan di browser ini); tanpa keterangan per kolom (keputusan user 2026-10-16)
- [x] Link **Request fitur** di kartu — `<a target="_blank" rel="noopener noreferrer">` kecil abu-abu rata kanan di bawah tombol salin, hanya saat metrik sudah ada — tidak saat "Menunggu data video…" (keputusan user 2026-10-16), membuka form Google (konstanta `FEATURE_REQUEST_URL` di `src/content.ts`) di tab baru; tanpa prefill — tidak ada username/data profil yang dikirim, tanpa permission baru. Belum dicek user di Chrome
- [ ] Privacy policy + aset & listing Chrome Web Store — rincian (dicatat 2026-10-15):
    - [x] Ikon PNG 16/32/48/128 + `icons` di `manifest.json` (SVG tidak boleh) — lup merah `#FE2C55` + aksen glitch cyan `#25F4EE` + pupil putih di kotak hitam (palet TikTok 2026-10-16, sebelumnya indigo; 16px tetap terbaca); sumber `assets/icon.svg`, PNG digenerate ke `dist/icons/` tiap build oleh `scripts/icons.mjs` (rasterizer mini Node tanpa dependensi, PNG tidak di-commit); manifest tanpa `action`, jadi tidak ada `default_icon`
    - [x] `npm run zip`: build lalu zip **isi** `dist/` (manifest di akar zip), tolak kalau `version` tidak naik dari rilis terakhir — `scripts/zip.mjs` → `release/pantaw-<version>.zip` (`release/` di-.gitignore, pakai program `zip`); "rilis terakhir" = `pantaw-*.zip` dengan version tertinggi di `release/`
    - [x] Teks privacy policy (semua hitungan lokal, tanpa server, tidak mengumpulkan data) + URL publik untuk menampungnya
      - `docs/privacy.html` (ID + ringkasan EN) dan `docs/index.html`, di-host GitHub Pages dari folder `docs/` di `main`. URL yang diharapkan untuk listing: **https://anditriana.github.io/pantaw/privacy.html** (Pages belum diaktifkan — butuh merge + push dulu, lalu Settings → Pages → `main` / `/docs`)
      - Landing `docs/index.html` didesain ulang 2026-10-16 untuk calon pemakai (marketer/brand/agensi): statis, CSS inline, mobile-first, dark mode ikut sistem; palet hitam/merah `#FE2C55`/cyan `#25F4EE` (2026-10-16, ganti dari indigo): header + hero selalu gelap, tombol utama `#E3173F` supaya teks putih lolos AA (4,7:1), cyan hanya detail kecil, `privacy.html` ikut header gelap yang sama; hero + fitur + cara pakai + privasi + FAQ + footer (Request fitur, GitHub, privasi, tidak berafiliasi TikTok). Screenshot asli dari Chrome user di `docs/img/` (`card.jpg` = hero + `og:image`, `card-zoom.png`, `settings.png`); hasil salin ditampilkan sebagai tabel CSS berlabel "contoh format · angka ilustrasi" (belum ada screenshot asli). Logo/favicon `docs/icon.svg` (salinan `assets/icon.svg`, karena Pages hanya menyajikan `docs/`). Tombol **Pasang di Chrome** masih `href="#"` + TODO sampai listing Chrome Web Store tayang
    - [x] Draft listing: deskripsi, kategori, screenshot 1280×800, promo tile kecil 440×280 — `store/listing.md` (di luar `docs/`, tidak tayang di Pages): listing dua bahasa sungguhan (keputusan user 2026-10-16) — Indonesian default + English localized; nama/summary dari `_locales/{id,en}/messages.json` (manifest `__MSG_…__`, `default_locale` id, batas karakter dijaga `tests/locales.test.ts`, build menyalin `_locales/` ke `dist/`), deskripsi lengkap terpisah per bahasa, kategori Productivity, URL website/support/privacy, test instructions, checklist submit (Unlisted dulu). Aset: `store/promo-small.png` 440×280 dari `store/promo-small.svg` (tanpa logo TikTok) + 3 screenshot 1280×800 = bingkai hitam/merah/cyan + screenshot asli `docs/img/`, dibuat `node store/render.mjs` (Chrome headless, karena `scripts/icons.mjs` tak bisa teks/raster); screenshot spreadsheet tidak dipakai, profil @tiktok dibiarkan (keputusan user). Kartu tampil normal setelah reload di Chrome biasa (dicek 2026-10-16)
    - [x] Isian tab Privacy: single purpose, justifikasi `storage` (pengaturan kolom) dan host `tiktok.com` (baca data yang sudah dimuat halaman), remote code = tidak ada, data usage = tidak dikumpulkan; sebutkan link **Request fitur** hanya membuka form Google di tab baru atas klik user, tanpa data terkirim otomatis (isian form diproses Google, bukan extension) — cantumkan juga di privacy policy — draft di `store/listing.md` bagian 2: single purpose, justifikasi `storage` + host, remote code = No, data usage tidak ada kategori dicentang (keputusan user 2026-10-16; cadangan "Website content" bila reviewer keberatan), tiga sertifikasi; Request fitur sudah tercantum di `docs/privacy.html`
    - [x] Nama: pertimbangkan "KOL ER Checker for TikTok" (merek di judul rawan ditolak review) — merek **Pantaw** (keputusan user 2026-10-16): `name` "Pantaw – KOL ER Checker for TikTok", `short_name` "Pantaw", `description` bahasa Indonesia (131 karakter, sama dengan bahasa UI & target pengguna); `version` 0.1.0; judul kartu "Pantaw · @user" (format TSV tidak berubah)
    - [x] Video promo YouTube untuk listing (ID + EN, visual sama) — `store/video/`: komposisi `promo.html` (1920×1080, 42 dtk, footage = screenshot Chrome asli di `footage/`, tabel tempel berlabel contoh) dirender per frame lewat Chrome headless/CDP + ffmpeg oleh `render.mjs` (tanpa Remotion/dependensi npm), efek suara UI sintetis tanpa musik oleh `sfx.mjs` (puncak -6 dBFS, musik ditambah user di YouTube Studio); output `release/video/` (tidak di-commit). Diupload Unlisted: ID https://youtu.be/OPiShxayCyk, EN https://youtu.be/EWtBLgPVNeE — detail & cara render ulang di `store/listing.md` bagian 3
    - [x] Gambar promo Instagram/WhatsApp (bahasa Indonesia, 3 slide: hook masalah → kartu Pantaw di profil → CTA) — Story 1080×1920 (safe zone 250 px atas / 340 px bawah kosong) + carousel feed IG 1080×1350 (4:5, margin 80 px, layout ditata ulang) dari satu sumber `store/story/story.html` (`?s=1|2|3`, `?format=feed`, `?guide=1` = overlay zona aman), dirender Chrome headless oleh `node store/story/render.mjs [--feed] [--guide]` → `release/story/pantaw-story-{1,2,3}.png` + `release/story/feed/pantaw-feed-{1,2,3}.png` (tidak di-commit). Screenshot Chrome asli `docs/img/` (crop `card.jpg` tanpa avatar/logo TikTok + `card-zoom.png`, badge "Contoh · @tiktok", dibiarkan — keputusan user 2026-10-17). CTA tanpa URL (keputusan user 2026-10-17): badge "Segera di Chrome Web Store" (ikon jam generik, bukan logo Chrome/Google) + tombol "DM untuk file mentahnya" + "Versi beta, sebelum listing tayang"; "Tidak berafiliasi dengan TikTok."
    - [x] Video Reels Instagram dari 3 slide yang sama — 1080×1920, 30 fps, H.264 + AAC, 23 dtk: komposisi `store/story/story.html?format=reels` (timeline `seek(t)` deterministik: langkah 1–4 bergantian, kartu zoom dari pojok + baris metrik terbuka + ER disorot, tombol DM berdenyut; area aman Reels 250 px atas / 400 px bawah / 140 px kanan kosong) dirender `node store/story/reels.mjs [--preview]` → `release/story/reels/pantaw-reels.mp4` + `pantaw-reels-cover.png` (tidak di-commit); efek suara UI sintetis tanpa musik (puncak -6 dBFS, musik ditambah di aplikasi IG). Inti render Chrome/CDP + ffmpeg dan efek suara dipisah ke `store/video/frames.mjs` + `store/video/sfx-lib.mjs`, dipakai bersama video YouTube (output YouTube & story/feed diverifikasi identik byte-per-byte setelah refactor)
    - [ ] (user) Daftar Developer Dashboard (sekali bayar ±USD 5), upload, submit — mulai **Unlisted** untuk tes
    - Alur update: naikkan `version` → build → zip → Package → Upload new package → submit review; Chrome pemakai update otomatis. Permission baru yang memunculkan peringatan menonaktifkan extension sampai pemakai menyetujui (`storage` tidak). Tidak ada rollback: rilis ulang versi lama dengan nomor lebih tinggi.
- [x] (0.2.0) Instagram — kode: deteksi platform + path profil IG (`/<user>/`, `/<user>/reels/`, `/<user>/tagged/`; tolak `/p/` `/reel/` `/explore/` `/stories/` `/accounts/` `/direct/` dll.), `src/lib/parse-instagram.ts`, model `Post` (views/likes/share boleh kosong), rumus toleran kosong, kartu per platform, label netral ("Jumlah post", "ER views (rata-rata/post)" — juga untuk TikTok, keputusan user 2026-10-17), link profil per platform, manifest host + content_scripts IG, `version` 0.2.0, nama "Pantaw – KOL ER Checker" (keputusan user 2026-10-17). Rumus IG: ER followers dari 12 post grid terbaru (semua tipe, pinned dikecualikan); views & ER views hanya reels dari tab Reels (tanpa share); foto/carousel views kosong; share kosong; likes disembunyikan dikeluarkan dari rata-rata/ER + keterangan "x post likes disembunyikan" (semua → ER kosong). Fixture bersih dari respons asli 2026-10-17 (`tests/fixtures/*.instagram.json`, hanya field yang dipakai parser). Dicek di Chrome (profil terpisah, akun IG cadangan, 2026-10-17): raditya_dika, natgeo, tasyafarasya + tab Reels, navigasi SPA grid→Reels, `/p/` & `/explore/` tanpa kartu, TikTok @tiktok tetap normal. **Belum diverifikasi data asli:** likes disembunyikan (`like_and_view_counts_disabled`, baru kasus sisipan di tes — belum ada profil contoh, keputusan user 2026-10-17 dibiarkan), profil privat, followers cadangan `og:description` (hanya format bahasa Inggris), body multi-baris / `for (;;);` (tidak muncul di rekaman). Catatan: di muatan pertama grid hanya 12 item termasuk pinned → kartu bisa "11/9 post (kurang dari 12)" sampai grid digulir
- [x] (0.2.0) Privacy policy + listing untuk Instagram — `docs/privacy.html` (host IG, sesi login tidak dibaca, tidak berafiliasi Meta) dan `store/listing.md` (nama/summary baru, deskripsi ID+EN, single purpose, justifikasi host `instagram.com`, test instructions IG, alur submit 0.2.0) sudah ditulis; belum dicek user
- [ ] (0.2.0) Buat ulang aset untuk Instagram: screenshot store (kartu di profil IG + tab Reels), promo tile (cek teks), video promo ID + EN, landing `docs/index.html` (hero/fitur/FAQ masih TikTok saja) — butuh screenshot dari Chrome user; lalu upload 0.2.0 (`npm run zip`) dan ubah listing ke Public
- [ ] (0.1.x) Terjemahkan teks UI kartu & panel ⚙ ke English via `chrome.i18n` + `_locales/en/messages.json` — `_locales/` (id default + en) sudah ada sejak 0.1.0 tetapi hanya untuk `name`/`short_name`/`description` manifest (listing Chrome Web Store dua bahasa, keputusan user 2026-10-16); UI kartu masih bahasa Indonesia di semua locale. Label kolom TSV (`src/lib/columns.ts`) ikut diputuskan: diterjemahkan atau tetap
- [x] Remote git — repo publik https://github.com/anditriana/pantaw (`origin`), `main` ter-push 2026-10-16; riwayat dibersihkan (email author = noreply GitHub)
