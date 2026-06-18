// ============================================
// DIGITAL BOARD DISPLAY MODULE
// Main logic for the public display
// ============================================

const DigitalBoard = (() => {
    // State
    let currentSlide = 0;
    let slideshowTimer = null;
    let refreshTimer = null;
    let countdownInterval = null;
    let slides = [];

    // DOM Elements
    const elements = {
        masjidLogo: document.getElementById('masjidLogo'),
        masjidName: document.getElementById('masjidName'),
        masjidAddress: document.getElementById('masjidAddress'),
        currentDate: document.getElementById('currentDate'),
        currentTime: document.getElementById('currentTime'),
        prayerTimesList: document.getElementById('prayerTimesList'),
        iqamahCountdown: document.getElementById('iqamahCountdown'),
        countdownTimer: document.getElementById('countdownTimer'),
        slideshow: document.getElementById('slideshow'),
        slideshowDots: document.getElementById('slideshowDots'),
        footerText: document.getElementById('footerText')
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    async function init() {
        try {
            // Update time immediately and every second
            updateDateTime();
            setInterval(updateDateTime, 1000);

            // Load initial data
            await loadData();

            // Setup auto-refresh
            refreshTimer = setInterval(loadData, BOARD_CONFIG.refreshInterval);

            // Start slideshow
            startSlideshow();

        } catch (error) {
            console.error('Initialization error:', error);
            showError('Gagal memuat data. Memuat ulang...');
            setTimeout(() => location.reload(), 5000);
        }
    }

    // ============================================
    // DATA LOADING
    // ============================================
    async function loadData() {
        try {
            // Load display settings
            await loadDisplaySettings();

            // Load prayer times
            await loadPrayerTimes();

            // Load announcements
            await loadAnnouncements();

            // Load events
            await loadEvents();

            // Load media
            await loadMedia();

            // Load masjid info
            await loadMasjidInfo();

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async function loadMasjidInfo() {
        try {
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getMasjid&masjid_id=${BOARD_CONFIG.masjidId}`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                elements.masjidName.textContent = data.data.name || 'Masjid';
                elements.masjidAddress.textContent = data.data.location_address || '';
            }
        } catch (error) {
            console.error('Error loading masjid info:', error);
        }
    }

    async function loadDisplaySettings() {
        try {
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getDisplaySettings&masjid_id=${BOARD_CONFIG.masjidId}`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                const settings = data.data;

                // Apply theme colors
                document.documentElement.style.setProperty('--color-primary', settings.theme_color_primary || BOARD_CONFIG.defaults.themeColorPrimary);
                document.documentElement.style.setProperty('--color-secondary', settings.theme_color_secondary || BOARD_CONFIG.defaults.themeColorSecondary);

                // Apply font
                document.body.style.fontFamily = settings.font_family_main || BOARD_CONFIG.defaults.fontFamilyMain;

                // Set footer text
                elements.footerText.textContent = settings.footer_text || BOARD_CONFIG.defaults.footerText;

                // Set logo
                if (settings.logo_image_url) {
                    elements.masjidLogo.src = settings.logo_image_url;
                    elements.masjidLogo.style.display = 'block';
                } else {
                    elements.masjidLogo.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading display settings:', error);
        }
    }

    async function loadPrayerTimes() {
        try {
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getPrayerTimes&masjid_id=${BOARD_CONFIG.masjidId}`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                renderPrayerTimes(data.data);
                checkIqamahCountdown(data.data);
            }
        } catch (error) {
            console.error('Error loading prayer times:', error);
        }
    }

    async function loadAnnouncements() {
        try {
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getAnnouncements&masjid_id=${BOARD_CONFIG.masjidId}&status=active`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                // Add announcement slides
                data.data.forEach(ann => {
                    slides.push({
                        type: 'announcement',
                        title: ann.title,
                        content: ann.content,
                        image: ann.image_url
                    });
                });
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    }

    async function loadEvents() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getEvents&masjid_id=${BOARD_CONFIG.masjidId}&status=active&date_after=${today}`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                // Add event slides
                data.data.forEach(ev => {
                    slides.push({
                        type: 'event',
                        title: ev.title,
                        speaker: ev.speaker,
                        date: ev.date,
                        time: ev.time,
                        location: ev.location
                    });
                });
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async function loadMedia() {
        try {
            const response = await fetch(`${BOARD_CONFIG.appsScriptUrl}?action=getMedia&masjid_id=${BOARD_CONFIG.masjidId}&status=active`);
            const data = await response.json();

            if (data.status === 'success' && data.data) {
                // Add media slides
                data.data.forEach(m => {
                    slides.push({
                        type: 'media',
                        fileType: m.file_type,
                        fileUrl: `https://drive.google.com/uc?id=${m.google_drive_file_id}`,
                        fileName: m.file_name
                    });
                });
            }

            // Add Islamic quotes if enabled
            if (BOARD_CONFIG.showQuotes) {
                ISLAMIC_QUOTES.forEach(quote => {
                    slides.push({
                        type: 'quote',
                        arabic: quote.arabic,
                        translation: quote.translation
                    });
                });
            }

            // Update slideshow dots
            updateSlideshowDots();

        } catch (error) {
            console.error('Error loading media:', error);
        }
    }

    // ============================================
    // RENDERING FUNCTIONS
    // ============================================
    function renderPrayerTimes(prayerTimes) {
        const prayers = [
            { name: 'Subuh', time: prayerTimes.fajr, iqamah: prayerTimes.iqamah?.fajr },
            { name: 'Terbit', time: prayerTimes.sunrise, iqamah: null },
            { name: 'Zuhur', time: prayerTimes.dhuhr, iqamah: prayerTimes.iqamah?.dhuhr },
            { name: 'Asar', time: prayerTimes.asr, iqamah: prayerTimes.iqamah?.asr },
            { name: 'Magrib', time: prayerTimes.maghrib, iqamah: prayerTimes.iqamah?.maghrib },
            { name: 'Isya', time: prayerTimes.isha, iqamah: prayerTimes.iqamah?.isha }
        ];

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        elements.prayerTimesList.innerHTML = prayers.map(prayer => {
            const [hours, mins] = prayer.time.split(':').map(Number);
            const prayerMinutes = hours * 60 + mins;
            
            let statusClass = '';
            if (Math.abs(currentMinutes - prayerMinutes) < 30) {
                statusClass = 'current';
            } else if (prayerMinutes > currentMinutes && prayerMinutes - currentMinutes < 60) {
                statusClass = 'upcoming';
            }

            return `
                <div class="prayer-time-item ${statusClass}">
                    <span class="prayer-name">${prayer.name}</span>
                    <span class="prayer-time">${prayer.time}</span>
                </div>
            `;
        }).join('');
    }

    function checkIqamahCountdown(prayerTimes) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const prayers = [
            { name: 'Subuh', adzan: prayerTimes.fajr, iqamah: prayerTimes.iqamah?.fajr },
            { name: 'Zuhur', adzan: prayerTimes.dhuhr, iqamah: prayerTimes.iqamah?.dhuhr },
            { name: 'Asar', adzan: prayerTimes.asr, iqamah: prayerTimes.iqamah?.asr },
            { name: 'Magrib', adzan: prayerTimes.maghrib, iqamah: prayerTimes.iqamah?.maghrib },
            { name: 'Isya', adzan: prayerTimes.isha, iqamah: prayerTimes.iqamah?.isha }
        ];

        let activeCountdown = null;

        for (const prayer of prayers) {
            if (!prayer.iqamah) continue;

            const [adzanHours, adzanMins] = prayer.adzan.split(':').map(Number);
            const adzanMinutes = adzanHours * 60 + adzanMins;

            const [iqamahHours, iqamahMins] = prayer.iqamah.split(':').map(Number);
            const iqamahMinutes = iqamahHours * 60 + iqamahMins;

            // Check if we're between adzan and iqamah
            if (currentMinutes >= adzanMinutes && currentMinutes < iqamahMinutes) {
                activeCountdown = {
                    iqamahMinutes: iqamahMinutes,
                    currentMinutes: currentMinutes
                };
                break;
            }
        }

        if (activeCountdown) {
            startCountdown(activeCountdown.iqamahMinutes - activeCountdown.currentMinutes);
            elements.iqamahCountdown.classList.remove('hidden');
        } else {
            elements.iqamahCountdown.classList.add('hidden');
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }
    }

    function startCountdown(minutesRemaining) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        let totalSeconds = minutesRemaining * 60;

        function updateDisplay() {
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            elements.countdownTimer.textContent = 
                `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        updateDisplay();

        countdownInterval = setInterval(() => {
            totalSeconds--;
            if (totalSeconds <= 0) {
                clearInterval(countdownInterval);
                elements.iqamahCountdown.classList.add('hidden');
                // Refresh prayer times
                loadPrayerTimes();
            } else {
                updateDisplay();
            }
        }, 1000);
    }

    // ============================================
    // SLIDESHOW FUNCTIONS
    // ============================================
    function startSlideshow() {
        if (slides.length === 0) {
            // Add default slide if no content
            slides.push({
                type: 'quote',
                arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                translation: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang'
            });
        }

        renderSlideshow();
        updateSlideshowDots();

        slideshowTimer = setInterval(nextSlide, BOARD_CONFIG.slideshowInterval);
    }

    function renderSlideshow() {
        elements.slideshow.innerHTML = slides.map((slide, index) => {
            let content = '';

            switch (slide.type) {
                case 'announcement':
                    content = `
                        <div class="slide-announcement">
                            <h3>${escapeHtml(slide.title)}</h3>
                            <p>${escapeHtml(slide.content)}</p>
                            ${slide.image ? `<img src="${slide.image}" alt="">` : ''}
                        </div>
                    `;
                    break;

                case 'event':
                    content = `
                        <div class="slide-event">
                            <h3>${escapeHtml(slide.title)}</h3>
                            <p class="event-speaker">${escapeHtml(slide.speaker)}</p>
                            <p class="event-details">
                                ${formatDate(slide.date)} • ${slide.time} • ${escapeHtml(slide.location)}
                            </p>
                        </div>
                    `;
                    break;

                case 'media':
                    if (slide.fileType === 'video') {
                        content = `
                            <div class="slide-media">
                                <video autoplay muted loop>
                                    <source src="${slide.fileUrl}" type="video/mp4">
                                </video>
                            </div>
                        `;
                    } else {
                        content = `
                            <div class="slide-media">
                                <img src="${slide.fileUrl}" alt="${escapeHtml(slide.fileName)}">
                            </div>
                        `;
                    }
                    break;

                case 'quote':
                    content = `
                        <div class="slide-quote">
                            <p class="arabic-text">${slide.arabic}</p>
                            <p class="translation">${slide.translation}</p>
                        </div>
                    `;
                    break;
            }

            return `
                <div class="slideshow-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                    ${content}
                </div>
            `;
        }).join('');
    }

    function updateSlideshowDots() {
        elements.slideshowDots.innerHTML = slides.map((_, index) => `
            <span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
        `).join('');

        // Add click handlers
        elements.slideshowDots.querySelectorAll('.dot').forEach(dot => {
            dot.addEventListener('click', () => {
                goToSlide(parseInt(dot.dataset.index));
            });
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlideshow();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateSlideshow();
        
        // Reset slideshow timer
        clearInterval(slideshowTimer);
        slideshowTimer = setInterval(nextSlide, BOARD_CONFIG.slideshowInterval);
    }

    function updateSlideshow() {
        // Update slides
        elements.slideshow.querySelectorAll('.slideshow-slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });

        // Update dots
        elements.slideshowDots.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // ============================================
    // DATETIME FUNCTIONS
    // ============================================
    function updateDateTime() {
        const now = new Date();
        
        // Update time
        elements.currentTime.textContent = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Update date
        elements.currentDate.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function showError(message) {
        // Create error overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div style="text-align: center; color: white; padding: 20px;">
                <p style="font-size: 24px; margin-bottom: 20px;">⚠️</p>
                <p style="font-size: 18px;">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);

        // Remove after 5 seconds
        setTimeout(() => overlay.remove(), 5000);
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        init
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', DigitalBoard.init);
