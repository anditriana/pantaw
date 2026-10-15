# kol-ext

Chrome extension (Manifest V3) analitik KOL: cek engagement rate kreator langsung di halaman profil.
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
```

### Load unpacked di Chrome

1. `npm run build`
2. Buka `chrome://extensions`, nyalakan **Developer mode** (kanan atas).
3. Klik **Load unpacked**, pilih folder `dist/`.
4. Buka profil TikTok, mis. `https://www.tiktok.com/@tiktok` → kartu ER muncul di kanan bawah.
5. Setelah `npm run build` ulang, klik ikon reload pada kartu extension lalu muat ulang tab TikTok.

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
- [x] Pengaturan kolom (urutan + tampil/sembunyi) untuk kartu dan hasil salin — tombol ⚙ di kartu, ↑ ↓ + centang per kolom, "Kembalikan default"; satu `ColumnConfig` dipakai kartu, **Salin data**, dan **Salin judul kolom** (registri di `src/lib/columns.ts`, tes `tests/columns.test.ts`); disimpan di `chrome.storage.local` key `columns`, sinkron antar tab via `onChanged`; permission `storage` ditambahkan (satu-satunya, disetujui user 2026-10-15). Username/Nama/Jumlah video/Tanggal/Link hanya di hasil salin
- [ ] Privacy policy + aset & listing Chrome Web Store
