// --- DATABASE LAYANAN & TARIF ---
const layananData = [
    { id: 'L01', nama: 'Ojek (Motor)', pricelist: 'Mulai Rp 8.000', icon: 'fa-motorcycle', color: '#ef4444' },
    { id: 'L02', nama: 'Jastip', pricelist: 'Mulai Rp 10.000', icon: 'fa-shopping-bag', color: '#f97316' },
    { id: 'L03', nama: 'Taxi (Mobil)', pricelist: 'Mulai Rp 18.000', icon: 'fa-car', color: '#3b82f6' },
    { id: 'L04', nama: 'Bersih-Bersih', pricelist: 'Rp 7.000 / m²', icon: 'fa-broom', color: '#10b981' },
    { id: 'L05', nama: 'Pindahan & Angkut', pricelist: 'Mulai Rp 85.000', icon: 'fa-truck', color: '#eab308' },
    { id: 'L06', nama: 'Jasa Nemenin', pricelist: 'Rp 15.000 / jam', icon: 'fa-user-friends', color: '#f59e0b' },
    { id: 'L07', nama: 'Bantuan Online', pricelist: 'Mulai Rp 10.000', icon: 'fa-laptop', color: '#22c55e' },
    { id: 'L08', nama: 'Joki Tugas', pricelist: 'Mulai Rp 10.000', icon: 'fa-book', color: '#a855f7' },
    { id: 'L09', nama: 'Editing & Dokumentasi', pricelist: 'Mulai Rp 30.000', icon: 'fa-camera', color: '#ec4899' },
    { id: 'L10', nama: 'Penitipan & Packing', pricelist: 'Mulai Rp 15.000', icon: 'fa-box', color: '#0ea5e9' },
    { id: 'L11', nama: 'Teknisi & Tukang', pricelist: 'Mulai Rp 50.000', icon: 'fa-tools', color: '#eab308' },
    { id: 'L12', nama: 'Travel & Rental', pricelist: 'Mulai Rp 80.000', icon: 'fa-key', color: '#14b8a6' },
    { id: 'L13', nama: 'Daily Activity', pricelist: 'Mulai Rp 5.000', icon: 'fa-clock', color: '#8b5cf6' },
    { id: 'L14', nama: 'Jasa Kustom', pricelist: 'Mulai Rp 20.000', icon: 'fa-star', color: '#f43f5e' },
    { id: 'L15', nama: 'Rakit Merakit', pricelist: 'Mulai Rp 50.000', icon: 'fa-hammer', color: '#10b981' }
];

const defaultUsers = [
    { name: "Admin Malang", username: "admin_malang", password: "123456", role: "Admin Cabang", wilayah: "malang" },
    { name: "Admin Jember", username: "admin_jember", password: "123456", role: "Admin Cabang", wilayah: "jember" },
    { name: "Andi Finance", username: "finance", password: "123456", role: "Finance" },
    { name: "Bapak Direktur", username: "head_admin", password: "123456", role: "Head Admin" }
];

const VALID_OTP_CODES = ["TOHELP-HELPMAN-2024", "HELPMAN-VIP-001", "JOKO-HELPMAN-99"];

// Dinaikkan ke v6.0 untuk menghapus data lama otomatis
const DB_VERSION = "v6.0";
let refreshInterval;

// --- INISIALISASI ---
function initDB() {
    let dbVersion = localStorage.getItem('th_db_version');
    if (dbVersion !== DB_VERSION) {
        localStorage.removeItem('th_users');
        localStorage.removeItem('th_orders');
        localStorage.removeItem('th_absensi');
        localStorage.setItem('th_db_version', DB_VERSION);
    }

    let existingUsers = JSON.parse(localStorage.getItem('th_users')) || [];
    defaultUsers.forEach(defUser => {
        if (!existingUsers.find(u => u.username === defUser.username)) existingUsers.push(defUser);
    });
    localStorage.setItem('th_users', JSON.stringify(existingUsers));

    if (!localStorage.getItem('th_orders')) localStorage.setItem('th_orders', JSON.stringify([]));
    if (!localStorage.getItem('th_absensi')) localStorage.setItem('th_absensi', JSON.stringify([]));
    if (!localStorage.getItem('th_chats')) localStorage.setItem('th_chats', JSON.stringify([]));
    if (!localStorage.getItem('th_notifs')) localStorage.setItem('th_notifs', JSON.stringify([]));
}

// --- AUTO UPDATE (REALTIME) ---
let lastSnapshot = '';
function getSnapshot() {
    return ['th_orders', 'th_users', 'th_absensi', 'th_chats', 'th_notifs'].map(k => localStorage.getItem(k)).join('|');
}

function startAutoUpdate(pageId) {
    clearInterval(refreshInterval);
    lastSnapshot = getSnapshot();
    refreshInterval = setInterval(() => {
        // Jangan refresh saat modal terbuka agar input form tidak hilang
        if (document.getElementById('modal').classList.contains('active')) return;

        // PERBAIKAN: hanya render ulang kalau data benar-benar berubah.
        // Sebelumnya halaman dirender ulang tiap 2 detik sehingga dropdown
        // pilihan Helpman selalu kembali ke pilihan pertama.
        const snap = getSnapshot();
        if (snap === lastSnapshot) return;
        lastSnapshot = snap;

        if (['dashboard', 'order', 'riwayat', 'order_saya', 'penghasilan', 'helpman'].includes(pageId)) {
            const container = document.getElementById('dashboard-content');

            // Simpan pilihan dropdown agar tidak ter-reset
            const selected = {};
            container.querySelectorAll('select').forEach(s => { if (s.id) selected[s.id] = s.value; });
            const scrollY = window.scrollY;

            renderContent(container, pageId);

            Object.keys(selected).forEach(id => {
                const el = document.getElementById(id);
                if (el && Array.from(el.options).some(op => op.value === selected[id])) el.value = selected[id];
            });
            window.scrollTo(0, scrollY);
        }
    }, 2000);
}

// --- UTILITAS ---
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = msg;
    toast.className = isError ? 'toast show error' : 'toast show';
    toast.querySelector('i').className = isError ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check';
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function openModal(title, htmlContent) { document.getElementById('modal-title').innerText = title; document.getElementById('modal-body').innerHTML = htmlContent; document.getElementById('modal').classList.add('active'); }
function closeModal() { clearInterval(chatInterval); document.getElementById('modal').classList.remove('active'); }
function formatRupiah(angka) {
    if (angka === null || angka === undefined || isNaN(angka)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}
function formatTanggal(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- AUTH & LANDING ---
function showLogin() { document.getElementById('landing-section').style.display = 'none'; document.getElementById('auth-section').style.display = 'flex'; document.body.style.overflow = 'auto'; }
function hideLogin() { document.getElementById('auth-section').style.display = 'none'; document.getElementById('landing-section').style.display = 'block'; document.body.style.overflow = 'auto'; }
function toggleMobileMenu() { const menu = document.getElementById('mobile-menu'); menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'; }

function toggleAuth(type) {
    document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = type === 'register' ? 'block' : 'none';
    document.getElementById('auth-title').innerText = type === 'login' ? "Selamat Datang" : "Buat Akun Baru";
    document.getElementById('auth-subtitle').innerText = type === 'login' ? "Silakan masuk untuk melanjutkan" : "Daftar untuk mulai menggunakan layanan";
}

function checkRoleForOTP() {
    const role = document.getElementById('reg-role').value;
    document.getElementById('otp-group').style.display = role === 'Helpman' ? 'block' : 'none';
    document.getElementById('reg-otp').required = role === 'Helpman';
}

function handleRegister(e) {
    e.preventDefault();
    let users = JSON.parse(localStorage.getItem('th_users'));
    const role = document.getElementById('reg-role').value;
    const username = document.getElementById('reg-username').value.trim().toLowerCase();
    const otp = document.getElementById('reg-otp').value;

    if (users.find(u => u.username === username)) return showToast("Username sudah dipakai!", true);
    if (role === 'Helpman') {
        if (!VALID_OTP_CODES.includes(otp)) return showToast("Kode OTP tidak valid!", true);
        VALID_OTP_CODES.splice(VALID_OTP_CODES.indexOf(otp), 1);
    }

    users.push({
        name: document.getElementById('reg-name').value,
        username: username, password: document.getElementById('reg-password').value, role: role,
        status: role === 'Helpman' ? 'OFFLINE' : 'ACTIVE'
    });
    localStorage.setItem('th_users', JSON.stringify(users));
    showToast("Registrasi Berhasil! Silakan Login.");
    toggleAuth('login');
}

function handleLogin(e) {
    e.preventDefault();
    let users = JSON.parse(localStorage.getItem('th_users'));
    const roleInput = document.getElementById('login-role').value;
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('login-password').value;

    const user = users.find(u => u.username === usernameInput && u.password === passwordInput);
    if (!user) return showToast("Username atau Password salah!", true);
    if (user.role !== roleInput) return showToast(`Akun terdaftar sebagai ${user.role}.`, true);

    sessionStorage.setItem('th_session', JSON.stringify(user));
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('landing-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'flex';
    initDashboard(user);
}

function logout() {
    clearInterval(refreshInterval);
    clearInterval(notifInterval);
    clearInterval(chatInterval);
    sessionStorage.removeItem('th_session');
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('landing-section').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    toggleAuth('login');
    window.scrollTo(0, 0);
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

// --- INIT DASHBOARD ---
let currentUser = null;

function initDashboard(user) {
    currentUser = user;
    document.getElementById('header-user').innerHTML = `${user.name} <i class="fa-solid fa-chevron-down" style="font-size:12px; margin-left:5px;"></i>`;
    document.getElementById('header-branch').innerText = user.wilayah ? `Cabang ${user.wilayah.toUpperCase()}` : 'Semua Cabang';
    renderSidebar(user.role);
    navigate('dashboard', 'Dashboard');
    startNotifWatcher();
}

function renderSidebar(role) {
    const menuContainer = document.getElementById('sidebar-menu');
    let menus = [];

    if (role === 'Pelanggan') {
        menus = [{ id: 'dashboard', icon: 'fa-home', text: 'Katalog' }, { id: 'riwayat', icon: 'fa-history', text: 'Riwayat Pesanan' }];
    } else if (role === 'Admin Cabang') {
        menus = [{ id: 'dashboard', icon: 'fa-home', text: 'Dashboard' }, { id: 'order', icon: 'fa-clipboard-list', text: 'Order Masuk' }, { id: 'helpman', icon: 'fa-users', text: 'Helpman' }];
    } else if (role === 'Helpman') {
        menus = [
            { id: 'dashboard', icon: 'fa-home', text: 'Dashboard' },
            { id: 'absensi', icon: 'fa-fingerprint', text: 'Absensi' },
            { id: 'order_saya', icon: 'fa-tasks', text: 'Order Saya' },
            { id: 'penghasilan', icon: 'fa-wallet', text: 'Penghasilan' }
        ];
    } else if (role === 'Finance') {
        menus = [{ id: 'dashboard', icon: 'fa-home', text: 'Dashboard' }, { id: 'rekap_gaji', icon: 'fa-money-bill-wave', text: 'Rekap Gaji' }];
    } else if (role === 'Head Admin') {
        menus = [{ id: 'dashboard', icon: 'fa-home', text: 'Dashboard' }, { id: 'laporan', icon: 'fa-chart-line', text: 'Laporan Operasional' }];
    }

    menuContainer.innerHTML = menus.map(m => `
        <a class="menu-item" id="menu-${m.id}" onclick="navigate('${m.id}', '${m.text}')">
            <i class="fa-solid ${m.icon}"></i> ${m.text}
        </a>
    `).join('');
}

// --- ROUTER ---
function navigate(pageId, title) {
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    const activeMenu = document.getElementById(`menu-${pageId}`);
    if (activeMenu) activeMenu.classList.add('active');

    document.getElementById('breadcrumb').innerText = `Beranda > ${title}`;

    const container = document.getElementById('dashboard-content');
    container.innerHTML = '';
    renderContent(container, pageId);
    startAutoUpdate(pageId);
}

function renderContent(container, pageId) {
    if (currentUser.role === 'Pelanggan') {
        if (pageId === 'dashboard') renderKatalog(container);
        if (pageId === 'riwayat') renderRiwayatPelanggan(container);
    } else if (currentUser.role === 'Admin Cabang') {
        if (pageId === 'dashboard') renderDashboardAdmin(container);
        if (pageId === 'order') renderAdminOrder(container);
        if (pageId === 'helpman') renderAdminHelpman(container);
    } else if (currentUser.role === 'Helpman') {
        if (pageId === 'dashboard') renderDashboardHelpman(container);
        if (pageId === 'order_saya') renderHelpmanOrder(container);
        if (pageId === 'absensi') renderHelpmanAbsensi(container);
        if (pageId === 'penghasilan') renderHelpmanPenghasilan(container);
    } else if (currentUser.role === 'Finance') {
        if (pageId === 'dashboard') renderFinanceDashboard(container);
        if (pageId === 'rekap_gaji') renderFinanceRekap(container);
    } else if (currentUser.role === 'Head Admin') {
        if (pageId === 'dashboard') renderHeadAdminDashboard(container);
        if (pageId === 'laporan') renderHeadAdminLaporan(container);
    }
}

// ==========================================
// RENDER HALAMAN PELANGGAN
// ==========================================
function renderKatalog(container) {
    let html = `<div class="page-header"><h1>Katalog Layanan</h1><p class="text-muted">Pilih layanan yang Anda butuhkan. Tarif final disepakati dengan Helpman.</p></div>`;
    html += `<div class="service-grid">`;
    layananData.forEach(l => {
        html += `
            <div class="service-card">
                <div class="service-icon" style="background:${l.color}"><i class="fa-solid ${l.icon}"></i></div>
                <h3>${l.nama}</h3>
                <div class="price-tag">${l.pricelist}</div>
                <button class="btn btn-primary btn-sm" style="margin-top:auto;" onclick="openPesanModal('${l.id}')">Pesan Sekarang</button>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderRiwayatPelanggan(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.pelanggan === currentUser.username);

    let tableHtml = `<div class="table-wrapper"><table>
        <tr><th>ID Order</th><th>Tanggal</th><th>Layanan</th><th>Tujuan</th><th>Status</th><th>Total Tarif</th><th>Helpman</th><th>Chat</th></tr>`;

    if (orders.length === 0) {
        tableHtml += `<tr><td colspan="8" style="text-align:center;">Belum ada pesanan</td></tr>`;
    } else {
        orders.forEach(o => {
            let badge = o.status === 'Menunggu Admin' ? 'badge-warning' : (o.status === 'Selesai' ? 'badge-success' : 'badge-info');
            let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
            let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

            tableHtml += `<tr>
                <td><strong>#${idPendek}</strong></td>
                <td>${tgl}</td>
                <td>${o.layanan || '-'}</td>
                <td>${o.lokasiTujuan || '-'}</td>
                <td><span class="badge ${badge}">${o.status || '-'}</span></td>
                <td>${o.totalAkhir ? formatRupiah(o.totalAkhir) : (o.total ? formatRupiah(o.total) : 'Menunggu Konfirmasi')}</td>
                <td>${o.helpman ? `<strong>${escapeHtml(namaUser(o.helpman))}</strong>` : '<span class="text-muted">Belum ditugaskan</span>'}</td>
                <td>${tombolChat(o)}</td>
            </tr>`;
        });
    }
    tableHtml += `</table></div>`;

    if (container.querySelector('.page-header') === null) {
        container.innerHTML = `<div class="page-header"><h1>Riwayat Pesanan</h1></div>` + tableHtml;
    } else {
        container.querySelector('.table-wrapper').outerHTML = tableHtml;
    }
}

function openPesanModal(layananId) {
    const layanan = layananData.find(l => l.id === layananId);
    let html = `
        <form onsubmit="prosesPesanan(event, '${layananId}')">
            <div class="info-box"><strong>${layanan.nama}</strong><br>Pricelist: ${layanan.pricelist}</div>
            <div class="form-row">
                <div class="input-group"><label>Nama Lengkap</label><input type="text" id="pesan-nama" required></div>
                <div class="input-group"><label>No. WhatsApp</label><input type="tel" id="pesan-wa" required></div>
            </div>
            <div class="input-group">
                <label>Pilih Cabang</label>
                <select id="pesan-cabang" required style="width:100%; padding:12px; border-radius:10px; border:1px solid #ccc;">
                    <option value="" disabled selected>-- Pilih Cabang --</option>
                    <option value="malang">Malang</option>
                    <option value="jember">Jember</option>
                </select>
            </div>
            <div class="form-row">
                <div class="input-group"><label>Lokasi Jemput</label><input type="text" id="pesan-jemput" required></div>
                <div class="input-group"><label>Lokasi Tujuan</label><input type="text" id="pesan-tujuan" required></div>
            </div>
            <div class="input-group"><label>Kebutuhan / Detail</label><textarea id="pesan-kebutuhan" rows="3" required></textarea></div>
            <button type="submit" class="btn btn-primary">Kirim Pesanan</button>
        </form>
    `;
    openModal(`Form Pemesanan: ${layanan.nama}`, html);
}

function prosesPesanan(e, layananId) {
    e.preventDefault();
    const layanan = layananData.find(l => l.id === layananId);
    let orders = JSON.parse(localStorage.getItem('th_orders'));

    if (!currentUser || !currentUser.username) {
        return showToast("Sesi login habis, silakan login ulang.", true);
    }

    orders.push({
        id: 'ORD-' + Date.now(),
        pelanggan: currentUser.username,
        namaPelanggan: document.getElementById('pesan-nama').value,
        waPelanggan: document.getElementById('pesan-wa').value,
        layanan: layanan.nama,
        wilayah: document.getElementById('pesan-cabang').value,
        lokasiJemput: document.getElementById('pesan-jemput').value,
        lokasiTujuan: document.getElementById('pesan-tujuan').value,
        kebutuhan: document.getElementById('pesan-kebutuhan').value,
        status: 'Menunggu Admin',
        waktuPesan: new Date().toISOString(),
        helpman: null,
        total: null
    });

    localStorage.setItem('th_orders', JSON.stringify(orders));
    closeModal();
    showToast("Pesanan Berhasil!");
    navigate('riwayat', 'Riwayat Pesanan');
}

// ==========================================
// RENDER HALAMAN ADMIN CABANG
// ==========================================
function renderDashboardAdmin(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.wilayah === currentUser.wilayah);
    let helpmans = JSON.parse(localStorage.getItem('th_users')).filter(u => u.role === 'Helpman');
    let readyCount = helpmans.filter(h => h.status === 'READY').length;
    let pendingOrders = orders.filter(o => o.status === 'Menunggu Admin').length;

    let html = `
        <div class="page-header"><h1>Ringkasan Hari Ini</h1></div>
        <div class="grid-stats">
            <div class="stat-card"><h3>Order Baru</h3><div class="value">${pendingOrders}</div></div>
            <div class="stat-card"><h3>Helpman Ready</h3><div class="value green">${readyCount}</div></div>
            <div class="stat-card"><h3>Menunggu Validasi</h3><div class="value orange">${orders.filter(o => o.status === 'Menunggu Validasi').length}</div></div>
        </div>
        <h2 class="section-title" style="margin-bottom:15px; font-size:18px;">Order Terbaru</h2>
        <div class="table-wrapper"><table><tr><th>ID Order</th><th>Tanggal</th><th>Pelanggan</th><th>Layanan</th><th>Status</th></tr>
    `;
    orders.slice(0, 5).forEach(o => {
        let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';
        html += `<tr>
            <td>#${idPendek}</td>
            <td>${tgl}</td>
            <td>${o.namaPelanggan || '-'}</td>
            <td>${o.layanan || '-'}</td>
            <td><span class="badge badge-info">${o.status || '-'}</span></td>
        </tr>`;
    });
    if (orders.length === 0) html += `<tr><td colspan="5" style="text-align:center;">Belum ada order.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

function renderAdminOrder(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.wilayah === currentUser.wilayah);
    let helpmans = JSON.parse(localStorage.getItem('th_users')).filter(u => u.role === 'Helpman');

    let tableHtml = `<div class="table-wrapper"><table><tr><th>ID Order</th><th>Pelanggan</th><th>Layanan & Rute</th><th>Status</th><th>Aksi</th></tr>`;

    orders.forEach(o => {
        let aksi = '';
        if (o.status === 'Menunggu Admin') {
            aksi = `<button class="btn btn-primary btn-sm" onclick="terimaOrder('${o.id}')">Terima & Tentukan Tarif</button>`;
        } else if (o.status === 'Mencari Helpman') {
            let readyHelpman = helpmans.filter(h => h.status === 'READY');
            if (readyHelpman.length > 0) {
                aksi = `<div style="display:flex; gap:5px;">
                            <select id="select-hm-${o.id}" style="padding:8px; border-radius:8px; border:1px solid var(--border); font-size:13px;">
                                ${readyHelpman.map(h => `<option value="${h.username}">${h.name}</option>`).join('')}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="tugaskanHelpman('${o.id}')">Tugaskan</button>
                        </div>`;
            } else {
                aksi = `<span style="color:var(--danger); font-size:12px;">Helpman tidak tersedia</span>`;
            }
        } else if (o.status === 'Menunggu Validasi') {
            aksi = `<button class="btn btn-primary btn-sm" onclick="lihatBuktiValidasi('${o.id}')">Cek & Validasi</button>`;
        } else if (o.status === 'Selesai') {
            aksi = `<span class="badge badge-success">Selesai</span>`;
        } else {
            aksi = `<span class="badge badge-info">${o.status}</span>`;
        }

        let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

        tableHtml += `<tr>
            <td><strong>#${idPendek}</strong><br><small>${tgl}</small></td>
            <td>${o.namaPelanggan || '-'}<br><small>${o.waPelanggan || '-'}</small></td>
            <td><strong>${o.layanan || '-'}</strong><br><small>${o.lokasiJemput || '-'} <i class="fa-solid fa-arrow-right"></i> ${o.lokasiTujuan || '-'}</small></td>
            <td><span class="badge badge-info">${o.status || '-'}</span></td>
            <td>${aksi}</td>
        </tr>`;
    });
    if (orders.length === 0) tableHtml += `<tr><td colspan="5" style="text-align:center;">Belum ada order masuk.</td></tr>`;
    tableHtml += `</table></div>`;

    if (container.querySelector('.page-header') === null) {
        container.innerHTML = `<div class="page-header"><h1>Order Masuk</h1><p class="text-muted">Kelola pesanan untuk Cabang ${currentUser.wilayah.toUpperCase()}</p></div>` + tableHtml;
    } else {
        container.querySelector('.table-wrapper').outerHTML = tableHtml;
    }
}

function renderAdminHelpman(container) {
    let helpmans = JSON.parse(localStorage.getItem('th_users')).filter(u => u.role === 'Helpman');
    let html = `<div class="page-header"><h1>Data Helpman</h1></div>`;
    html += `<div class="table-wrapper"><table><tr><th>Nama Lengkap</th><th>Username</th><th>Status</th><th>Total Order Selesai</th></tr>`;

    helpmans.forEach(h => {
        let ordersHelpman = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.helpman === h.username && o.status === 'Selesai');
        let badge = h.status === 'READY' ? 'badge-success' : 'badge-danger';
        html += `<tr>
            <td>${h.name || '-'}</td>
            <td>@${h.username || '-'}</td>
            <td><span class="badge ${badge}">${h.status || 'OFFLINE'}</span></td>
            <td>${ordersHelpman.length} Order</td>
        </tr>`;
    });
    if (helpmans.length === 0) html += `<tr><td colspan="4" style="text-align:center;">Belum ada Helpman terdaftar.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

function terimaOrder(id) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let o = orders.find(x => x.id === id);
    let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

    let html = `
        <form onsubmit="prosesTerimaOrder(event, '${id}')">
            <div class="info-box">
                <strong>Order #${idPendek}</strong><br>
                Layanan: ${o.layanan}<br>
                Kebutuhan: ${o.kebutuhan}<br>
                Rute: ${o.lokasiJemput} ke ${o.lokasiTujuan}
            </div>
            <div class="input-group"><label>Konfirmasi Tarif Dasar (Rp)</label><input type="number" id="tarif-dasar" required min="0"></div>
            <div class="input-group"><label>Catatan untuk Helpman</label><input type="text" id="catatan-admin" placeholder="Contoh: Barang rapuh"></div>
            <button type="submit" class="btn btn-primary">Konfirmasi Tarif & Lanjut Tugaskan</button>
        </form>
    `;
    openModal("Terima Order", html);
}

function prosesTerimaOrder(e, id) {
    e.preventDefault();
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let idx = orders.findIndex(o => o.id === id);
    orders[idx].total = parseInt(document.getElementById('tarif-dasar').value);
    orders[idx].catatanAdmin = document.getElementById('catatan-admin').value;
    orders[idx].status = 'Mencari Helpman';
    localStorage.setItem('th_orders', JSON.stringify(orders));
    closeModal();
    showToast("Order diterima.");
    navigate('order', 'Order Masuk');
}

function tugaskanHelpman(id) {
    const helpmanUsername = document.getElementById(`select-hm-${id}`).value;
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let idx = orders.findIndex(o => o.id === id);
    orders[idx].status = 'Dikerjakan';
    orders[idx].helpman = helpmanUsername;
    localStorage.setItem('th_orders', JSON.stringify(orders));

    // Notifikasi ke pelanggan & helpman
    const o = orders[idx];
    const namaHm = namaUser(helpmanUsername);
    tambahNotif(o.pelanggan, `Pesanan #${kodeOrder(o)} (${o.layanan}) dibantu oleh Helpman ${namaHm}. Anda sekarang bisa chat dengan Helpman.`, o.id);
    tambahNotif(helpmanUsername, `Anda ditugaskan untuk pesanan #${kodeOrder(o)} (${o.layanan}) dari ${o.namaPelanggan}.`, o.id);
    showToast("Helpman ditugaskan!");
    navigate('order', 'Order Masuk');
}

function lihatBuktiValidasi(id) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let o = orders.find(x => x.id === id);
    let html = `
        <div class="info-box">
            <strong>Laporan Helpman:</strong><br>
            Catatan: <em>"${o.catatanHelpman || '-'}"</em><br>
            Tarif Akhir: <strong>${formatRupiah(o.totalAkhir)}</strong><br>
            Uang Belanja (Pinjaman): <strong>${o.pinjaman > 0 ? formatRupiah(o.pinjaman) : 'Tidak Ada'}</strong>
        </div>
        <div style="text-align:center; margin-bottom:20px;"><img src="${o.buktiFoto}" style="max-width:100%; border-radius:10px;"></div>
        <button class="btn btn-primary" onclick="validasiPekerjaan('${id}')">Validasi Selesai</button>
    `;
    openModal("Validasi Pekerjaan", html);
}

function validasiPekerjaan(id) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let idx = orders.findIndex(o => o.id === id);
    orders[idx].status = 'Selesai';
    localStorage.setItem('th_orders', JSON.stringify(orders));
    closeModal();
    showToast("Pekerjaan divalidasi.");
    navigate('order', 'Order Masuk');
}

// ==========================================
// RENDER HALAMAN HELPMAN
// ==========================================
function renderDashboardHelpman(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.helpman === currentUser.username);
    let statusSaatIni = currentUser.status || 'OFFLINE';

    let html = `
        <div class="page-header"><h1>Halo, ${currentUser.name}</h1><p class="text-muted">Status Anda: <span class="badge ${statusSaatIni === 'READY' ? 'badge-success' : 'badge-danger'}">${statusSaatIni}</span></p></div>
        <div class="grid-stats">
            <div class="stat-card"><h3>Kesiapan Menerima Order</h3>
                <button class="btn ${statusSaatIni === 'READY' ? 'btn-danger' : 'btn-primary'}" style="margin-top:10px;" onclick="aksiHelpman('${statusSaatIni === 'READY' ? 'OFFLINE' : 'READY'}')">
                    ${statusSaatIni === 'READY' ? 'Set Offline' : 'Set READY'}
                </button>
            </div>
        </div>
        <h2 class="section-title" style="margin-bottom:15px; font-size:18px;">Tugas Saya</h2>
        <div class="table-wrapper"><table><tr><th>ID Order</th><th>Tanggal</th><th>Layanan</th><th>Status</th><th>Aksi</th></tr>`;

    orders.slice(0, 3).forEach(o => {
        let aksi = `<div style="display:flex; gap:6px; flex-wrap:wrap;">` + (o.status === 'Dikerjakan' ? `<button class="btn btn-primary btn-sm" onclick="laporSelesai('${o.id}')">Update</button>` : `<span class="badge badge-success">${o.status}</span>`) + tombolChat(o) + `</div>`;
        let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

        html += `<tr>
            <td>#${idPendek}</td>
            <td>${tgl}</td>
            <td>${o.layanan || '-'}</td>
            <td><span class="badge badge-info">${o.status || '-'}</span></td>
            <td>${aksi}</td>
        </tr>`;
    });
    if (orders.length === 0) html += `<tr><td colspan="5" style="text-align:center;">Belum ada tugas.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

function renderHelpmanOrder(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.helpman === currentUser.username);

    let tableHtml = `<div class="table-wrapper"><table><tr><th>ID Order</th><th>Tanggal</th><th>Layanan & Rute</th><th>Catatan Admin</th><th>Status</th><th>Aksi</th></tr>`;
    orders.forEach(o => {
        let aksi = `<div style="display:flex; gap:6px; flex-wrap:wrap;">` + (o.status === 'Dikerjakan' ? `<button class="btn btn-primary btn-sm" onclick="laporSelesai('${o.id}')">Lapor Selesai</button>` : `<span class="badge badge-success">${o.status}</span>`) + tombolChat(o) + `</div>`;
        let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

        tableHtml += `<tr>
            <td>#${idPendek}</td>
            <td>${tgl}</td>
            <td><strong>${o.layanan || '-'}</strong><br><small>${o.lokasiJemput || '-'} <i class="fa-solid fa-arrow-right"></i> ${o.lokasiTujuan || '-'}</small></td>
            <td>${o.catatanAdmin || '-'}</td>
            <td><span class="badge badge-info">${o.status || '-'}</span></td>
            <td>${aksi}</td>
        </tr>`;
    });
    if (orders.length === 0) tableHtml += `<tr><td colspan="6" style="text-align:center;">Belum ada tugas.</td></tr>`;
    tableHtml += `</table></div>`;

    if (container.querySelector('.page-header') === null) {
        container.innerHTML = `<div class="page-header"><h1>Order Saya</h1></div>` + tableHtml;
    } else {
        container.querySelector('.table-wrapper').outerHTML = tableHtml;
    }
}

function renderHelpmanAbsensi(container) {
    let absensi = JSON.parse(localStorage.getItem('th_absensi')).filter(a => a.username === currentUser.username);
    let isAbsenHariIni = absensi.some(a => new Date(a.tanggal).toDateString() === new Date().toDateString() && a.tipe === 'MASUK');

    let html = `<div class="page-header"><h1>Absensi Harian</h1></div>`;
    html += `<div class="grid-stats">
        <div class="stat-card" style="text-align:center;">
            <h3>Absen Masuk</h3>
            <button class="btn btn-primary" style="margin-top:10px;${isAbsenHariIni ? ' opacity:0.5;' : ''}" onclick="absen('MASUK')" ${isAbsenHariIni ? 'disabled' : ''}>CHECK-IN</button>
        </div>
        <div class="stat-card" style="text-align:center;">
            <h3>Absen Pulang</h3>
            <button class="btn btn-warning" style="margin-top:10px;${!isAbsenHariIni ? ' opacity:0.5;' : ''}" onclick="absen('PULANG')" ${!isAbsenHariIni ? 'disabled' : ''}>CHECK-OUT</button>
        </div>
    </div>
    <h2 class="section-title" style="margin-bottom:15px; font-size:18px;">Riwayat Absensi</h2>
    <div class="table-wrapper"><table><tr><th>Tanggal & Waktu</th><th>Tipe</th></tr>`;
    absensi.forEach(a => {
        html += `<tr><td>${formatTanggal(a.tanggal)}</td><td><span class="badge ${a.tipe === 'MASUK' ? 'badge-success' : 'badge-warning'}">${a.tipe}</span></td></tr>`;
    });
    if (absensi.length === 0) html += `<tr><td colspan="2" style="text-align:center;">Belum ada riwayat absensi.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

function renderHelpmanPenghasilan(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.helpman === currentUser.username && o.isPaid);

    let totalBulanIni = 0;
    let html = `<div class="page-header"><h1>Dashboard Penghasilan</h1><p class="text-muted">Rekap upah Anda yang sudah dibayar oleh Finance (Transparan).</p></div>`;

    orders.forEach(o => { totalBulanIni += (o.upahBersih + o.pinjaman); });

    html += `<div class="grid-stats">
        <div class="stat-card"><h3>Total Pendapatan Bersih (Inc. Reimburse)</h3><div class="value green">${formatRupiah(totalBulanIni)}</div></div>
        <div class="stat-card"><h3>Status Gaji</h3><div class="value" style="font-size:18px; color:var(--primary);">Dibayar / Lunas</div></div>
    </div>`;

    html += `<h2 class="section-title" style="margin-bottom:15px; font-size:18px;">Rincian Penghasilan</h2>`;
    html += `<div class="table-wrapper"><table>
        <tr>
            <th>ID Order</th>
            <th>Tanggal</th>
            <th>Layanan</th>
            <th>Tarif Layanan</th>
            <th>Reimburse Pinjaman</th>
            <th>Skema</th>
            <th>Total Diterima</th>
        </tr>`;

    if (orders.length === 0) {
        html += `<tr><td colspan="7" style="text-align:center;">Belum ada riwayat pembayaran.</td></tr>`;
    } else {
        orders.forEach(o => {
            let skema = o.tipeBagiHasil === 'tim' ? '80 : 20' : '70 : 30';
            let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
            let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

            html += `<tr>
                <td><strong>#${idPendek}</strong></td>
                <td>${tgl}</td>
                <td>${o.layanan || '-'}</td>
                <td>${formatRupiah(o.totalAkhir)}</td>
                <td style="color:var(--success);">+ ${formatRupiah(o.pinjaman)}</td>
                <td><span class="badge badge-info">${o.tipeBagiHasil === 'tim' ? 'Tim' : 'Individu'}</span> (${skema})</td>
                <td style="color:var(--success); font-weight:bold;">${formatRupiah(o.upahBersih + o.pinjaman)}</td>
            </tr>`;
        });
    }
    html += `</table></div>`;
    container.innerHTML = html;
}

function aksiHelpman(newStatus) {
    let users = JSON.parse(localStorage.getItem('th_users'));
    let idx = users.findIndex(u => u.username === currentUser.username);
    users[idx].status = newStatus;
    localStorage.setItem('th_users', JSON.stringify(users));
    currentUser.status = newStatus;
    sessionStorage.setItem('th_session', JSON.stringify(currentUser));
    showToast(`Status: ${newStatus}`);
    navigate('dashboard', 'Dashboard');
}

function absen(tipe) {
    let absensi = JSON.parse(localStorage.getItem('th_absensi'));
    absensi.push({ username: currentUser.username, tanggal: new Date().toISOString(), tipe: tipe });
    localStorage.setItem('th_absensi', JSON.stringify(absensi));
    showToast(`Absen ${tipe} berhasil!`);
    navigate('absensi', 'Absensi');
}

function laporSelesai(id) {
    let html = `
        <form onsubmit="prosesLaporSelesai(event, '${id}')">
            <div class="input-group"><label>Nominal Tarif Akhir Layanan (Rp)</label><input type="number" id="lapor-tarif-akhir" required min="0"></div>
            <div class="input-group">
                <label>Uang Belanja Customer yang Anda Pinjam (Rp)</label>
                <input type="number" id="lapor-pinjaman" min="0" placeholder="0">
                <small style="color:var(--text-muted); font-size:11px; display:block; margin-top:5px;">*Uang ini akan dikembalikan utuh oleh To Help kepada Anda, bukan dipotong.</small>
            </div>
            <div class="input-group"><label>Catatan Pekerjaan</label><textarea id="lapor-catatan" rows="2" required></textarea></div>
            <div class="input-group"><label>Upload Bukti Foto</label>
                <div class="file-upload" onclick="document.getElementById('lapor-foto').click()">
                    <i class="fa-solid fa-cloud-upload-alt"></i><span id="file-name-display">Klik untuk upload foto</span>
                    <input type="file" id="lapor-foto" accept="image/*" required onchange="document.getElementById('file-name-display').innerText = this.files[0].name">
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Kirim Laporan</button>
        </form>
    `;
    openModal("Lapor Penyelesaian", html);
}

function prosesLaporSelesai(e, id) {
    e.preventDefault();
    const fileInput = document.getElementById('lapor-foto');
    const tarifAkhir = parseInt(document.getElementById('lapor-tarif-akhir').value);
    const pinjaman = parseInt(document.getElementById('lapor-pinjaman').value) || 0;
    const catatan = document.getElementById('lapor-catatan').value;
    if (fileInput.files.length === 0) return showToast("Upload bukti foto!", true);

    const reader = new FileReader();
    reader.onload = function () {
        let orders = JSON.parse(localStorage.getItem('th_orders'));
        let idx = orders.findIndex(o => o.id === id);
        orders[idx].status = 'Menunggu Validasi';
        orders[idx].totalAkhir = tarifAkhir;
        orders[idx].pinjaman = pinjaman;
        orders[idx].catatanHelpman = catatan;
        orders[idx].buktiFoto = reader.result;
        localStorage.setItem('th_orders', JSON.stringify(orders));
        closeModal(); showToast("Laporan dikirim."); navigate('order_saya', 'Order Saya');
    };
    reader.readAsDataURL(fileInput.files[0]);
}

// ==========================================
// RENDER HALAMAN FINANCE
// ==========================================
function renderFinanceDashboard(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.status === 'Selesai' && !o.isPaid);
    let totalTagihan = orders.reduce((sum, o) => sum + o.totalAkhir + o.pinjaman, 0);

    let html = `<div class="page-header"><h1>Ringkasan Keuangan</h1></div>`;
    html += `<div class="grid-stats">
        <div class="stat-card"><h3>Tagihan Menunggu Pembayaran</h3><div class="value orange">${orders.length} Order</div></div>
        <div class="stat-card"><h3>Total Dana Disiapkan (Tarif + Reimburse)</h3><div class="value">${formatRupiah(totalTagihan)}</div></div>
    </div>`;
    html += `<p class="text-muted">Silakan buka menu Rekap Gaji untuk memproses pembayaran.</p>`;
    container.innerHTML = html;
}

function renderFinanceRekap(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders')).filter(o => o.status === 'Selesai' && !o.isPaid);

    let html = `<div class="page-header"><h1>Rekap Gaji & Pembayaran</h1></div>`;
    html += `<div class="table-wrapper"><table>
        <tr>
            <th>ID Order</th>
            <th>Nama Helpman</th>
            <th>Layanan</th>
            <th>Tarif Akhir</th>
            <th>Reimburse Pinjaman</th>
            <th>Total Transfer</th>
            <th>Aksi</th>
        </tr>`;

    orders.forEach(o => {
        let helpmanData = JSON.parse(localStorage.getItem('th_users')).find(u => u.username === o.helpman);
        let namaHelpman = helpmanData ? helpmanData.name : (o.helpman || '-');
        let totalTransferKeHelpman = o.totalAkhir + o.pinjaman;
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

        html += `<tr>
            <td><strong>#${idPendek}</strong></td>
            <td>${namaHelpman}</td>
            <td>${o.layanan || '-'}</td>
            <td>${formatRupiah(o.totalAkhir)}</td>
            <td style="color:var(--success);">+ ${formatRupiah(o.pinjaman)}</td>
            <td style="color:var(--primary); font-weight:bold;">${formatRupiah(totalTransferKeHelpman)}</td>
            <td><button class="btn btn-primary btn-sm" onclick="pilihTipePembayaran('${o.id}')">Proses</button></td>
        </tr>`;
    });
    if (orders.length === 0) html += `<tr><td colspan="7" style="text-align:center;">Tidak ada tagihan tertunda.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

function pilihTipePembayaran(id) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let o = orders.find(x => x.id === id);
    let totalTransfer = o.totalAkhir + o.pinjaman;

    let html = `
        <form onsubmit="prosesPembayaran(event, '${id}')">
            <div class="info-box">
                Tarif Layanan: <strong>${formatRupiah(o.totalAkhir)}</strong><br>
                Reimburse Pinjaman: <strong>+ ${formatRupiah(o.pinjaman)}</strong><br>
                <hr style="margin: 10px 0; border: 0; border-top: 1px solid rgba(0,0,0,0.1);">
                <strong>Total Transfer ke Helpman: ${formatRupiah(totalTransfer)}</strong>
            </div>
            <div class="input-group">
                <label>Pilih Tipe Pekerjaan (Bagi Hasil dari Tarif Layanan):</label>
                <div class="radio-group">
                    <label class="radio-label"><input type="radio" name="tipe-bagi" value="individu" checked onchange="updatePreviewBagi('${id}', 'individu', ${o.totalAkhir}, ${o.pinjaman})"> Individu (70:30)</label>
                    <label class="radio-label"><input type="radio" name="tipe-bagi" value="tim" onchange="updatePreviewBagi('${id}', 'tim', ${o.totalAkhir}, ${o.pinjaman})"> Tim (80:20)</label>
                </div>
            </div>
            <div class="info-box" id="preview-bagi" style="background:#f0fdf4; border-color:var(--success); color:#065f46;">
                <div>Pendapatan TO HELP: <strong>${formatRupiah(o.totalAkhir * 0.3)}</strong></div>
                <div>Upah Bersih Helpman: <strong>${formatRupiah(o.totalAkhir * 0.7)}</strong></div>
                <div style="margin-top: 5px; border-top: 1px dashed #10b981; padding-top: 5px;">Total Uang Diterima Helpman: <strong>${formatRupiah((o.totalAkhir * 0.7) + o.pinjaman)}</strong></div>
            </div>
            <button type="submit" class="btn btn-primary">Konfirmasi Pembayaran</button>
        </form>
    `;
    openModal("Proses Pembayaran", html);
}

function updatePreviewBagi(id, tipe, totalAkhir, pinjaman) {
    let porsiHelpman = tipe === 'tim' ? 0.8 : 0.7;
    let porsiTH = tipe === 'tim' ? 0.2 : 0.3;

    document.getElementById('preview-bagi').innerHTML = `
        <div>Pendapatan TO HELP: <strong>${formatRupiah(totalAkhir * porsiTH)}</strong></div>
        <div>Upah Bersih Helpman: <strong>${formatRupiah(totalAkhir * porsiHelpman)}</strong></div>
        <div style="margin-top: 5px; border-top: 1px dashed #10b981; padding-top: 5px;">Total Uang Diterima Helpman: <strong>${formatRupiah((totalAkhir * porsiHelpman) + pinjaman)}</strong></div>
    `;
}

function prosesPembayaran(e, id) {
    e.preventDefault();
    const tipe = document.querySelector('input[name="tipe-bagi"]:checked').value;
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let idx = orders.findIndex(o => o.id === id);
    let o = orders[idx];

    o.isPaid = true; o.tipeBagiHasil = tipe;
    o.upahBersih = tipe === 'tim' ? o.totalAkhir * 0.8 : o.totalAkhir * 0.7;
    o.pendapatanTH = tipe === 'tim' ? o.totalAkhir * 0.2 : o.totalAkhir * 0.3;
    o.totalTransfer = o.upahBersih + o.pinjaman;

    localStorage.setItem('th_orders', JSON.stringify(orders));
    closeModal(); showToast("Pembayaran Berhasil!"); navigate('rekap_gaji', 'Rekap Gaji');
}

// ==========================================
// RENDER HALAMAN HEAD ADMIN
// ==========================================
function renderHeadAdminDashboard(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let totalSelesai = orders.filter(o => o.status === 'Selesai').length;
    let totalPendapatan = orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.pendapatanTH, 0);

    let html = `<div class="page-header"><h1>Executive Summary</h1></div>
        <div class="grid-stats">
            <div class="stat-card"><h3>Total Order Masuk</h3><div class="value">${orders.length}</div></div>
            <div class="stat-card"><h3>Order Selesai</h3><div class="value green">${totalSelesai}</div></div>
            <div class="stat-card"><h3>Pendapatan Perusahaan</h3><div class="value">${formatRupiah(totalPendapatan)}</div></div>
        </div>`;
    container.innerHTML = html;
}

function renderHeadAdminLaporan(container) {
    let orders = JSON.parse(localStorage.getItem('th_orders'));
    let html = `<div class="page-header"><h1>Laporan Operasional</h1><p class="text-muted">Data seluruh cabang (Malang & Jember)</p></div>`;
    html += `<div class="table-wrapper"><table>
        <tr><th>ID Order</th><th>Tanggal</th><th>Layanan</th><th>Cabang</th><th>Status</th><th>Nama Helpman</th></tr>`;

    orders.forEach(o => {
        let helpmanData = JSON.parse(localStorage.getItem('th_users')).find(u => u.username === o.helpman);
        let namaHelpman = helpmanData ? helpmanData.name : (o.helpman || '-');
        let tgl = o.waktuPesan ? formatTanggal(o.waktuPesan) : '-';
        let idPendek = o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX';

        html += `<tr>
            <td>#${idPendek}</td>
            <td>${tgl}</td>
            <td>${o.layanan || '-'}</td>
            <td>${o.wilayah ? o.wilayah.toUpperCase() : '-'}</td>
            <td><span class="badge badge-info">${o.status || '-'}</span></td>
            <td>${namaHelpman}</td>
        </tr>`;
    });
    if (orders.length === 0) html += `<tr><td colspan="6" style="text-align:center;">Belum ada data order.</td></tr>`;
    html += `</table></div>`;
    container.innerHTML = html;
}

// ==========================================
// CHAT PELANGGAN <-> HELPMAN & NOTIFIKASI
// ==========================================
let chatInterval = null;
let notifInterval = null;
let lastNotifCount = 0;

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function kodeOrder(o) { return o.id ? o.id.split('-')[1].slice(-5) : 'XXXXX'; }
function namaUser(username) {
    const u = getData('th_users').find(x => x.username === username);
    return u ? u.name : (username || '-');
}
function escapeHtml(str) {
    return String(str === null || str === undefined ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function formatJam(iso) {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function tambahNotif(to, text, orderId) {
    const notifs = getData('th_notifs');
    notifs.push({
        id: 'N-' + Date.now() + Math.random().toString(36).slice(2, 6),
        to: to, text: text, orderId: orderId,
        time: new Date().toISOString(), read: false
    });
    setData('th_notifs', notifs);
}

// Tombol chat di tabel (muncul setelah helpman ditugaskan)
function tombolChat(o) {
    if (!o.helpman) return '<span class="text-muted">-</span>';
    const unread = getData('th_chats').filter(m => m.orderId === o.id && m.to === currentUser.username && !m.read).length;
    return `<button class="btn btn-primary btn-sm" onclick="openChat('${o.id}')"><i class="fa-solid fa-comments"></i> Chat${unread ? ` <span class="chat-badge">${unread}</span>` : ''}</button>`;
}

// --- Notifikasi (ikon lonceng) ---
function getPesanBelumDibaca() {
    // Dikelompokkan per order
    const grup = {};
    getData('th_chats').filter(m => m.to === currentUser.username && !m.read).forEach(m => {
        grup[m.orderId] = grup[m.orderId] || { orderId: m.orderId, from: m.from, jumlah: 0, time: m.time };
        grup[m.orderId].jumlah++;
        grup[m.orderId].time = m.time;
    });
    return Object.values(grup);
}

function updateNotifBadge() {
    if (!currentUser) return;
    const unreadNotif = getData('th_notifs').filter(n => n.to === currentUser.username && !n.read).length;
    const total = unreadNotif + getPesanBelumDibaca().length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }
    if (total > lastNotifCount) showToast('Ada notifikasi baru!');
    lastNotifCount = total;
}

function startNotifWatcher() {
    clearInterval(notifInterval);
    lastNotifCount = 0;
    updateNotifBadge();
    notifInterval = setInterval(updateNotifBadge, 2000);
}

function openNotifications() {
    const notifs = getData('th_notifs').filter(n => n.to === currentUser.username).reverse();
    const pesan = getPesanBelumDibaca();
    let html = '';

    pesan.forEach(p => {
        html += `<div class="notif-item unread">
            <div><i class="fa-solid fa-comment-dots" style="color:var(--primary);"></i> <strong>${p.jumlah} pesan baru</strong> dari ${escapeHtml(namaUser(p.from))}
            <br><small>${formatTanggal(p.time)}</small></div>
            <button class="btn btn-primary btn-sm" onclick="closeModal(); openChat('${p.orderId}')">Buka Chat</button>
        </div>`;
    });

    notifs.slice(0, 20).forEach(n => {
        const orders = getData('th_orders');
        const o = orders.find(x => x.id === n.orderId);
        const bisaChat = o && o.helpman;
        html += `<div class="notif-item ${n.read ? '' : 'unread'}">
            <div><i class="fa-solid fa-bell" style="color:var(--warning);"></i> ${escapeHtml(n.text)}
            <br><small>${formatTanggal(n.time)}</small></div>
            ${bisaChat ? `<button class="btn btn-primary btn-sm" onclick="closeModal(); openChat('${n.orderId}')">Chat</button>` : ''}
        </div>`;
    });

    if (!html) html = `<p class="text-muted" style="text-align:center; padding:20px;">Belum ada notifikasi.</p>`;
    openModal('Notifikasi', html);

    // Tandai notifikasi sudah dibaca
    const all = getData('th_notifs');
    all.forEach(n => { if (n.to === currentUser.username) n.read = true; });
    setData('th_notifs', all);
    updateNotifBadge();
}

// --- Chat ---
function openChat(orderId) {
    const o = getData('th_orders').find(x => x.id === orderId);
    if (!o || !o.helpman) return showToast('Chat tersedia setelah Helpman ditugaskan.', true);

    const isPelanggan = currentUser.username === o.pelanggan;
    const lawanUsername = isPelanggan ? o.helpman : o.pelanggan;
    const lawanNama = isPelanggan ? namaUser(o.helpman) : (o.namaPelanggan || namaUser(o.pelanggan));
    const labelLawan = isPelanggan ? 'Helpman Anda' : 'Pelanggan';

    const html = `
        <div class="info-box" style="margin-bottom:12px;">
            <strong>${escapeHtml(labelLawan)}: ${escapeHtml(lawanNama)}</strong><br>
            Order #${kodeOrder(o)} - ${escapeHtml(o.layanan)}
        </div>
        <div class="chat-box" id="chat-box" data-count="-1"></div>
        <form class="chat-form" onsubmit="kirimChat(event, '${orderId}')">
            <input type="text" id="chat-input" placeholder="Tulis pesan..." autocomplete="off" required>
            <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
    `;
    openModal(`Chat dengan ${lawanNama}`, html);
    renderChatMessages(orderId);
    clearInterval(chatInterval);
    chatInterval = setInterval(() => renderChatMessages(orderId), 1500);
    setTimeout(() => { const i = document.getElementById('chat-input'); if (i) i.focus(); }, 100);
}

function renderChatMessages(orderId) {
    const box = document.getElementById('chat-box');
    if (!box) { clearInterval(chatInterval); return; }

    let chats = getData('th_chats');
    let berubah = false;
    chats.forEach(m => {
        if (m.orderId === orderId && m.to === currentUser.username && !m.read) { m.read = true; berubah = true; }
    });
    if (berubah) { setData('th_chats', chats); updateNotifBadge(); }

    const msgs = chats.filter(m => m.orderId === orderId);
    if (String(msgs.length) === box.dataset.count) return;
    box.dataset.count = msgs.length;

    if (msgs.length === 0) {
        box.innerHTML = `<p class="text-muted" style="text-align:center; margin-top:40px;">Belum ada pesan. Mulai percakapan sekarang.</p>`;
        return;
    }
    box.innerHTML = msgs.map(m => `
        <div class="chat-msg ${m.from === currentUser.username ? 'me' : 'other'}">
            <div class="chat-bubble">${escapeHtml(m.text)}</div>
            <small>${formatJam(m.time)}</small>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

function kirimChat(e, orderId) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const o = getData('th_orders').find(x => x.id === orderId);
    if (!o) return;
    const to = currentUser.username === o.pelanggan ? o.helpman : o.pelanggan;

    const chats = getData('th_chats');
    chats.push({
        id: 'C-' + Date.now() + Math.random().toString(36).slice(2, 6),
        orderId: orderId, from: currentUser.username, to: to,
        text: text, time: new Date().toISOString(), read: false
    });
    setData('th_chats', chats);

    input.value = '';
    input.focus();
    renderChatMessages(orderId);
}

// --- START APP ---
window.onload = () => {
    initDB();
    const session = sessionStorage.getItem('th_session');
    if (session) {
        const user = JSON.parse(session);
        document.getElementById('landing-section').style.display = 'none';
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'flex';
        initDashboard(user);
    }
};