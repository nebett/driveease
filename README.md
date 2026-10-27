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

## Alur upload
File Saya → **+ Baru** → **Upload file** → pilih file / seret → status *Siap diunggah* → **Mulai upload** → *Sedang mengunggah* (bar + persen; bisa **Batalkan upload**) → *Upload berhasil* + **Lihat file**, atau *Upload gagal* + penyebab + **Coba lagi**.
Untuk screenshot audit: pilih "Simulasi kondisi jaringan" (Normal / Koneksi lambat / Koneksi terputus) sebelum **Mulai upload**. File > 50 MB langsung gagal dengan penjelasan. Setelah "Coba lagi", koneksi dianggap pulih (berhasil).

## Fitur
**Berfungsi:** navigasi sidebar, buat folder (dengan validasi), file picker, drag-and-drop, pencarian nama, detail file, bintang, pindah ke/kembalikan dari Sampah, ganti tampilan daftar/kotak, status & progres upload, batal, coba lagi, notifikasi yang bisa ditutup, teks besar, indikator penyimpanan (dihitung dari file contoh + upload simulasi).
**Simulasi:** progres upload dan kegagalan jaringan, file "terunggah" (hanya nama & ukuran di memori, hilang saat halaman dimuat ulang), tautan berbagi (tidak ada tautan nyata), akun/profil, kapasitas 15 GB. Folder belum bisa dibuka (datar).