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
**Simulasi:** progres upload dan kegagalan jaringan, file "terunggah" (hanya nama & ukuran di memori, hilang saat halaman dimuat ulang), tautan berbagi (tidak ada tautan nyata), akun/profil, kapasitas 15 GB. Folder belum bisa dibuka (datar).

## Keputusan desain
**Accessibility:** semua tombol berlabel teks (aria-label untuk bintang/detail); status selalu berupa teks + ikon, tidak hanya warna; kontras tinggi (teks gelap, teal tua); fokus keyboard tebal & selalu terlihat; semua dapat dioperasikan keyboard, Esc menutup dialog; label `<label>` pada input; error menjelaskan masalah + solusi (`role="alert"`); `aria-live` untuk notifikasi; progressbar ber-ARIA; tautan "Lewati ke konten utama"; menghormati `prefers-reduced-motion`.
**Inclusive:** bahasa Indonesia sederhana; petunjuk langkah di dialog; target sentuh min. 44 px; responsif (sidebar jadi menu geser di ponsel); opsi teks besar; simulasi jaringan lambat/gagal dengan umpan balik jelas; tidak perlu mouse.
**Responsible:** tidak meminta data pribadi (profil fiktif); tidak ada password; upload dapat dibatalkan; transparan bahwa upload hanya simulasi; berbagi default "Hanya saya", akses publik wajib konfirmasi dengan penjelasan risiko.

## Redesign Baby Pink
Hanya `src/index.css` (token warna lewat `@theme`) dan `src/App.jsx` (kelas gaya + komponen `Icon` SVG outline) yang diubah. Logika, state, dan nama fungsi tidak diubah; tidak ada dependensi baru. Tombol utama memakai teks gelap (`#49313D`) di atas `#E8A0BF` agar kontras tetap memadai.
