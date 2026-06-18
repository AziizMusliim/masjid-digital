// ============================================
// API HELPER MODULE
// Handles communication with Google Apps Script Backend
// ============================================

const API = (() => {
    // Configuration - Update this with your Apps Script web app URL
    const CONFIG = {
        baseUrl: PropertiesService.getScriptProperties().getProperty('https://script.google.com/macros/s/AKfycby394Y1cVplXxBOPFWLBJc4sTZEzemacRuPc19V---gIzc9E0_4W96xxi8HcgpJE7uM/exec') || 'https://script.google.com/macros/s/AKfycby394Y1cVplXxBOPFWLBJc4sTZEzemacRuPc19V---gIzc9E0_4W96xxi8HcgpJE7uM/exec',
        timeout: 30000
    };

    // Current user state
    let currentUser = null;
    let currentMasjidId = null;

    // ============================================
    // HTTP REQUEST HELPER
    // ============================================
    async function request(action, params = {}, method = 'GET') {
        const url = new URL(CONFIG.baseUrl);
        
        let options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (method === 'GET') {
            url.searchParams.append('action', action);
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });
        } else {
            options.body = JSON.stringify({ action, ...params });
        }

        try {
            const response = await fetch(url.toString(), options);
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ============================================
    // AUTHENTICATION
    // ============================================
    async function authenticate() {
        try {
            const response = await request('auth');
            currentUser = response.user;
            return currentUser;
        } catch (error) {
            console.error('Authentication failed:', error);
            throw error;
        }
    }

    function getCurrentUser() {
        return currentUser;
    }

    function setCurrentMasjid(masjidId) {
        currentMasjidId = masjidId;
        localStorage.setItem('currentMasjidId', masjidId);
    }

    function getCurrentMasjid() {
        if (!currentMasjidId) {
            currentMasjidId = localStorage.getItem('currentMasjidId');
        }
        return currentMasjidId;
    }

    // ============================================
    // MASJID OPERATIONS
    // ============================================
    async function getMasjids() {
        const response = await request('getMasjids');
        return response.data;
    }

    async function getMasjid(masjidId) {
        const response = await request('getMasjid', { masjid_id: masjidId });
        return response.data;
    }

    async function updateMasjid(data) {
        const response = await request('updateMasjid', data, 'POST');
        return response;
    }

    // ============================================
    // PRAYER TIMES OPERATIONS
    // ============================================
    async function getPrayerConfig(masjidId) {
        const response = await request('getPrayerConfig', { masjid_id: masjidId });
        return response.data;
    }

    async function updatePrayerConfig(data) {
        const response = await request('updatePrayerConfig', data, 'POST');
        return response;
    }

    async function getPrayerTimes(masjidId) {
        const response = await request('getPrayerTimes', { masjid_id: masjidId });
        return response.data;
    }

    // ============================================
    // ANNOUNCEMENTS OPERATIONS
    // ============================================
    async function getAnnouncements(masjidId, status = null) {
        const params = { masjid_id: masjidId };
        if (status) params.status = status;
        
        const response = await request('getAnnouncements', params);
        return response.data;
    }

    async function createAnnouncement(data) {
        const response = await request('createAnnouncement', data, 'POST');
        return response;
    }

    async function updateAnnouncement(data) {
        const response = await request('updateAnnouncement', data, 'POST');
        return response;
    }

    async function deleteAnnouncement(id) {
        const response = await request('deleteAnnouncement', { id }, 'POST');
        return response;
    }

    // ============================================
    // EVENTS OPERATIONS
    // ============================================
    async function getEvents(masjidId, status = null, dateAfter = null) {
        const params = { masjid_id: masjidId };
        if (status) params.status = status;
        if (dateAfter) params.date_after = dateAfter;
        
        const response = await request('getEvents', params);
        return response.data;
    }

    async function createEvent(data) {
        const response = await request('createEvent', data, 'POST');
        return response;
    }

    async function updateEvent(data) {
        const response = await request('updateEvent', data, 'POST');
        return response;
    }

    async function deleteEvent(id) {
        const response = await request('deleteEvent', { id }, 'POST');
        return response;
    }

    // ============================================
    // MEDIA OPERATIONS
    // ============================================
    async function getMedia(masjidId, type = null, status = null) {
        const params = { masjid_id: masjidId };
        if (type) params.type = type;
        if (status) params.status = status;
        
        const response = await request('getMedia', params);
        return response.data;
    }

    async function uploadMedia(data) {
        const response = await request('uploadMedia', data, 'POST');
        return response;
    }

    async function updateMedia(data) {
        const response = await request('updateMedia', data, 'POST');
        return response;
    }

    async function deleteMedia(id) {
        const response = await request('deleteMedia', { id }, 'POST');
        return response;
    }

    // ============================================
    // USERS OPERATIONS
    // ============================================
    async function getMasjidUsers(masjidId) {
        const response = await request('getMasjidUsers', { masjid_id: masjidId });
        return response.data;
    }

    async function addMasjidUser(data) {
        const response = await request('addMasjidUser', data, 'POST');
        return response;
    }

    async function updateMasjidUserRole(data) {
        const response = await request('updateMasjidUserRole', data, 'POST');
        return response;
    }

    async function removeMasjidUser(data) {
        const response = await request('removeMasjidUser', data, 'POST');
        return response;
    }

    // ============================================
    // DISPLAY SETTINGS OPERATIONS
    // ============================================
    async function getDisplaySettings(masjidId) {
        const response = await request('getDisplaySettings', { masjid_id: masjidId });
        return response.data;
    }

    async function updateDisplaySettings(data) {
        const response = await request('updateDisplaySettings', data, 'POST');
        return response;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    // ============================================
    // PUBLIC API
    // ============================================
    return {
        // Config
        configure: (newConfig) => Object.assign(CONFIG, newConfig),
        
        // Auth
        authenticate,
        getCurrentUser,
        setCurrentMasjid,
        getCurrentMasjid,
        
        // Masjid
        getMasjids,
        getMasjid,
        updateMasjid,
        
        // Prayer Times
        getPrayerConfig,
        updatePrayerConfig,
        getPrayerTimes,
        
        // Announcements
        getAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        
        // Events
        getEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        
        // Media
        getMedia,
        uploadMedia,
        updateMedia,
        deleteMedia,
        
        // Users
        getMasjidUsers,
        addMasjidUser,
        updateMasjidUserRole,
        removeMasjidUser,
        
        // Display Settings
        getDisplaySettings,
        updateDisplaySettings,
        
        // Utilities
        fileToBase64
    };
})();
