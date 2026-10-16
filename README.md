# Pantaw (kol-ext)

**Pantaw – KOL ER Checker for TikTok** (merek dipilih user 2026-10-16). Chrome extension (Manifest V3) analitik KOL: cek engagement rate kreator langsung di halaman profil.
Referensi produk: justkol.id. MVP: **TikTok saja** (tanpa login). Instagram menyusul.

Prinsip (lihat ide lengkap: `~/work/hub/catatan/kol-extension.md`):
- Jalan hanya saat user membuka profil; semua hitungan lokal di browser; tanpa server/database terpusat.
- Panggilan jaringan minimal; host permission hanya `*.tiktok.com`; satu-satunya permission tambahan `storage` (disetujui user 2026-10-15, untuk pengaturan kolom).
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
4. Buka profil TikTok, mis. `https://www.tiktok.com/@tiktok` → kartu ER muncul di kanan bawah.
5. Setelah `npm run build` ulang, klik ikon reload pada kartu extension lalu muat ulang tab TikTok.

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
- `src/lib/` modul murni: `parse.ts` (bentuk data TikTok), `metrics.ts` (rumus), `route.ts`, `format.ts`.

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
    - [x] Ikon PNG 16/32/48/128 + `icons` di `manifest.json` (SVG tidak boleh) — lup + pupil putih di kotak indigo `#4F46E5`; sumber `assets/icon.svg`, PNG digenerate ke `dist/icons/` tiap build oleh `scripts/icons.mjs` (rasterizer mini Node tanpa dependensi, PNG tidak di-commit); manifest tanpa `action`, jadi tidak ada `default_icon`
    - [x] `npm run zip`: build lalu zip **isi** `dist/` (manifest di akar zip), tolak kalau `version` tidak naik dari rilis terakhir — `scripts/zip.mjs` → `release/pantaw-<version>.zip` (`release/` di-.gitignore, pakai program `zip`); "rilis terakhir" = `pantaw-*.zip` dengan version tertinggi di `release/`
    - [ ] Teks privacy policy (semua hitungan lokal, tanpa server, tidak mengumpulkan data) + URL publik untuk menampungnya
    - [ ] Draft listing: deskripsi, kategori, screenshot 1280×800, promo tile kecil 440×280
    - [ ] Isian tab Privacy: single purpose, justifikasi `storage` (pengaturan kolom) dan host `tiktok.com` (baca data yang sudah dimuat halaman), remote code = tidak ada, data usage = tidak dikumpulkan; sebutkan link **Request fitur** hanya membuka form Google di tab baru atas klik user, tanpa data terkirim otomatis (isian form diproses Google, bukan extension) — cantumkan juga di privacy policy
    - [x] Nama: pertimbangkan "KOL ER Checker for TikTok" (merek di judul rawan ditolak review) — merek **Pantaw** (keputusan user 2026-10-16): `name` "Pantaw – KOL ER Checker for TikTok", `short_name` "Pantaw", `description` bahasa Indonesia (131 karakter, sama dengan bahasa UI & target pengguna); `version` 0.1.0; judul kartu "Pantaw · @user" (format TSV tidak berubah)
    - [ ] (user) Daftar Developer Dashboard (sekali bayar ±USD 5), upload, submit — mulai **Unlisted** untuk tes
    - Alur update: naikkan `version` → build → zip → Package → Upload new package → submit review; Chrome pemakai update otomatis. Permission baru yang memunculkan peringatan menonaktifkan extension sampai pemakai menyetujui (`storage` tidak). Tidak ada rollback: rilis ulang versi lama dengan nomor lebih tinggi.
- [ ] Remote git: repo belum punya `origin`; buat repo GitHub (private) lalu push `main`
