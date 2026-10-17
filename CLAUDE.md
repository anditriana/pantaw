# pantaw

Chrome extension MV3 (TypeScript, esbuild, vitest, tanpa framework UI). Detail produk & backlog: README.md.

## Perintah
- `npm run build` → `dist/` (load unpacked folder ini)
- `npm test` · `npm run typecheck`

## Prinsip (wajib)
- Host permission hanya `https://www.tiktok.com/*` dan `https://www.instagram.com/*` (IG wajib, disetujui user 2026-10-17, versi 0.2.0). Satu-satunya permission tambahan yang boleh: `storage` (disetujui user 2026-10-15, untuk pengaturan kolom, `chrome.storage.local`); tidak ada yang lain. Jangan tambah `<all_urls>`, permission lain, atau remote code.
- Tanpa server, analytics, telemetri. Semua hitungan lokal.
- Jangan membuat request jaringan sendiri; pakai data yang sudah dimuat halaman (JSON hidrasi + respons yang
  disadap `src/main-world.ts`).
- Rumus & parsing di `src/lib/` sebagai fungsi murni, wajib tes unit dengan fixture di `tests/fixtures/`.
- Nama field TikTok/IG: verifikasi pada respons asli sebelum dipakai; `statsV2` (string presisi) diutamakan atas `stats` (dibulatkan).
- UI kartu di shadow DOM, posisi fixed; jangan sisipkan elemen ke layout TikTok.
