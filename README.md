# DriveEase – Prototype IMK

Prototype akademik (bukan aplikasi resmi Google Drive) untuk tugas Interaksi Manusia dan Komputer. Semua data fiktif; **tidak ada file yang dikirim ke server** – upload hanya simulasi.

## Struktur file
```
driveease/
├─ package.json
├─ vite.config.js
├─ index.html
├─ README.md
└─ src/
   ├─ main.jsx      (titik masuk React)
   ├─ index.css     (Tailwind + indikator fokus)
   └─ App.jsx       (seluruh antarmuka & logika)
```

## Menjalankan
Butuh Node.js 18+.
```
cd driveease
npm install
npm run dev
```
Buka alamat yang tampil (biasanya http://localhost:5173).

## Alur upload
File Saya → **+ Baru** → **Upload file** → pilih file / seret → status *Siap diunggah* → **Mulai upload** → *Sedang mengunggah* (bar + persen; bisa **Batalkan upload**) → *Upload berhasil* + **Lihat file**, atau *Upload gagal* + penyebab + **Coba lagi**.
Untuk screenshot audit: pilih "Simulasi kondisi jaringan" (Normal / Koneksi lambat / Koneksi terputus) sebelum **Mulai upload**. File > 50 MB langsung gagal dengan penjelasan. Setelah "Coba lagi", koneksi dianggap pulih (berhasil).

## Fitur
**Berfungsi:** navigasi sidebar, buat folder (dengan validasi), file picker, drag-and-drop, pencarian nama, detail file, bintang, pindah ke/kembalikan dari Sampah, ganti tampilan daftar/kotak, status & progres upload, batal, coba lagi, notifikasi yang bisa ditutup, teks besar, indikator penyimpanan (dihitung dari file contoh + upload simulasi).
**Simulasi:** progres upload dan kegagalan jaringan, file "terunggah" (hanya nama & ukuran di memori, hilang saat halaman dimuat ulang), tautan berbagi (tidak ada tautan nyata), akun/profil, kapasitas 1 GB (simulasi). Folder belum bisa dibuka (datar).

## Keputusan desain
**Accessibility:** semua tombol berlabel teks (aria-label untuk bintang/detail); status selalu berupa teks + ikon, tidak hanya warna; kontras tinggi (teks gelap, teal tua); fokus keyboard tebal & selalu terlihat; semua dapat dioperasikan keyboard, Esc menutup dialog; label `<label>` pada input; error menjelaskan masalah + solusi (`role="alert"`); `aria-live` untuk notifikasi; progressbar ber-ARIA; tautan "Lewati ke konten utama"; menghormati `prefers-reduced-motion`.
**Inclusive:** bahasa Indonesia sederhana; petunjuk langkah di dialog; target sentuh min. 44 px; responsif (sidebar jadi menu geser di ponsel); opsi teks besar; simulasi jaringan lambat/gagal dengan umpan balik jelas; tidak perlu mouse.
**Responsible:** tidak meminta data pribadi (profil fiktif); tidak ada password; upload dapat dibatalkan; transparan bahwa upload hanya simulasi; berbagi default "Hanya saya", akses publik wajib konfirmasi dengan penjelasan risiko.

## Redesign Baby Pink
Hanya `src/index.css` (token warna lewat `@theme`) dan `src/App.jsx` (kelas gaya + komponen `Icon` SVG outline) yang diubah. Logika, state, dan nama fungsi tidak diubah; tidak ada dependensi baru. Tombol utama memakai teks gelap (`#49313D`) di atas `#E8A0BF` agar kontras tetap memadai.

## Tema & Responsif
- **Tema:** Mode Terang (default) dan Mode Gelap, dipilih di menu **Profil → Tema tampilan**. Berganti langsung, tersimpan di `localStorage` (`driveease-theme`). Warna memakai CSS variables di `src/index.css` (`:root` dan `[data-theme="dark"]`), jadi semua komponen ikut berubah.
- **Responsif:** laptop (sidebar penuh), tablet (sidebar lebih sempit, `md`), HP (tombol menu membuka drawer navigasi; Esc, tombol Tutup, atau klik latar menutupnya).

## Pull-to-refresh & tampilan Daftar/Kotak (mobile)
- **Pull-to-refresh:** hanya di layar < 768 px, hanya saat halaman di paling atas, dan nonaktif saat ada dialog, drawer, menu terbuka, drag-and-drop, atau upload berjalan. Tarik ≥ ±128 px lalu lepas untuk refresh (simulasi lokal 1 detik, tanpa reload halaman; tema dan data tetap). Tarikan pendek atau dikembalikan ke atas akan dibatalkan.
- **Daftar:** baris ringkas (ikon, nama terpotong rapi, info tipe · ukuran · tanggal, tombol bintang). **Kotak:** kartu dengan ikon besar, nama maksimal 2 baris, 1 kolom di bawah 360 px, 2 kolom di HP, 3–4 kolom di tablet/desktop. Pilihan tersimpan di `localStorage` (`driveease-view`).

## Redesain formal (biru) & perbaikan temuan audit
- Palet Baby Pink diganti Mode Terang/Gelap formal (aksen biru) lewat CSS variables di `src/index.css`. Fokus keyboard: outline biru 3 px + jarak.
- Penyimpanan **simulasi** 1 GB (700 MB fiktif terpakai; file di Sampah tidak dihitung). Peringatan di ≥ 80% (bisa ditutup); jika penuh, upload ditolak dengan alasan dan saran. Tidak ada penghapusan otomatis.
- Upload: status File dipilih / Sedang mengunggah / Berhasil / Gagal / Dibatalkan. Setelah 5 detik masih berjalan muncul info "membutuhkan waktu lebih lama" (simulasi, tidak mengukur koneksi nyata). Pengumuman `aria-live` hanya saat status berubah.

## Peringatan penyimpanan bertingkat & pengujian (dev)
- Normal < 80%, Hampir penuh 80–94%, Kritis 95–99%, Penuh 100%. Kartu peringatan (bisa ditutup, muncul lagi jika tingkat berubah) punya tombol **Kelola file** dan **Lihat penggunaan/rincian**. Kelola file: pindah ke Sampah atau hapus permanen (dengan konfirmasi); kapasitas dihitung ulang dari data yang sama. Upload yang melebihi sisa ruang ditolak dan tidak masuk daftar.
- **Uji kondisi (hanya `npm run dev`):** buka `http://localhost:5173/?storage=69`, `85`, `97`, atau `100`. Parameter ini diabaikan pada build produksi (GitHub Pages) dan tidak ada tombolnya di UI.

## Simulasi Audit (Mode Demonstrasi)
Di **Kelola penyimpanan** ada bagian "Mode Demonstrasi": *Hampir Penuh* (95%), *Penuh* (100%, memunculkan modal peringatan), dan *Reset ke Kondisi Normal*. Sumber data tunggal: `used = realUsed + simExtra`; reset hanya mengembalikan `simExtra = 0`, file tidak dihapus. Status simulasi tidak disimpan (refresh = normal). Saat penuh, upload ditolak dan tidak masuk daftar. Modal kini mengunci fokus (Tab/Shift+Tab), menutup dengan Escape, dan mengembalikan fokus ke tombol pemicu.
s