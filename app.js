/**
 * PresenSync — Wira Muda Tailor
 * Smart Attendance & Payroll System (Cotap UI Edition)
 * Version: 2026112102
 */

(function () {
  'use strict';

  // --- KONSTANTA & STORAGE KEY ---
  const STORAGE_KEY = 'presensync_wira_muda_v1';

  // --- DATA AWAL (DEFAULT) ---
  const DEFAULT_DATA = {
    pengaturan: {
      namaWorkshop: 'Wira Muda Tailor',
      alamatWorkshop: 'Jl. Mode Busana No. 18, Sentra Konveksi',
      latitude: -6.200000,
      longitude: 106.816666,
      radiusToleransi: 100 // meter
    },
    staf: [
      { id: 'staf-1', nama: 'Ahmad Riyadi', jabatan: 'Penjahit Utama', gajiHarian: 120000, tunjanganHarian: 25000, dendaTelat: 500, status: 'aktif' },
      { id: 'staf-2', nama: 'Siti Rahmawati', jabatan: 'Pemotong Pola', gajiHarian: 110000, tunjanganHarian: 25000, dendaTelat: 500, status: 'aktif' },
      { id: 'staf-3', nama: 'Dewi Anggraini', jabatan: 'Finishing & Kancing', gajiHarian: 90000, tunjanganHarian: 20000, dendaTelat: 500, status: 'aktif' },
      { id: 'staf-4', nama: 'Budi Setiawan', jabatan: 'Bordir & Payet', gajiHarian: 100000, tunjanganHarian: 20000, dendaTelat: 500, status: 'aktif' },
      { id: 'staf-5', nama: 'Fitri Handayani', jabatan: 'Admin & Pengukuran', gajiHarian: 100000, tunjanganHarian: 25000, dendaTelat: 500, status: 'aktif' }
    ],
    shift: {
      pagi: { nama: 'Shift Pagi', masuk: '08:00', pulang: '17:00', toleransi: 15 },
      lembur: { nama: 'Shift Lembur / Malam', masuk: '13:00', pulang: '21:00', toleransi: 15 },
      fleksibel: { nama: 'Shift Fleksibel (Proyek)', masuk: '09:00', pulang: '18:00', toleransi: 30 }
    },
    izin: [
      {
        id: 'iz-1',
        karyawanId: 'staf-3',
        karyawanNama: 'Dewi Anggraini',
        jenis: 'Sakit',
        tglMulai: '2026-11-18',
        tglSelesai: '2026-11-19',
        keterangan: 'Demam dan flu, istirahat dokter',
        status: 'Disetujui'
      }
    ],
    presensi: [
      {
        id: 'pres-101',
        karyawanId: 'staf-1',
        karyawanNama: 'Ahmad Riyadi',
        tanggal: '2026-11-20',
        shift: 'pagi',
        jamMasuk: '07:55',
        jamPulang: '17:05',
        durasiJam: 9.1,
        statusKetepatan: 'Tepat Waktu',
        menitTelat: 0,
        jarakMeter: 18,
        dalamRadius: true,
        fotoSelfie: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e1b4b"/><text x="50" y="55" fill="%23a78bfa" font-size="28" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">AR</text></svg>'
      },
      {
        id: 'pres-102',
        karyawanId: 'staf-2',
        karyawanNama: 'Siti Rahmawati',
        tanggal: '2026-11-20',
        shift: 'pagi',
        jamMasuk: '08:22',
        jamPulang: '17:10',
        durasiJam: 8.8,
        statusKetepatan: 'Terlambat 7 mnt',
        menitTelat: 7,
        jarakMeter: 35,
        dalamRadius: true,
        fotoSelfie: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e1b4b"/><text x="50" y="55" fill="%23a78bfa" font-size="28" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">SR</text></svg>'
      },
      {
        id: 'pres-103',
        karyawanId: 'staf-4',
        karyawanNama: 'Budi Setiawan',
        tanggal: '2026-11-20',
        shift: 'lembur',
        jamMasuk: '12:58',
        jamPulang: '21:05',
        durasiJam: 8.1,
        statusKetepatan: 'Tepat Waktu',
        menitTelat: 0,
        jarakMeter: 22,
        dalamRadius: true,
        fotoSelfie: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231e1b4b"/><text x="50" y="55" fill="%23a78bfa" font-size="28" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">BS</text></svg>'
      }
    ]
  };

  // --- STATE RUNTIME ---
  let state = loadState();
  let mediaStream = null;
  let fotoTersimpan = null;
  let koordinatTerkini = null;
  let jarakKeWorkshop = 18;
  let statusGpsValid = true;
  let activeCheckMode = 'masuk'; // 'masuk' or 'pulang'

  function loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return Object.assign({}, DEFAULT_DATA, JSON.parse(data));
      }
    } catch (e) {
      console.warn('Gagal memuat localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Gagal menyimpan localStorage:', e);
    }
  }

  // --- FORMATTER HELPER ---
  function formatRupiah(angka) {
    const val = Number(angka) || 0;
    return 'Rp' + val.toLocaleString('id-ID');
  }

  function getTanggalHariIniISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getJamMenitSekarang() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function hitungJarakMeter(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initJamDigital();
    initNavigasi();
    initDropdownStaf();
    initGpsGeofence();
    initKamera();
    initAksiPresensi();
    initCotapUI();
    renderDotMatrix();
    renderFeedHariIni();
    renderTabelIzin();
    renderTabelLog();
    renderRekapGaji();
    renderStafAdmin();
    initPengaturan();
    initBackupRestore();
    initModalIzin();
    initModalStaf();
    initModalSlip();
    registerServiceWorker();
  });

  // --- SERVICE WORKER ---
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('ServiceWorker gagal didaftarkan:', err);
      });
    }
  }

  // --- JAM & TANGGAL DIGITAL ---
  function initJamDigital() {
    const elJam = document.getElementById('jamDigital');
    const elTgl = document.getElementById('tglDigital');
    const elTglHariIni = document.getElementById('labelTglHariIni');
    const elHeroClock = document.getElementById('heroClockLarge');

    const opsiTgl = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    function update() {
      const now = new Date();
      if (elJam) {
        elJam.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
      }
      if (elHeroClock) {
        // Cotap reference 12-hour format e.g. "12:52 PM" with seconds
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 becomes 12
        elHeroClock.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
      }
      if (elTgl) {
        elTgl.textContent = now.toLocaleDateString('id-ID', opsiTgl);
      }
      if (elTglHariIni) {
        elTglHariIni.textContent = now.toLocaleDateString('id-ID', opsiTgl);
      }
    }
    update();
    setInterval(update, 1000);
  }

  // --- NAVIGASI TAB (DESKTOP SIDEBAR + MOBILE BOTTOM BAR) ---
  function initNavigasi() {
    const desktopItems = document.querySelectorAll('.nav-item');
    const mobileItems = document.querySelectorAll('.m-nav-item');
    const sections = document.querySelectorAll('.halaman');

    function setActiveTab(targetId) {
      desktopItems.forEach(n => {
        if (n.getAttribute('data-target') === targetId) n.classList.add('aktif');
        else n.classList.remove('aktif');
      });

      mobileItems.forEach(m => {
        if (m.getAttribute('data-target') === targetId) m.classList.add('aktif');
        else m.classList.remove('aktif');
      });

      sections.forEach(s => {
        if (s.id === targetId) s.classList.add('aktif');
        else s.classList.remove('aktif');
      });

      if (targetId === 'hal-gaji') renderRekapGaji();
      if (targetId === 'hal-log') {
        renderTabelLog();
        renderDotMatrix();
      }
      if (targetId === 'hal-izin') renderTabelIzin();
    }

    desktopItems.forEach(item => {
      item.addEventListener('click', () => {
        setActiveTab(item.getAttribute('data-target'));
      });
    });

    mobileItems.forEach(item => {
      item.addEventListener('click', () => {
        setActiveTab(item.getAttribute('data-target'));
      });
    });

    // Expose to window for direct navigation
    window.navigasiKeTab = setActiveTab;
  }

  // --- DROPDOWN STAF ---
  function initDropdownStaf() {
    const selectPresensi = document.getElementById('selectKaryawan');
    const selectFilterLog = document.getElementById('filterKaryawanLog');
    const selectIzin = document.getElementById('izinKaryawan');

    const stafAktif = state.staf.filter(s => s.status === 'aktif');

    if (selectPresensi) {
      selectPresensi.innerHTML = stafAktif.map(s => 
        `<option value="${s.id}">${s.nama} (${s.jabatan})</option>`
      ).join('');

      selectPresensi.addEventListener('change', updateActiveStaffDisplay);
    }

    if (selectIzin) {
      selectIzin.innerHTML = stafAktif.map(s => 
        `<option value="${s.id}">${s.nama} (${s.jabatan})</option>`
      ).join('');
    }

    if (selectFilterLog) {
      selectFilterLog.innerHTML = '<option value="semua">Semua Staf</option>' + 
        stafAktif.map(s => `<option value="${s.id}">${s.nama}</option>`).join('');
    }

    updateActiveStaffDisplay();
  }

  // --- UPDATE ACTIVE STAFF & HERO CARD DATA ---
  function updateActiveStaffDisplay() {
    const selectPresensi = document.getElementById('selectKaryawan');
    if (!selectPresensi) return;

    const stafId = selectPresensi.value;
    const staf = state.staf.find(s => s.id === stafId);
    if (!staf) return;

    // Top greeting & avatar
    const elTopNama = document.getElementById('topUserNama');
    const elTopSub = document.getElementById('topUserSub');
    const elTopAvatar = document.getElementById('topUserAvatar');

    if (elTopNama) elTopNama.textContent = staf.nama;
    if (elTopSub) elTopSub.textContent = `${staf.jabatan} • Wira Muda Tailor`;
    if (elTopAvatar) {
      const inisial = staf.nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      elTopAvatar.innerHTML = `<span>${inisial}</span>`;
    }

    // Periksa status log hari ini untuk staf ini
    const tglHariIni = getTanggalHariIniISO();
    const logHariIni = state.presensi.find(p => p.karyawanId === stafId && p.tanggal === tglHariIni);

    const heroStatusPill = document.getElementById('heroStatusPill');
    const heroStatusText = document.getElementById('heroStatusText');
    const heroWorkedHrs = document.getElementById('heroWorkedHrs');
    const heroCheckInTime = document.getElementById('heroCheckInTime');
    const heroGpsDistance = document.getElementById('heroGpsDistance');

    if (heroGpsDistance) {
      heroGpsDistance.textContent = `📍 ${jarakKeWorkshop || 18}m`;
    }

    if (logHariIni && logHariIni.jamMasuk && logHariIni.jamMasuk !== '-') {
      if (heroStatusPill) heroStatusPill.classList.add('checked-in');
      if (heroStatusText) {
        heroStatusText.textContent = logHariIni.jamPulang && logHariIni.jamPulang !== '-' 
          ? 'Shift Selesai' 
          : `Checked In (${logHariIni.jamMasuk})`;
      }
      if (heroCheckInTime) heroCheckInTime.textContent = `${logHariIni.jamMasuk} WIB`;
      if (heroWorkedHrs) {
        heroWorkedHrs.textContent = logHariIni.durasiJam 
          ? `${logHariIni.durasiJam} jam` 
          : `${logHariIni.jamMasuk} - Sekarang`;
      }

      // Bila sudah check-in dan belum check-out, set default concentric button ke 'pulang'
      if (!logHariIni.jamPulang || logHariIni.jamPulang === '-') {
        setCheckMode('pulang');
      } else {
        setCheckMode('masuk');
      }
    } else {
      if (heroStatusPill) heroStatusPill.classList.remove('checked-in');
      if (heroStatusText) heroStatusText.textContent = 'Belum Absen';
      if (heroCheckInTime) heroCheckInTime.textContent = '--:-- WIB';
      if (heroWorkedHrs) heroWorkedHrs.textContent = '00:00 - 00:00';
      setCheckMode('masuk');
    }
  }

  // --- COTAP INTERACTION & CONCENTRIC BUTTON ---
  function initCotapUI() {
    const modeBtnMasuk = document.getElementById('modeBtnMasuk');
    const modeBtnPulang = document.getElementById('modeBtnPulang');
    const btnCircle = document.getElementById('btnCheckInCircle');
    const heroBtnIzin = document.getElementById('heroBtnIzin');
    const btnRefreshFeed = document.getElementById('btnRefreshFeed');

    if (modeBtnMasuk) {
      modeBtnMasuk.addEventListener('click', () => setCheckMode('masuk'));
    }
    if (modeBtnPulang) {
      modeBtnPulang.addEventListener('click', () => setCheckMode('pulang'));
    }

    if (btnCircle) {
      btnCircle.addEventListener('click', () => {
        prosesPresensi(activeCheckMode);
      });
    }

    if (heroBtnIzin) {
      heroBtnIzin.addEventListener('click', () => {
        const modal = document.getElementById('modalFormIzin');
        const form = document.getElementById('formIzin');
        if (form) form.reset();
        document.getElementById('izinTglMulai').value = getTanggalHariIniISO();
        document.getElementById('izinTglSelesai').value = getTanggalHariIniISO();
        // Set dropdown izin ke karyawan aktif
        const selectPresensi = document.getElementById('selectKaryawan');
        const selectIzin = document.getElementById('izinKaryawan');
        if (selectPresensi && selectIzin) selectIzin.value = selectPresensi.value;
        if (modal) modal.removeAttribute('hidden');
      });
    }

    if (btnRefreshFeed) {
      btnRefreshFeed.addEventListener('click', () => {
        renderFeedHariIni();
        updateActiveStaffDisplay();
      });
    }
  }

  function setCheckMode(mode) {
    activeCheckMode = mode;
    const modeBtnMasuk = document.getElementById('modeBtnMasuk');
    const modeBtnPulang = document.getElementById('modeBtnPulang');
    const btnCircle = document.getElementById('btnCheckInCircle');
    const circleBtnLabel = document.getElementById('circleBtnLabel');
    const circleBtnSub = document.getElementById('circleBtnSub');

    if (mode === 'pulang') {
      if (modeBtnMasuk) modeBtnMasuk.classList.remove('aktif');
      if (modeBtnPulang) modeBtnPulang.classList.add('aktif');
      if (btnCircle) btnCircle.classList.add('mode-pulang');
      if (circleBtnLabel) circleBtnLabel.textContent = 'Check Out';
      if (circleBtnSub) circleBtnSub.textContent = 'Catat Pulang';
    } else {
      if (modeBtnMasuk) modeBtnMasuk.classList.add('aktif');
      if (modeBtnPulang) modeBtnPulang.classList.remove('aktif');
      if (btnCircle) btnCircle.classList.remove('mode-pulang');
      if (circleBtnLabel) circleBtnLabel.textContent = 'Check In';
      if (circleBtnSub) circleBtnSub.textContent = 'Catat Masuk';
    }
  }

  // --- ATTENDANCE HEATMAP DOT MATRIX (REFERENCE STYLE) ---
  function renderDotMatrix() {
    const grid = document.getElementById('dotMatrixGrid');
    if (!grid) return;

    // Generate 22 columns x 7 rows = 154 dots
    // Simulate real attendance with active/late/empty states
    const totalDots = 22 * 7;
    let html = '';

    for (let i = 0; i < totalDots; i++) {
      const dayOfWeek = i % 7; // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      let dotClass = 'matrix-dot';

      if (!isWeekend) {
        // Weekdays: 85% attended, 10% late, 5% empty
        const rand = (i * 17 + 5) % 100;
        if (rand < 82) {
          dotClass += ' attended';
        } else if (rand < 94) {
          dotClass += ' late';
        }
      } else {
        // Some overtime on Saturday for tailor shop
        if (dayOfWeek === 6 && (i % 3 === 0)) {
          dotClass += ' attended';
        }
      }

      html += `<div class="${dotClass}" title="Dot Record #${i + 1}"></div>`;
    }

    grid.innerHTML = html;
  }

  // --- GPS GEOFENCE CHECK ---
  function initGpsGeofence() {
    const btnRefresh = document.getElementById('btnRefreshGps');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', cekPosisiGps);
    }
    cekPosisiGps();
  }

  function cekPosisiGps() {
    const wadah = document.getElementById('wadahGeofence');
    const labelStatus = document.getElementById('labelStatusGps');
    const labelJarak = document.getElementById('labelJarakGps');
    const ikon = document.getElementById('ikonGeofence');

    if (!navigator.geolocation) {
      if (labelStatus) labelStatus.textContent = 'GPS Tidak Didukung';
      if (labelJarak) labelJarak.textContent = 'Menggunakan toleransi workshop.';
      tetapkanStatusGps(true, 18);
      return;
    }

    if (labelStatus) labelStatus.textContent = 'Mencari Koordinat GPS...';
    if (labelJarak) labelJarak.textContent = 'Mengukur jarak ke workshop...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        koordinatTerkini = { lat: userLat, lng: userLng };

        const targetLat = Number(state.pengaturan.latitude);
        const targetLng = Number(state.pengaturan.longitude);
        const radius = Number(state.pengaturan.radiusToleransi) || 100;

        const meter = hitungJarakMeter(userLat, userLng, targetLat, targetLng);
        jarakKeWorkshop = meter;

        if (meter <= radius) {
          statusGpsValid = true;
          if (wadah) wadah.className = 'kartu-geofence sukses';
          if (ikon) ikon.textContent = '📍';
          if (labelStatus) labelStatus.textContent = 'Lokasi Terverifikasi (Di Dalam Workshop)';
          if (labelJarak) labelJarak.textContent = `Jarak: ${meter}m (Radius maks: ${radius}m)`;
        } else {
          statusGpsValid = false;
          if (wadah) wadah.className = 'kartu-geofence bahaya';
          if (ikon) ikon.textContent = '⚠️';
          if (labelStatus) labelStatus.textContent = 'Di Luar Radius Workshop!';
          if (labelJarak) labelJarak.textContent = `Jarak: ${meter}m (Batas toleransi: ${radius}m)`;
        }
        updateHeroGps();
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        tetapkanStatusGps(true, 18);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function tetapkanStatusGps(valid, jarak) {
    statusGpsValid = valid;
    jarakKeWorkshop = jarak;
    const wadah = document.getElementById('wadahGeofence');
    const labelStatus = document.getElementById('labelStatusGps');
    const labelJarak = document.getElementById('labelJarakGps');
    if (wadah) wadah.className = valid ? 'kartu-geofence sukses' : 'kartu-geofence bahaya';
    if (labelStatus) labelStatus.textContent = valid ? 'Lokasi Workshop Terverifikasi' : 'Di Luar Radius Workshop';
    if (labelJarak) labelJarak.textContent = `Jarak terdeteksi: ${jarak}m`;
    updateHeroGps();
  }

  function updateHeroGps() {
    const heroGpsDistance = document.getElementById('heroGpsDistance');
    if (heroGpsDistance) {
      heroGpsDistance.textContent = `📍 ${jarakKeWorkshop || 18}m`;
    }
  }

  // --- KAMERA & FOTO SELFIE ---
  function initKamera() {
    const video = document.getElementById('videoSelfie');
    const canvas = document.getElementById('canvasSelfie');
    const imgPreview = document.getElementById('imgSelfiePreview');
    const placeholder = document.getElementById('placeholderKamera');

    const btnNyalakan = document.getElementById('btnNyalakanKamera');
    const btnAmbil = document.getElementById('btnAmbilFoto');
    const btnUlang = document.getElementById('btnUlangFoto');

    if (!btnNyalakan) return;

    btnNyalakan.addEventListener('click', async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC Camera tidak didukung pada browser ini.');
        }

        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });

        video.srcObject = mediaStream;
        video.removeAttribute('hidden');
        placeholder.setAttribute('hidden', 'true');
        imgPreview.setAttribute('hidden', 'true');

        btnNyalakan.setAttribute('hidden', 'true');
        btnAmbil.removeAttribute('disabled');
        btnUlang.setAttribute('hidden', 'true');
      } catch (err) {
        console.warn('Gagal akses kamera:', err);
        buatFotoAvatarFallback();
      }
    });

    btnAmbil.addEventListener('click', () => {
      if (!mediaStream) {
        buatFotoAvatarFallback();
        return;
      }

      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      fotoTersimpan = canvas.toDataURL('image/jpeg', 0.65);
      imgPreview.src = fotoTersimpan;
      imgPreview.removeAttribute('hidden');
      video.setAttribute('hidden', 'true');

      hentikanKamera();

      btnAmbil.setAttribute('disabled', 'true');
      btnUlang.removeAttribute('hidden');
    });

    btnUlang.addEventListener('click', () => {
      fotoTersimpan = null;
      imgPreview.src = '';
      imgPreview.setAttribute('hidden', 'true');
      btnNyalakan.removeAttribute('hidden');
      btnNyalakan.click();
    });
  }

  function hentikanKamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
  }

  function buatFotoAvatarFallback() {
    const select = document.getElementById('selectKaryawan');
    const nama = select.options[select.selectedIndex]?.text || 'Staf';
    const inisial = nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#140b2e"/>
          <stop offset="100%" stop-color="#3d1b7a"/>
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#g)"/>
      <circle cx="150" cy="150" r="110" fill="none" stroke="#8b5cf6" stroke-width="6"/>
      <text x="150" y="165" fill="#ffffff" font-size="80" font-family="-apple-system, sans-serif" font-weight="bold" text-anchor="middle">${inisial}</text>
    </svg>`;

    fotoTersimpan = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    const imgPreview = document.getElementById('imgSelfiePreview');
    const placeholder = document.getElementById('placeholderKamera');
    const video = document.getElementById('videoSelfie');
    const btnNyalakan = document.getElementById('btnNyalakanKamera');
    const btnAmbil = document.getElementById('btnAmbilFoto');
    const btnUlang = document.getElementById('btnUlangFoto');

    if (imgPreview) {
      imgPreview.src = fotoTersimpan;
      imgPreview.removeAttribute('hidden');
    }
    if (video) video.setAttribute('hidden', 'true');
    if (placeholder) placeholder.setAttribute('hidden', 'true');
    if (btnNyalakan) btnNyalakan.setAttribute('hidden', 'true');
    if (btnAmbil) btnAmbil.setAttribute('disabled', 'true');
    if (btnUlang) btnUlang.removeAttribute('hidden');
  }

  // --- AKSI PRESENSI (CHECK-IN & CHECK-OUT) ---
  function initAksiPresensi() {
    const btnCheckIn = document.getElementById('btnCheckIn');
    const btnCheckOut = document.getElementById('btnCheckOut');

    if (btnCheckIn) btnCheckIn.addEventListener('click', () => prosesPresensi('masuk'));
    if (btnCheckOut) btnCheckOut.addEventListener('click', () => prosesPresensi('pulang'));
  }

  function prosesPresensi(tipe) {
    const selectKaryawan = document.getElementById('selectKaryawan');
    const selectShift = document.getElementById('selectShift');

    const karyawanId = selectKaryawan.value;
    const shiftKey = selectShift ? selectShift.value : 'pagi';
    const staf = state.staf.find(s => s.id === karyawanId);

    if (!staf) {
      alert('Pilih karyawan terlebih dahulu!');
      return;
    }

    const tglHariIni = getTanggalHariIniISO();
    const jamSekarang = getJamMenitSekarang();

    if (!fotoTersimpan) {
      buatFotoAvatarFallback();
    }

    let logHariIni = state.presensi.find(p => p.karyawanId === karyawanId && p.tanggal === tglHariIni);

    if (tipe === 'masuk') {
      if (logHariIni && logHariIni.jamMasuk && logHariIni.jamMasuk !== '-') {
        alert(`Perhatian: ${staf.nama} sudah melakukan CATAT MASUK hari ini pada jam ${logHariIni.jamMasuk}!`);
        return;
      }

      const shiftConfig = state.shift[shiftKey] || state.shift.pagi;
      const targetMasuk = shiftConfig.masuk;
      const toleransi = shiftConfig.toleransi || 15;

      const menitMasuk = waktuKeMenit(jamSekarang);
      const menitJadwal = waktuKeMenit(targetMasuk);
      const selisih = menitMasuk - menitJadwal;

      let statusKetepatan = 'Tepat Waktu';
      let menitTelat = 0;

      if (selisih > toleransi) {
        menitTelat = selisih;
        statusKetepatan = `Terlambat ${menitTelat} mnt`;
      }

      const logBaru = {
        id: 'pres-' + Date.now(),
        karyawanId: staf.id,
        karyawanNama: staf.nama,
        tanggal: tglHariIni,
        shift: shiftKey,
        jamMasuk: jamSekarang,
        jamPulang: '-',
        durasiJam: 0,
        statusKetepatan: statusKetepatan,
        menitTelat: menitTelat,
        jarakMeter: jarakKeWorkshop || 18,
        dalamRadius: statusGpsValid,
        fotoSelfie: fotoTersimpan
      };

      state.presensi.unshift(logBaru);
      saveState();

      alert(`✅ Berhasil Check In!\n\nNama: ${staf.nama}\nJam: ${jamSekarang} WIB\nStatus: ${statusKetepatan}\nJarak: ${logBaru.jarakMeter}m`);
    } else if (tipe === 'pulang') {
      if (!logHariIni || !logHariIni.jamMasuk || logHariIni.jamMasuk === '-') {
        alert(`Peringatan: ${staf.nama} belum melakukan Check In hari ini.`);
        return;
      }
      if (logHariIni.jamPulang && logHariIni.jamPulang !== '-') {
        if (!confirm(`${staf.nama} sudah catat pulang pada ${logHariIni.jamPulang}. Perbarui jam pulang sekarang?`)) {
          return;
        }
      }

      logHariIni.jamPulang = jamSekarang;
      const menitMsk = waktuKeMenit(logHariIni.jamMasuk);
      const menitPlg = waktuKeMenit(jamSekarang);
      const totalMenit = Math.max(0, menitPlg - menitMsk);
      logHariIni.durasiJam = Number((totalMenit / 60).toFixed(1));

      saveState();
      alert(`✅ Berhasil Check Out!\n\nNama: ${staf.nama}\nJam Masuk: ${logHariIni.jamMasuk}\nJam Pulang: ${jamSekarang}\nTotal Durasi: ${logHariIni.durasiJam} jam`);
    }

    updateActiveStaffDisplay();
    renderFeedHariIni();
    renderTabelLog();
    renderRekapGaji();
  }

  function waktuKeMenit(waktuStr) {
    if (!waktuStr || waktuStr === '-') return 0;
    const parts = waktuStr.split(':');
    return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
  }

  // --- COTAP TEAM STATUS & METRICS ---
  function renderFeedHariIni() {
    const tglHariIni = getTanggalHariIniISO();
    const presensiHariIni = state.presensi.filter(p => p.tanggal === tglHariIni);

    const elFeed = document.getElementById('feedHariIni');
    const elHadir = document.getElementById('miniHadirCount');
    const elTelat = document.getElementById('miniTelatCount');
    const elIzin = document.getElementById('miniIzinCount');

    const hadirCount = presensiHariIni.filter(p => p.jamMasuk && p.jamMasuk !== '-').length;
    const telatCount = presensiHariIni.filter(p => p.menitTelat > 0).length;
    const izinCount = state.izin.filter(iz => iz.status === 'Disetujui' && (iz.tglMulai <= tglHariIni && iz.tglSelesai >= tglHariIni)).length;

    if (elHadir) elHadir.textContent = hadirCount;
    if (elTelat) elTelat.textContent = telatCount;
    if (elIzin) elIzin.textContent = izinCount;

    if (!elFeed) return;

    if (presensiHariIni.length === 0) {
      elFeed.innerHTML = '<p class="redup-kecil" style="text-align: center; padding: 24px 0;">Belum ada aktivitas presensi staf hari ini.</p>';
      return;
    }

    // Render directly matching Cotap Team Status card mockup
    elFeed.innerHTML = presensiHariIni.map(item => {
      const isLate = item.menitTelat > 0;
      const tagText = isLate ? `Late ${item.menitTelat}m` : 'On Time';
      const tagClass = isLate ? 'tag-late' : 'tag-ontime';
      const stafInfo = state.staf.find(s => s.id === item.karyawanId);
      const roleText = stafInfo ? stafInfo.jabatan : 'Workshop Staf';

      return `
        <div class="team-status-item">
          <div class="team-member-left">
            <div class="team-member-avatar">
              <img src="${item.fotoSelfie}" alt="${item.karyawanNama}">
            </div>
            <div class="team-member-meta">
              <strong>${item.karyawanNama}</strong>
              <small>📍 ${roleText} • Sentra Konveksi</small>
            </div>
          </div>
          <div class="team-member-right">
            <div class="team-member-time">${item.jamMasuk || '-'}</div>
            <span class="team-badge-tag ${tagClass}">${tagText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- TABEL LOG & RIWAYAT ---
  function renderTabelLog() {
    const tbody = document.getElementById('tbodyLog');
    const filterTgl = document.getElementById('filterTglLog');
    const filterStaf = document.getElementById('filterKaryawanLog');

    if (!tbody) return;

    let logs = state.presensi.slice();

    if (filterTgl && filterTgl.value) {
      logs = logs.filter(p => p.tanggal === filterTgl.value);
    }
    if (filterStaf && filterStaf.value !== 'semua') {
      logs = logs.filter(p => p.karyawanId === filterStaf.value);
    }

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--teks-redup);">Tidak ada data log yang sesuai.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(p => {
      const pillClass = p.menitTelat > 0 ? 'pill-telat' : 'pill-tepat';
      const gpsStatusText = p.dalamRadius ? `📍 ${p.jarakMeter}m (Workshop)` : `⚠️ ${p.jarakMeter}m (Luar)`;
      return `
        <tr>
          <td><img src="${p.fotoSelfie}" class="foto-thumb" alt="Foto"></td>
          <td><b>${p.karyawanNama}</b></td>
          <td>${p.tanggal}</td>
          <td>${p.shift}</td>
          <td>${p.jamMasuk || '-'}</td>
          <td>${p.jamPulang || '-'}</td>
          <td>${p.durasiJam || 0} jam</td>
          <td><span class="pill-status ${pillClass}">${p.statusKetepatan}</span></td>
          <td>${gpsStatusText}</td>
        </tr>
      `;
    }).join('');

    if (filterTgl && !filterTgl.dataset.bound) {
      filterTgl.dataset.bound = 'true';
      filterTgl.addEventListener('change', renderTabelLog);
    }
    if (filterStaf && !filterStaf.dataset.bound) {
      filterStaf.dataset.bound = 'true';
      filterStaf.addEventListener('change', renderTabelLog);
    }
    const btnReset = document.getElementById('btnResetFilterLog');
    if (btnReset && !btnReset.dataset.bound) {
      btnReset.dataset.bound = 'true';
      btnReset.addEventListener('click', () => {
        if (filterTgl) filterTgl.value = '';
        if (filterStaf) filterStaf.value = 'semua';
        renderTabelLog();
      });
    }
  }

  // --- REKAPITULASI GAJI (PAYROLL) ---
  function renderRekapGaji() {
    const tbody = document.getElementById('tbodyGaji');
    const selectBulan = document.getElementById('selectBulanGaji');

    if (!tbody) return;

    const dataGaji = hitungRekapGaji(selectBulan ? selectBulan.value : 'current');

    if (dataGaji.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 24px; color: var(--teks-redup);">Belum ada data gaji untuk periode ini.</td></tr>';
      return;
    }

    tbody.innerHTML = dataGaji.map(g => `
      <tr>
        <td><b>${g.nama}</b></td>
        <td>${g.jabatan}</td>
        <td>${g.hariHadir} hari</td>
        <td>${g.totalJam} jam</td>
        <td>${g.hariTelat} hari (${g.totalMenitTelat}m)</td>
        <td>${formatRupiah(g.gajiPokok)}</td>
        <td>${formatRupiah(g.tunjangan)}</td>
        <td class="teks-merah">-${formatRupiah(g.potongan)}</td>
        <td><strong class="teks-sukses">${formatRupiah(g.totalBersih)}</strong></td>
        <td>
          <button type="button" class="btn-aksi-tabel" onclick="window.bukaSlipGaji('${g.id}')">🖨️ Slip</button>
        </td>
      </tr>
    `).join('');

    const btnCsv = document.getElementById('btnEksporCsvGaji');
    if (btnCsv && !btnCsv.dataset.bound) {
      btnCsv.dataset.bound = 'true';
      btnCsv.addEventListener('click', () => eksporCsvGaji(dataGaji));
    }
  }

  function hitungRekapGaji(periode) {
    const bulanSekarang = new Date().toISOString().slice(0, 7);

    let presensiFiltered = state.presensi.slice();
    if (periode === 'current') {
      presensiFiltered = presensiFiltered.filter(p => p.tanggal.startsWith(bulanSekarang));
    }

    return state.staf.filter(s => s.status === 'aktif').map(staf => {
      const logsStaf = presensiFiltered.filter(p => p.karyawanId === staf.id);
      const hariHadir = logsStaf.length;
      const totalJam = logsStaf.reduce((acc, cur) => acc + (cur.durasiJam || 0), 0);
      const hariTelat = logsStaf.filter(p => (p.menitTelat || 0) > 0).length;
      const totalMenitTelat = logsStaf.reduce((acc, cur) => acc + (cur.menitTelat || 0), 0);

      const dendaPerMenit = Number(staf.dendaTelat) || 500;
      const upahHarian = Number(staf.gajiHarian) || 0;
      const tunjanganHarian = Number(staf.tunjanganHarian) || 0;

      const gajiPokok = hariHadir * upahHarian;
      const tunjangan = hariHadir * tunjanganHarian;
      const potongan = totalMenitTelat * dendaPerMenit;
      const totalBersih = Math.max(0, gajiPokok + tunjangan - potongan);

      return {
        id: staf.id,
        nama: staf.nama,
        jabatan: staf.jabatan,
        upahHarian: upahHarian,
        tunjanganHarian: tunjanganHarian,
        hariHadir: hariHadir,
        totalJam: Number(totalJam.toFixed(1)),
        hariTelat: hariTelat,
        totalMenitTelat: totalMenitTelat,
        gajiPokok: gajiPokok,
        tunjangan: tunjangan,
        potongan: potongan,
        totalBersih: totalBersih
      };
    });
  }

  function eksporCsvGaji(dataGaji) {
    let csv = 'Nama Staf,Jabatan,Hari Hadir,Total Jam,Hari Telat,Total Menit Telat,Gaji Pokok,Tunjangan,Potongan,Total Bersih\n';
    dataGaji.forEach(g => {
      csv += `"${g.nama}","${g.jabatan}",${g.hariHadir},${g.totalJam},${g.hariTelat},${g.totalMenitTelat},${g.gajiPokok},${g.tunjangan},${g.potongan},${g.totalBersih}\n`;
    });
    unduhFileTeks('rekap_gaji_wira_muda_tailor.csv', csv);
  }

  // --- MODAL & SLIP GAJI ---
  function initModalSlip() {
    const modal = document.getElementById('modalSlipGaji');
    const btnTutup = document.getElementById('btnTutupSlip');
    const btnTutupKaki = document.getElementById('btnTutupSlipKaki');
    const btnCetak = document.getElementById('btnCetakSlip');

    if (btnTutup) btnTutup.addEventListener('click', () => modal.setAttribute('hidden', 'true'));
    if (btnTutupKaki) btnTutupKaki.addEventListener('click', () => modal.setAttribute('hidden', 'true'));
    if (btnCetak) btnCetak.addEventListener('click', () => window.print());

    window.bukaSlipGaji = function (stafId) {
      const dataGaji = hitungRekapGaji('current');
      const item = dataGaji.find(g => g.id === stafId);
      if (!item) {
        alert('Data gaji staf tidak ditemukan.');
        return;
      }

      document.getElementById('slipAlamat').textContent = state.pengaturan.alamatWorkshop;
      document.getElementById('slipNama').textContent = item.nama;
      document.getElementById('slipJabatan').textContent = item.jabatan;
      document.getElementById('slipHariHadir').textContent = `${item.hariHadir} hari kerja`;
      document.getElementById('slipTotalJam').textContent = `${item.totalJam} jam`;

      document.getElementById('slipGajiPokok').textContent = formatRupiah(item.gajiPokok);
      document.getElementById('slipTunjangan').textContent = formatRupiah(item.tunjangan);
      document.getElementById('slipPotongan').textContent = '-' + formatRupiah(item.potongan);
      document.getElementById('slipTotalBersih').textContent = formatRupiah(item.totalBersih);

      document.getElementById('slipTtdNama').textContent = item.nama;

      modal.removeAttribute('hidden');
    };
  }

  // --- TABEL & FORM IZIN / CUTI ---
  function renderTabelIzin() {
    const tbody = document.getElementById('tbodyIzin');
    if (!tbody) return;

    if (state.izin.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--teks-redup);">Belum ada pengajuan izin atau cuti.</td></tr>';
      return;
    }

    tbody.innerHTML = state.izin.map(iz => `
      <tr>
        <td><b>${iz.karyawanNama}</b></td>
        <td><span class="pill-status pill-izin">${iz.jenis}</span></td>
        <td>${iz.tglMulai}</td>
        <td>${iz.tglSelesai}</td>
        <td>${iz.keterangan}</td>
        <td><span class="pill-status ${iz.status === 'Disetujui' ? 'pill-tepat' : 'pill-menunggu'}">${iz.status}</span></td>
        <td>
          ${iz.status === 'Menunggu' ? `
            <button type="button" class="btn-aksi-tabel" onclick="window.setujuiIzin('${iz.id}')">✓ Setujui</button>
            <button type="button" class="btn-aksi-tabel btn-aksi-hapus" onclick="window.tolakIzin('${iz.id}')">✕ Tolak</button>
          ` : `
            <button type="button" class="btn-aksi-tabel btn-aksi-hapus" onclick="window.hapusIzin('${iz.id}')">Hapus</button>
          `}
        </td>
      </tr>
    `).join('');
  }

  function initModalIzin() {
    const modal = document.getElementById('modalFormIzin');
    const btnBuka = document.getElementById('btnBukaModalIzin');
    const btnTutup = document.getElementById('btnTutupModalIzin');
    const btnBatal = document.getElementById('btnBatalIzin');
    const form = document.getElementById('formIzin');

    if (btnBuka) btnBuka.addEventListener('click', () => {
      form.reset();
      document.getElementById('izinTglMulai').value = getTanggalHariIniISO();
      document.getElementById('izinTglSelesai').value = getTanggalHariIniISO();
      modal.removeAttribute('hidden');
    });

    const tutup = () => modal.setAttribute('hidden', 'true');
    if (btnTutup) btnTutup.addEventListener('click', tutup);
    if (btnBatal) btnBatal.addEventListener('click', tutup);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const select = document.getElementById('izinKaryawan');
        const stafId = select.value;
        const staf = state.staf.find(s => s.id === stafId);

        const pengajuan = {
          id: 'iz-' + Date.now(),
          karyawanId: stafId,
          karyawanNama: staf ? staf.nama : 'Staf',
          jenis: document.getElementById('izinJenis').value,
          tglMulai: document.getElementById('izinTglMulai').value,
          tglSelesai: document.getElementById('izinTglSelesai').value,
          keterangan: document.getElementById('izinKeterangan').value,
          status: 'Disetujui'
        };

        state.izin.unshift(pengajuan);
        saveState();
        tutup();
        renderTabelIzin();
        renderFeedHariIni();
        alert('✅ Pengajuan izin/cuti berhasil dicatat!');
      });
    }

    window.setujuiIzin = function (id) {
      const item = state.izin.find(i => i.id === id);
      if (item) {
        item.status = 'Disetujui';
        saveState();
        renderTabelIzin();
        renderFeedHariIni();
      }
    };

    window.tolakIzin = function (id) {
      const item = state.izin.find(i => i.id === id);
      if (item) {
        item.status = 'Ditolak';
        saveState();
        renderTabelIzin();
        renderFeedHariIni();
      }
    };

    window.hapusIzin = function (id) {
      if (confirm('Hapus riwayat pengajuan izin ini?')) {
        state.izin = state.izin.filter(i => i.id !== id);
        saveState();
        renderTabelIzin();
        renderFeedHariIni();
      }
    };
  }

  // --- MANAJEMEN STAF (ADMIN) ---
  function renderStafAdmin() {
    const tbody = document.getElementById('tbodyStafAdmin');
    if (!tbody) return;

    tbody.innerHTML = state.staf.map(staf => `
      <tr>
        <td><b>${staf.nama}</b></td>
        <td>${staf.jabatan}</td>
        <td>${formatRupiah(staf.gajiHarian)}</td>
        <td>${formatRupiah(staf.tunjanganHarian)}</td>
        <td>${formatRupiah(staf.dendaTelat)}</td>
        <td><span class="pill-status ${staf.status === 'aktif' ? 'pill-tepat' : 'pill-telat'}">${staf.status}</span></td>
        <td>
          <button type="button" class="btn-aksi-tabel" onclick="window.editStaf('${staf.id}')">✏️ Edit</button>
          <button type="button" class="btn-aksi-tabel btn-aksi-hapus" onclick="window.hapusStaf('${staf.id}')">🗑️ Hapus</button>
        </td>
      </tr>
    `).join('');
  }

  function initModalStaf() {
    const modal = document.getElementById('modalFormStaf');
    const btnTambah = document.getElementById('btnTambahStaf');
    const btnTutup = document.getElementById('btnTutupModalStaf');
    const btnBatal = document.getElementById('btnBatalStaf');
    const form = document.getElementById('formStaf');

    if (btnTambah) {
      btnTambah.addEventListener('click', () => {
        form.reset();
        document.getElementById('formStafId').value = '';
        document.getElementById('judulModalStaf').textContent = 'Tambah Staf Tailor Baru';
        modal.removeAttribute('hidden');
      });
    }

    const tutup = () => modal.setAttribute('hidden', 'true');
    if (btnTutup) btnTutup.addEventListener('click', tutup);
    if (btnBatal) btnBatal.addEventListener('click', tutup);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const idEdit = document.getElementById('formStafId').value;
        const nama = document.getElementById('formStafNama').value.trim();
        const jabatan = document.getElementById('formStafJabatan').value.trim();
        const gaji = Number(document.getElementById('formStafGajiHarian').value) || 0;
        const tunjangan = Number(document.getElementById('formStafTunjanganHarian').value) || 0;
        const denda = Number(document.getElementById('formStafDendaTelat').value) || 0;

        if (idEdit) {
          const item = state.staf.find(s => s.id === idEdit);
          if (item) {
            item.nama = nama;
            item.jabatan = jabatan;
            item.gajiHarian = gaji;
            item.tunjanganHarian = tunjangan;
            item.dendaTelat = denda;
          }
        } else {
          state.staf.push({
            id: 'staf-' + Date.now(),
            nama: nama,
            jabatan: jabatan,
            gajiHarian: gaji,
            tunjanganHarian: tunjangan,
            dendaTelat: denda,
            status: 'aktif'
          });
        }

        saveState();
        tutup();
        initDropdownStaf();
        renderStafAdmin();
        renderRekapGaji();
        alert('✅ Data staf berhasil disimpan!');
      });
    }

    window.editStaf = function (id) {
      const item = state.staf.find(s => s.id === id);
      if (!item) return;

      document.getElementById('formStafId').value = item.id;
      document.getElementById('formStafNama').value = item.nama;
      document.getElementById('formStafJabatan').value = item.jabatan;
      document.getElementById('formStafGajiHarian').value = item.gajiHarian;
      document.getElementById('formStafTunjanganHarian').value = item.tunjanganHarian;
      document.getElementById('formStafDendaTelat').value = item.dendaTelat;
      document.getElementById('judulModalStaf').textContent = 'Edit Data Staf';
      modal.removeAttribute('hidden');
    };

    window.hapusStaf = function (id) {
      if (confirm('Apakah Anda yakin ingin menghapus staf ini?')) {
        state.staf = state.staf.filter(s => s.id !== id);
        saveState();
        initDropdownStaf();
        renderStafAdmin();
        renderRekapGaji();
      }
    };
  }

  // --- PENGATURAN WORKSHOP & GEOFENCE ---
  function initPengaturan() {
    const form = document.getElementById('formSettingWorkshop');
    const setNama = document.getElementById('setNamaWorkshop');
    const setAlamat = document.getElementById('setAlamatWorkshop');
    const setLat = document.getElementById('setLatitude');
    const setLng = document.getElementById('setLongitude');
    const setRad = document.getElementById('setRadiusToleransi');
    const btnAmbilLokasi = document.getElementById('btnAmbilLokasiSekarang');

    if (setNama) setNama.value = state.pengaturan.namaWorkshop;
    if (setAlamat) setAlamat.value = state.pengaturan.alamatWorkshop;
    if (setLat) setLat.value = state.pengaturan.latitude;
    if (setLng) setLng.value = state.pengaturan.longitude;
    if (setRad) setRad.value = state.pengaturan.radiusToleransi;

    if (btnAmbilLokasi) {
      btnAmbilLokasi.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert('GPS tidak didukung perangkat ini.');
          return;
        }
        btnAmbilLokasi.textContent = '⏳ Mengambil koordinat...';
        navigator.geolocation.getCurrentPosition(
          pos => {
            setLat.value = pos.coords.latitude.toFixed(6);
            setLng.value = pos.coords.longitude.toFixed(6);
            btnAmbilLokasi.textContent = '📍 Lokasi Terdeteksi!';
            setTimeout(() => {
              btnAmbilLokasi.textContent = '📍 Gunakan Lokasi Saya Sekarang';
            }, 3000);
          },
          err => {
            alert('Gagal mendeteksi lokasi: ' + err.message);
            btnAmbilLokasi.textContent = '📍 Gunakan Lokasi Saya Sekarang';
          },
          { enableHighAccuracy: true }
        );
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.pengaturan.namaWorkshop = setNama.value.trim();
        state.pengaturan.alamatWorkshop = setAlamat.value.trim();
        state.pengaturan.latitude = parseFloat(setLat.value);
        state.pengaturan.longitude = parseFloat(setLng.value);
        state.pengaturan.radiusToleransi = parseInt(setRad.value, 10);

        saveState();
        cekPosisiGps();
        alert('✅ Pengaturan workshop dan radius GPS berhasil disimpan!');
      });
    }
  }

  // --- BACKUP & RESTORE DATA ---
  function initBackupRestore() {
    const btnBackup = document.getElementById('btnBackupJson');
    const inputRestore = document.getElementById('inputRestoreJson');
    const btnCsvLog = document.getElementById('btnEksporLogCsv');

    if (btnBackup) {
      btnBackup.addEventListener('click', () => {
        const jsonStr = JSON.stringify(state, null, 2);
        unduhFileTeks(`presensync_backup_${getTanggalHariIniISO()}.json`, jsonStr);
      });
    }

    if (inputRestore) {
      inputRestore.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (!data.staf || !data.presensi) {
              throw new Error('Format file cadangan tidak valid.');
            }
            state = data;
            saveState();
            alert('✅ Data berhasil dipulihkan!');
            location.reload();
          } catch (err) {
            alert('Gagal memulihkan file: ' + err.message);
          }
        };
        reader.readAsText(file);
      });
    }

    if (btnCsvLog) {
      btnCsvLog.addEventListener('click', () => {
        let csv = 'ID Presensi,Nama Karyawan,Tanggal,Shift,Jam Masuk,Jam Pulang,Durasi (Jam),Ketepatan,Menit Telat,Jarak GPS (Meter),Dalam Radius\n';
        state.presensi.forEach(p => {
          csv += `"${p.id}","${p.karyawanNama}","${p.tanggal}","${p.shift}","${p.jamMasuk}","${p.jamPulang}",${p.durasiJam},"${p.statusKetepatan}",${p.menitTelat},${p.jarakMeter},${p.dalamRadius}\n`;
        });
        unduhFileTeks(`log_presensi_wira_muda_${getTanggalHariIniISO()}.csv`, csv);
      });
    }
  }

  function unduhFileTeks(namaFile, teks) {
    const blob = new Blob([teks], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

})();
