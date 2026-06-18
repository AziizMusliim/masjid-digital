// ============================================
// MAIN APPLICATION MODULE
// Admin Panel Logic
// ============================================

const App = (() => {
    // DOM Elements
    let elements = {};

    // State
    let isLoggedIn = false;

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Check if already logged in
        const savedLogin = localStorage.getItem('isLoggedIn');
        if (savedLogin === 'true') {
            showMainApp();
        } else {
            showLoginPage();
        }

        // Setup login buttons
        setupLoginButtons();
    }

    // ============================================
    // LOGIN PAGE
    // ============================================
    function showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }

    function showMainApp() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        
        // Initialize main app elements
        elements = {
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            pageTitle: document.getElementById('pageTitle'),
            masjidSelect: document.getElementById('masjidSelect'),
            currentTime: document.getElementById('currentTime'),
            userName: document.getElementById('userName'),
            logoutBtn: document.getElementById('logoutBtn'),
            contentArea: document.getElementById('contentArea'),
            modal: document.getElementById('modal'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalContent: document.getElementById('modalContent'),
            toastContainer: document.getElementById('toastContainer'),
            navItems: document.querySelectorAll('.nav-item'),
            pages: document.querySelectorAll('.page')
        };

        // Setup main app
        setupEventListeners();
        updateTime();
        setInterval(updateTime, 1000);
        loadAppData();
    }

    function setupLoginButtons() {
        const btnGoogle = document.getElementById('btnGoogleLogin');
        const btnDemo = document.getElementById('btnDemoMode');

        if (btnGoogle) {
            btnGoogle.addEventListener('click', loginWithGoogle);
        }

        if (btnDemo) {
            btnDemo.addEventListener('click', loginAsDemo);
        }
    }

    function loginWithGoogle() {
        // Redirect to Apps Script auth URL
        const authUrl = API.getConfig().baseUrl + '?action=auth';
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginMode', 'google');
        window.location.href = authUrl;
    }

    function loginAsDemo() {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginMode', 'demo');
        showMainApp();
    }

    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginMode');
        window.location.reload();
    }

    // ============================================
    // LOAD APP DATA
    // ============================================
    async function loadAppData() {
        // Authenticate (demo mode if not google login)
        const loginMode = localStorage.getItem('loginMode');
        if (loginMode === 'google') {
            await API.authenticate();
        } else {
            API.setDemoMode();
        }
        
        // Load user info
        loadUserInfo();
        
        // Load masjids
        await loadMasjids();
        
        // Load dashboard
        await loadDashboard();
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        if (!elements.sidebar) return;

        // Sidebar toggle
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                navigateTo(page);
            });
        });
        
        // Masjid selection
        elements.masjidSelect.addEventListener('change', (e) => {
            const masjidId = e.target.value;
            API.setCurrentMasjid(masjidId);
            loadCurrentPageData();
        });
        
        // Logout
        elements.logoutBtn.addEventListener('click', logout);
        
        // Modal close
        elements.modalOverlay.addEventListener('click', closeModal);
        
        // Form submissions
        setupFormListeners();
        
        // Button clicks
        setupButtonListeners();
    }

    function setupFormListeners() {
        // Prayer Config Form
        const prayerConfigForm = document.getElementById('prayerConfigForm');
        if (prayerConfigForm) {
            prayerConfigForm.addEventListener('submit', handlePrayerConfigSubmit);
        }
        
        // Display Settings Form
        const displaySettingsForm = document.getElementById('displaySettingsForm');
        if (displaySettingsForm) {
            displaySettingsForm.addEventListener('submit', handleDisplaySettingsSubmit);
        }
    }

    function setupButtonListeners() {
        // Add Announcement
        const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
        if (addAnnouncementBtn) {
            addAnnouncementBtn.addEventListener('click', () => showAnnouncementModal());
        }
        
        // Add Event
        const addEventBtn = document.getElementById('addEventBtn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => showEventModal());
        }
        
        // Upload Media
        const uploadMediaBtn = document.getElementById('uploadMediaBtn');
        if (uploadMediaBtn) {
            uploadMediaBtn.addEventListener('click', () => showMediaUploadModal());
        }
        
        // Add User
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => showUserModal());
        }
    }

    // ============================================
    // NAVIGATION
    // ============================================
    function navigateTo(page) {
        // Update nav items
        elements.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Update pages
        elements.pages.forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'prayer-times': 'Jadwal Sholat',
            'announcements': 'Pengumuman',
            'events': 'Kajian & Acara',
            'media': 'Media',
            'settings': 'Pengaturan',
            'users': 'Pengguna'
        };
        elements.pageTitle.textContent = titles[page] || 'Dashboard';
        
        // Load page data
        loadPageData(page);
    }

    function loadCurrentPageData() {
        const activePage = document.querySelector('.nav-item.active');
        if (activePage) {
            loadPageData(activePage.dataset.page);
        }
    }

    async function loadPageData(page) {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            switch (page) {
                case 'dashboard':
                    await loadDashboard();
                    break;
                case 'prayer-times':
                    await loadPrayerTimes();
                    break;
                case 'announcements':
                    await loadAnnouncements();
                    break;
                case 'events':
                    await loadEvents();
                    break;
                case 'media':
                    await loadMedia();
                    break;
                case 'settings':
                    await loadDisplaySettings();
                    break;
                case 'users':
                    await loadUsers();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${page}:`, error);
            showToast(`Gagal memuat data ${page}`, 'error');
        }
    }

    // ============================================
    // DATA LOADING FUNCTIONS
    // ============================================
    async function loadUserInfo() {
        const user = API.getCurrentUser();
        if (user) {
            elements.userName.textContent = user.email.split('@')[0];
        }
    }

    async function loadMasjids() {
        try {
            const masjids = await API.getMasjids();
            
            // Clear and populate select
            elements.masjidSelect.innerHTML = '<option value="">Pilih Masjid</option>';
            masjids.forEach(masjid => {
                const option = document.createElement('option');
                option.value = masjid.id;
                option.textContent = masjid.name;
                elements.masjidSelect.appendChild(option);
            });
            
            // Select saved masjid
            const currentMasjid = API.getCurrentMasjid();
            if (currentMasjid) {
                elements.masjidSelect.value = currentMasjid;
            } else if (masjids.length > 0) {
                API.setCurrentMasjid(masjids[0].id);
                elements.masjidSelect.value = masjids[0].id;
            }
        } catch (error) {
            console.error('Error loading masjids:', error);
        }
    }

    async function loadDashboard() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            // Load prayer times
            const prayerTimes = await API.getPrayerTimes(masjidId);
            renderDashboardPrayerTimes(prayerTimes);
            
            // Load announcements
            const announcements = await API.getAnnouncements(masjidId, 'active');
            document.getElementById('activeAnnouncements').textContent = `${announcements.length} Pengumuman`;
            renderRecentAnnouncements(announcements.slice(0, 3));
            
            // Load events
            const events = await API.getEvents(masjidId, 'active');
            document.getElementById('upcomingEvents').textContent = `${events.length} Acara`;
            
            // Load media count
            const media = await API.getMedia(masjidId);
            document.getElementById('totalMedia').textContent = `${media.length} File`;
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async function loadPrayerTimes() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const config = await API.getPrayerConfig(masjidId);
            populatePrayerConfigForm(config);
        } catch (error) {
            console.error('Error loading prayer times:', error);
        }
    }

    async function loadAnnouncements() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const announcements = await API.getAnnouncements(masjidId);
            renderAnnouncementsTable(announcements);
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    async function loadEvents() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const events = await API.getEvents(masjidId);
            renderEventsTable(events);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async function loadMedia() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const media = await API.getMedia(masjidId);
            renderMediaGrid(media);
        } catch (error) {
            console.error('Error loading media:', error);
        }
    }

    async function loadDisplaySettings() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const settings = await API.getDisplaySettings(masjidId);
            populateDisplaySettingsForm(settings);
        } catch (error) {
            console.error('Error loading display settings:', error);
        }
    }

    async function loadUsers() {
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) return;
        
        try {
            const users = await API.getMasjidUsers(masjidId);
            renderUsersTable(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    function renderDashboardPrayerTimes(prayerTimes) {
        const container = document.getElementById('prayerTimesList');
        if (!container) return;
        
        const prayers = [
            { name: 'Subuh', time: prayerTimes.fajr },
            { name: 'Terbit', time: prayerTimes.sunrise },
            { name: 'Zuhur', time: prayerTimes.dhuhr },
            { name: 'Asar', time: prayerTimes.asr },
            { name: 'Magrib', time: prayerTimes.maghrib },
            { name: 'Isya', time: prayerTimes.isha }
        ];
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        container.innerHTML = prayers.map(prayer => {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const isCurrent = (hours === currentHour && Math.abs(minutes - currentMinute) < 30);
            
            return `
                <div class="prayer-time-item ${isCurrent ? 'current' : ''}">
                    <span class="prayer-name">${prayer.name}</span>
                    <span class="prayer-time">${prayer.time}</span>
                </div>
            `;
        }).join('');
    }

    function renderRecentAnnouncements(announcements) {
        const container = document.getElementById('recentAnnouncements');
        if (!container) return;
        
        if (announcements.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">Tidak ada pengumuman aktif</p>';
            return;
        }
        
        container.innerHTML = announcements.map(ann => `
            <div class="announcement-item">
                <h4>${escapeHtml(ann.title)}</h4>
                <p>${escapeHtml(ann.content).substring(0, 100)}...</p>
            </div>
        `).join('');
    }

    function renderAnnouncementsTable(announcements) {
        const tbody = document.getElementById('announcementsTableBody');
        if (!tbody) return;
        
        if (announcements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tidak ada pengumuman</td></tr>';
            return;
        }
        
        tbody.innerHTML = announcements.map(ann => `
            <tr>
                <td>${escapeHtml(ann.title)}</td>
                <td>${formatDate(ann.start_date)}</td>
                <td>${formatDate(ann.end_date)}</td>
                <td>
                    <span class="status-badge ${ann.is_active ? 'active' : 'inactive'}">
                        ${ann.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="App.editAnnouncement('${ann.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteAnnouncement('${ann.id}')">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderEventsTable(events) {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) return;
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada acara</td></tr>';
            return;
        }
        
        tbody.innerHTML = events.map(ev => `
            <tr>
                <td>${escapeHtml(ev.title)}</td>
                <td>${escapeHtml(ev.speaker)}</td>
                <td>${formatDate(ev.date)}</td>
                <td>${ev.time}</td>
                <td>
                    <span class="status-badge ${ev.is_active ? 'active' : 'inactive'}">
                        ${ev.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="App.editEvent('${ev.id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteEvent('${ev.id}')">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderMediaGrid(media) {
        const container = document.getElementById('mediaGrid');
        if (!container) return;
        
        if (media.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; grid-column: 1/-1;">Tidak ada media</p>';
            return;
        }
        
        container.innerHTML = media.map(m => `
            <div class="media-item">
                <div class="media-preview">
                    ${m.file_type === 'video' ? '🎥' : `<img src="https://drive.google.com/uc?id=${m.google_drive_file_id}" alt="${escapeHtml(m.file_name)}">`}
                </div>
                <div class="media-info">
                    <h4>${escapeHtml(m.file_name)}</h4>
                    <p>${m.file_type === 'video' ? 'Video' : 'Gambar'} • ${m.display_order}</p>
                </div>
                <div class="media-actions">
                    <button class="btn btn-sm btn-secondary" onclick="App.editMedia('${m.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="App.deleteMedia('${m.id}')">Hapus</button>
                </div>
            </div>
        `).join('');
    }

    function renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Tidak ada pengguna</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.role_name)}</td>
                <td>
                    <span class="status-badge ${u.is_active ? 'active' : 'inactive'}">
                        ${u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="App.editUser('${u.user_id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteUser('${u.user_id}')">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ============================================
    // FORM HANDLERS
    // ============================================
    function populatePrayerConfigForm(config) {
        if (!config) return;
        
        document.getElementById('calculationMethod').value = config.calculation_method || 'kemenag_ri';
        document.getElementById('madhab').value = config.madhab || 'shafi';
        document.getElementById('fajrAdjustment').value = config.fajr_adjustment_minutes || 0;
        document.getElementById('dhuhrAdjustment').value = config.dhuhr_adjustment_minutes || 0;
        document.getElementById('asrAdjustment').value = config.asr_adjustment_minutes || 0;
        document.getElementById('maghribAdjustment').value = config.maghrib_adjustment_minutes || 0;
        document.getElementById('ishaAdjustment').value = config.isha_adjustment_minutes || 0;
        document.getElementById('iqamahFajr').value = config.iqamah_fajr_minutes || 15;
        document.getElementById('iqamahDhuhr').value = config.iqamah_dhuhr_minutes || 15;
        document.getElementById('iqamahAsr').value = config.iqamah_asr_minutes || 15;
        document.getElementById('iqamahMaghrib').value = config.iqamah_maghrib_minutes || 10;
        document.getElementById('iqamahIsha').value = config.iqamah_isha_minutes || 15;
    }

    function populateDisplaySettingsForm(settings) {
        if (!settings) return;
        
        document.getElementById('themePrimary').value = settings.theme_color_primary || '#00563F';
        document.getElementById('themeSecondary').value = settings.theme_color_secondary || '#DAA520';
        document.getElementById('fontFamily').value = settings.font_family_main || 'Roboto';
        document.getElementById('footerText').value = settings.footer_text || '';
    }

    async function handlePrayerConfigSubmit(e) {
        e.preventDefault();
        
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) {
            showToast('Pilih masjid terlebih dahulu', 'warning');
            return;
        }
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.masjid_id = masjidId;
        
        try {
            await API.updatePrayerConfig(data);
            showToast('Pengaturan jadwal sholat berhasil disimpan', 'success');
        } catch (error) {
            showToast('Gagal menyimpan pengaturan', 'error');
        }
    }

    async function handleDisplaySettingsSubmit(e) {
        e.preventDefault();
        
        const masjidId = API.getCurrentMasjid();
        if (!masjidId) {
            showToast('Pilih masjid terlebih dahulu', 'warning');
            return;
        }
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.masjid_id = masjidId;
        
        try {
            await API.updateDisplaySettings(data);
            showToast('Pengaturan tampilan berhasil disimpan', 'success');
        } catch (error) {
            showToast('Gagal menyimpan pengaturan', 'error');
        }
    }

    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    function showModal(content) {
        elements.modalContent.innerHTML = content;
        elements.modal.classList.add('active');
    }

    function closeModal() {
        elements.modal.classList.remove('active');
    }

    function showAnnouncementModal(announcement = null) {
        const isEdit = announcement !== null;
        const title = isEdit ? 'Edit Pengumuman' : 'Tambah Pengumuman';
        
        const content = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="App.closeModal()">&times;</button>
            </div>
            <form id="announcementForm">
                <div class="form-group">
                    <label for="annTitle">Judul</label>
                    <input type="text" id="annTitle" name="title" value="${isEdit ? escapeHtml(announcement.title) : ''}" required>
                </div>
                <div class="form-group">
                    <label for="annContent">Isi Pengumuman</label>
                    <textarea id="annContent" name="content" rows="4" required>${isEdit ? escapeHtml(announcement.content) : ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="annStartDate">Tanggal Mulai</label>
                        <input type="date" id="annStartDate" name="start_date" value="${isEdit ? announcement.start_date : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="annEndDate">Tanggal Berakhir</label>
                        <input type="date" id="annEndDate" name="end_date" value="${isEdit ? announcement.end_date : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="annActive">
                        <input type="checkbox" id="annActive" name="is_active" ${isEdit && announcement.is_active ? 'checked' : ''}>
                        Aktif
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        showModal(content);
        
        // Handle form submission
        document.getElementById('announcementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const masjidId = API.getCurrentMasjid();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.masjid_id = masjidId;
            data.is_active = document.getElementById('annActive').checked;
            
            if (isEdit) {
                data.id = announcement.id;
            }
            
            try {
                if (isEdit) {
                    await API.updateAnnouncement(data);
                } else {
                    await API.createAnnouncement(data);
                }
                showToast(`Pengumuman berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`, 'success');
                closeModal();
                loadAnnouncements();
            } catch (error) {
                showToast('Gagal menyimpan pengumuman', 'error');
            }
        });
    }

    function showEventModal(event = null) {
        const isEdit = event !== null;
        const title = isEdit ? 'Edit Acara' : 'Tambah Acara';
        
        const content = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="App.closeModal()">&times;</button>
            </div>
            <form id="eventForm">
                <div class="form-group">
                    <label for="eventTitle">Judul</label>
                    <input type="text" id="eventTitle" name="title" value="${isEdit ? escapeHtml(event.title) : ''}" required>
                </div>
                <div class="form-group">
                    <label for="eventSpeaker">Pembicara</label>
                    <input type="text" id="eventSpeaker" name="speaker" value="${isEdit ? escapeHtml(event.speaker) : ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="eventDate">Tanggal</label>
                        <input type="date" id="eventDate" name="date" value="${isEdit ? event.date : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="eventTime">Waktu</label>
                        <input type="time" id="eventTime" name="time" value="${isEdit ? event.time : ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="eventLocation">Lokasi</label>
                    <input type="text" id="eventLocation" name="location" value="${isEdit ? escapeHtml(event.location) : ''}" required>
                </div>
                <div class="form-group">
                    <label for="eventDescription">Deskripsi</label>
                    <textarea id="eventDescription" name="description" rows="3">${isEdit ? escapeHtml(event.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="eventActive">
                        <input type="checkbox" id="eventActive" name="is_active" ${isEdit && event.is_active ? 'checked' : ''}>
                        Aktif
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        showModal(content);
        
        // Handle form submission
        document.getElementById('eventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const masjidId = API.getCurrentMasjid();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.masjid_id = masjidId;
            data.is_active = document.getElementById('eventActive').checked;
            
            if (isEdit) {
                data.id = event.id;
            }
            
            try {
                if (isEdit) {
                    await API.updateEvent(data);
                } else {
                    await API.createEvent(data);
                }
                showToast(`Acara berhasil ${isEdit ? 'diperbarui' : 'dibuat'}`, 'success');
                closeModal();
                loadEvents();
            } catch (error) {
                showToast('Gagal menyimpan acara', 'error');
            }
        });
    }

    function showMediaUploadModal() {
        const content = `
            <div class="modal-header">
                <h3>Unggah Media</h3>
                <button class="modal-close" onclick="App.closeModal()">&times;</button>
            </div>
            <form id="mediaForm">
                <div class="form-group">
                    <label for="mediaFile">File (Gambar/Video)</label>
                    <input type="file" id="mediaFile" name="file" accept="image/*,video/*" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="mediaType">Tipe</label>
                        <select id="mediaType" name="file_type">
                            <option value="image">Gambar</option>
                            <option value="video">Video</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="mediaOrder">Urutan Tampilan</label>
                        <input type="number" id="mediaOrder" name="display_order" value="0" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="mediaDuration">Durasi (detik)</label>
                    <input type="number" id="mediaDuration" name="duration_seconds" value="10" min="1">
                </div>
                <div class="form-group">
                    <label for="mediaActive">
                        <input type="checkbox" id="mediaActive" name="is_active" checked>
                        Aktif
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Unggah</button>
                </div>
            </form>
        `;
        
        showModal(content);
        
        // Handle form submission
        document.getElementById('mediaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const masjidId = API.getCurrentMasjid();
            const fileInput = document.getElementById('mediaFile');
            const file = fileInput.files[0];
            
            if (!file) {
                showToast('Pilih file terlebih dahulu', 'warning');
                return;
            }
            
            try {
                showToast('Mengunggah file...', 'info');
                
                const base64 = await API.fileToBase64(file);
                
                const data = {
                    masjid_id: masjidId,
                    file_name: file.name,
                    file_data: base64,
                    file_type: document.getElementById('mediaType').value,
                    display_order: parseInt(document.getElementById('mediaOrder').value),
                    duration_seconds: parseInt(document.getElementById('mediaDuration').value),
                    is_active: document.getElementById('mediaActive').checked
                };
                
                await API.uploadMedia(data);
                showToast('Media berhasil diunggah', 'success');
                closeModal();
                loadMedia();
            } catch (error) {
                showToast('Gagal mengunggah media', 'error');
            }
        });
    }

    function showUserModal(user = null) {
        const isEdit = user !== null;
        const title = isEdit ? 'Edit Pengguna' : 'Tambah Pengguna';
        
        const content = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="App.closeModal()">&times;</button>
            </div>
            <form id="userForm">
                <div class="form-group">
                    <label for="userEmail">Email</label>
                    <input type="email" id="userEmail" name="user_email" value="${isEdit ? escapeHtml(user.email) : ''}" required ${isEdit ? 'readonly' : ''}>
                </div>
                <div class="form-group">
                    <label for="userRole">Peran</label>
                    <select id="userRole" name="role_name">
                        <option value="Content Editor" ${isEdit && user.role_name === 'Content Editor' ? 'selected' : ''}>Content Editor</option>
                        <option value="Masjid Admin" ${isEdit && user.role_name === 'Masjid Admin' ? 'selected' : ''}>Masjid Admin</option>
                        <option value="Viewer" ${isEdit && user.role_name === 'Viewer' ? 'selected' : ''}>Viewer</option>
                    </select>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        showModal(content);
        
        // Handle form submission
        document.getElementById('userForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const masjidId = API.getCurrentMasjid();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.masjid_id = masjidId;
            
            try {
                if (isEdit) {
                    await API.updateMasjidUserRole(data);
                } else {
                    await API.addMasjidUser(data);
                }
                showToast(`Pengguna berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`, 'success');
                closeModal();
                loadUsers();
            } catch (error) {
                showToast('Gagal menyimpan pengguna', 'error');
            }
        });
    }

    // ============================================
    // EDIT & DELETE FUNCTIONS
    // ============================================
    async function editAnnouncement(id) {
        try {
            const masjidId = API.getCurrentMasjid();
            const announcements = await API.getAnnouncements(masjidId);
            const announcement = announcements.find(a => a.id === id);
            if (announcement) {
                showAnnouncementModal(announcement);
            }
        } catch (error) {
            showToast('Gagal memuat data pengumuman', 'error');
        }
    }

    async function deleteAnnouncement(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
        
        try {
            await API.deleteAnnouncement(id);
            showToast('Pengumuman berhasil dihapus', 'success');
            loadAnnouncements();
        } catch (error) {
            showToast('Gagal menghapus pengumuman', 'error');
        }
    }

    async function editEvent(id) {
        try {
            const masjidId = API.getCurrentMasjid();
            const events = await API.getEvents(masjidId);
            const event = events.find(e => e.id === id);
            if (event) {
                showEventModal(event);
            }
        } catch (error) {
            showToast('Gagal memuat data acara', 'error');
        }
    }

    async function deleteEvent(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus acara ini?')) return;
        
        try {
            await API.deleteEvent(id);
            showToast('Acara berhasil dihapus', 'success');
            loadEvents();
        } catch (error) {
            showToast('Gagal menghapus acara', 'error');
        }
    }

    async function editMedia(id) {
        // Simple edit - just show order and duration
        const content = `
            <div class="modal-header">
                <h3>Edit Media</h3>
                <button class="modal-close" onclick="App.closeModal()">&times;</button>
            </div>
            <form id="editMediaForm">
                <div class="form-group">
                    <label for="editMediaOrder">Urutan Tampilan</label>
                    <input type="number" id="editMediaOrder" name="display_order" value="0" min="0">
                </div>
                <div class="form-group">
                    <label for="editMediaDuration">Durasi (detik)</label>
                    <input type="number" id="editMediaDuration" name="duration_seconds" value="10" min="1">
                </div>
                <div class="form-group">
                    <label for="editMediaActive">
                        <input type="checkbox" id="editMediaActive" name="is_active" checked>
                        Aktif
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        showModal(content);
        
        document.getElementById('editMediaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.id = id;
            
            try {
                await API.updateMedia(data);
                showToast('Media berhasil diperbarui', 'success');
                closeModal();
                loadMedia();
            } catch (error) {
                showToast('Gagal memperbarui media', 'error');
            }
        });
    }

    async function deleteMedia(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus media ini?')) return;
        
        try {
            await API.deleteMedia(id);
            showToast('Media berhasil dihapus', 'success');
            loadMedia();
        } catch (error) {
            showToast('Gagal menghapus media', 'error');
        }
    }

    async function editUser(userId) {
        // Find user in current list
        const usersTable = document.getElementById('usersTableBody');
        const rows = usersTable.querySelectorAll('tr');
        
        for (const row of rows) {
            const cells = row.querySelectorAll('td');
            if (cells[0].textContent) {
                const user = { user_id: userId, email: cells[0].textContent, role_name: cells[1].textContent };
                showUserModal(user);
                break;
            }
        }
    }

    async function deleteUser(userId) {
        if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
        
        try {
            const masjidId = API.getCurrentMasjid();
            await API.removeMasjidUser({ masjid_id: masjidId, user_id: userId });
            showToast('Pengguna berhasil dihapus', 'success');
            loadUsers();
        } catch (error) {
            showToast('Gagal menghapus pengguna', 'error');
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function updateTime() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        elements.currentTime.textContent = now.toLocaleDateString('id-ID', options);
    }

    function toggleSidebar() {
        elements.sidebar.classList.toggle('collapsed');
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        elements.toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        init,
        navigateTo,
        closeModal,
        editAnnouncement,
        deleteAnnouncement,
        editEvent,
        deleteEvent,
        editMedia,
        deleteMedia,
        editUser,
        deleteUser,
        showToast
    };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
