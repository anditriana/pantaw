# kol-ext

Chrome extension (Manifest V3) analitik KOL: cek engagement rate kreator langsung di halaman profil.
Referensi produk: justkol.id. MVP: **TikTok saja** (tanpa login). Instagram menyusul.

Prinsip (lihat ide lengkap: `~/work/hub/catatan/kol-extension.md`):
- Jalan hanya saat user membuka profil; semua hitungan lokal di browser; tanpa server/database terpusat.
- Panggilan jaringan minimal; host permission hanya `*.tiktok.com`.
- Tanpa remote code (aturan MV3 / Chrome Web Store).
- Gratis penuh; versi berbayar (KOL Manager / spreadsheet) belakangan.

## TO DO

- [ ] Kerangka extension MV3 + build + tes unit (rumus ER/CPM) + cara load unpacked
- [ ] TikTok: ambil data profil & 12 video terakhir (pinned dikecualikan) dari halaman `tiktok.com/@<user>`
- [ ] Kartu ER: followers, rata-rata views/likes/komentar/share, ER = (likes+komentar)/followers×100% (tampilkan juga ER per views)
- [ ] Grafik tren 12 video + pratinjau per video (views, likes, komentar, ER)
- [ ] Budget → CPM: input harga per post → CPM per 1.000 views & per 1.000 engagement; nilai diingat antar profil
- [ ] Salin baris metrik (profil & per video) ke clipboard, format siap tempel ke spreadsheet
- [ ] Privacy policy + aset & listing Chrome Web Store
