# PresenSync — Wira Muda Tailor

Sistem Aplikasi Web Progresif (PWA) Presensi Karyawan berbasis Geofence GPS dan Verifikasi Foto Selfie Kamera untuk **Wira Muda Tailor**.

## 🚀 Fitur Unggulan

1. **Verifikasi Lokasi Geofence GPS (Haversine Formula)**:
   - Validasi otomatis apakah perangkat staf berada di dalam radius workshop (default 100m dari titik workshop).
   - Pengaturan titik koordinat dan toleransi radius yang fleksibel.
2. **Kamera Selfie Presensi (WebRTC)**:
   - Pengambilan foto langsung saat melakukan Catat Masuk & Catat Pulang.
   - Dilengkapi fallback avatar otomatis untuk perangkat tanpa webcam.
3. **Pencatatan Shift Kerja Fleksibel**:
   - Mendukung Shift Pagi, Shift Lembur/Malam, dan Shift Fleksibel Proyek Borongan.
   - Deteksi otomatis keterlambatan (menit telat) di luar batas toleransi.
4. **Form Pengajuan Izin & Cuti**:
   - Pengajuan izin sakit, keperluan darurat, atau cuti tahunan dengan riwayat status persetujuan.
5. **Rekapitulasi Gaji (Payroll) Otomatis**:
   - Penghitungan otomatis gaji harian, uang makan/kehadiran, serta kalkulasi potongan keterlambatan.
   - Cetak **Slip Gaji Karyawan** siap cetak A4 / printer thermal.
   - Ekspor rekapitulasi gaji dalam format CSV.
6. **Manajemen Staf & Pengaturan Usaha**:
   - Tambah, edit, dan kelola tarif upah per staf/jabatan.
7. **PWA & Offline-First**:
   - Dilengkapi manifest PWA dan Service Worker untuk performa cepat dan keandalan saat jaringan offline.
   - Pencadangan dan pemulihan data lokal (JSON Backup & Restore).

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+), Modern CSS3 (CSS Grid & Flexbox)
- **Tema Desain**: Sartorial Bespoke Tailor (Indigo Navy `#1e1b4b` & Thread Gold `#d97706`)
- **PWA**: Web App Manifest & Service Worker Cache
- **Penyimpanan**: Browser LocalStorage (`presensync_wira_muda_v1`)

---

## 💻 Menjalankan Secara Lokal

Buka `index.html` langsung di browser, atau jalankan menggunakan server HTTP lokal:

```bash
# Menggunakan python http.server
python3 -m http.server 8080

# Atau menggunakan npx serve
npx serve .
```

Buka `http://localhost:8080` pada browser Anda.
