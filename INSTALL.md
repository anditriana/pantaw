# Cara pasang Pantaw (versi beta) di Chrome

Panduan untuk memasang **Pantaw – KOL ER Checker** dari file zip, sebelum listing Chrome Web Store tayang.

Bisa dipakai di Chrome, Edge, atau Brave di laptop/PC. Tidak bisa di HP.

1. **Download** file `pantaw-x.x.x.zip` (misalnya `pantaw-0.2.0.zip`).
2. **Buat folder dulu** di tempat tetap, misalnya `Documents/pantaw`, lalu **ekstrak isi zip ke dalam folder itu**
   (klik kanan zip → *Extract All* / *Ekstrak ke…* → pilih folder tadi).
   Isi zip langsung berupa file-file extension tanpa folder pembungkus, jadi sebagian aplikasi ekstrak bisa
   menumpahkannya ke folder tempat zip berada; dengan membuat folder dulu, semua file pasti terkumpul di satu tempat.
   Setelah diekstrak, di dalam folder itu harus langsung terlihat file `manifest.json`.
   **Jangan hapus atau pindahkan folder ini** setelah dipasang, karena Chrome membaca extension langsung dari folder itu.
3. Buka Chrome, ketik di address bar: `chrome://extensions` lalu Enter.
   (Edge: `edge://extensions` · Brave: `brave://extensions`)
4. Nyalakan **Developer mode** (tombol di kanan atas; di Edge ada di menu kiri).
5. Klik **Load unpacked** (*Muat yang belum dibuka*).
6. Pilih **folder hasil ekstrak**, yaitu folder yang langsung berisi file `manifest.json`, bukan file zip-nya.
7. Pantaw muncul di daftar extension. Selesai.

## Cara pakai

- Buka profil TikTok, misalnya `tiktok.com/@namakreator`. Kartu Pantaw muncul di kanan bawah.
- Instagram (mulai versi 0.2.0): buka profil `instagram.com/namakreator` dalam keadaan login. Untuk melihat views,
  buka tab **Reels** di profil itu.
- Klik **Salin data** lalu tempel di Google Sheet/Excel. Klik **Salin judul kolom** sekali untuk baris judul.
- Tombol ⚙ di kartu untuk mengatur urutan dan kolom yang tampil.

## Kalau kartu tidak muncul

- Muat ulang halaman TikTok/IG (F5).
- Pastikan Pantaw dalam keadaan aktif (toggle biru) di `chrome://extensions`.
- Pastikan yang dibuka halaman profil, bukan halaman video atau beranda.
- Kalau kartu muncul tapi masih "Menunggu data…", scroll daftar video/post sedikit atau muat ulang halaman.

## Catatan

- Chrome kadang menampilkan peringatan "Disable developer mode extensions". Klik silang/abaikan saja; itu muncul untuk
  semua extension yang dipasang di luar Chrome Web Store.
- **Update tidak otomatis.** Kalau ada versi baru, hapus Pantaw lama di `chrome://extensions`, lalu ulangi langkah 1–6
  dengan zip baru. Pengaturan kolom akan kembali ke default.
- Semua hitungan dilakukan di browser kamu. Tidak ada data yang dikirim ke server.
- Pantaw tidak berafiliasi dengan TikTok atau Instagram.
