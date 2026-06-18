// ============================================
// PAPAN INFORMASI DIGITAL MASJID - BACKEND
// Google Apps Script Backend
// ============================================

// Configuration
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const DRIVE_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');

// ============================================
// MAIN ENTRY POINTS
// ============================================

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    const action = e.parameter.action || (method === 'POST' ? JSON.parse(e.postData.contents).action : null);
    
    if (!action) {
      return jsonResponse({ status: 'error', message: 'Action parameter required' }, 400);
    }

    // Authentication check for admin actions
    const publicActions = ['getPrayerTimes', 'getAnnouncements', 'getEvents', 'getMedia', 'getDisplaySettings'];
    const user = publicActions.includes(action) ? null : authenticateUser();
    
    // Route to appropriate handler
    switch (action) {
      // Auth
      case 'auth':
        return jsonResponse({ status: 'success', user: user });
      
      // Masjid
      case 'getMasjids':
        return getMasjids(user);
      case 'getMasjid':
        return getMasjid(e);
      case 'updateMasjid':
        return updateMasjid(e, user);
      
      // Prayer Times
      case 'getPrayerConfig':
        return getPrayerConfig(e);
      case 'updatePrayerConfig':
        return updatePrayerConfig(e, user);
      case 'getPrayerTimes':
        return getPrayerTimes(e);
      
      // Announcements
      case 'getAnnouncements':
        return getAnnouncements(e);
      case 'createAnnouncement':
        return createAnnouncement(e, user);
      case 'updateAnnouncement':
        return updateAnnouncement(e, user);
      case 'deleteAnnouncement':
        return deleteAnnouncement(e, user);
      
      // Events
      case 'getEvents':
        return getEvents(e);
      case 'createEvent':
        return createEvent(e, user);
      case 'updateEvent':
        return updateEvent(e, user);
      case 'deleteEvent':
        return deleteEvent(e, user);
      
      // Media
      case 'getMedia':
        return getMedia(e);
      case 'uploadMedia':
        return uploadMedia(e, user);
      case 'updateMedia':
        return updateMedia(e, user);
      case 'deleteMedia':
        return deleteMedia(e, user);
      
      // Users
      case 'getMasjidUsers':
        return getMasjidUsers(e, user);
      case 'addMasjidUser':
        return addMasjidUser(e, user);
      case 'updateMasjidUserRole':
        return updateMasjidUserRole(e, user);
      case 'removeMasjidUser':
        return removeMasjidUser(e, user);
      
      // Display Settings
      case 'getDisplaySettings':
        return getDisplaySettings(e);
      case 'updateDisplaySettings':
        return updateDisplaySettings(e, user);
      
      default:
        return jsonResponse({ status: 'error', message: 'Unknown action: ' + action }, 400);
    }
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() }, 500);
  }
}

// ============================================
// AUTHENTICATION
// ============================================

function authenticateUser() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('User not authenticated');
  }
  
  const usersSheet = getSheet('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];
  
  const emailIndex = headers.indexOf('email');
  const idIndex = headers.indexOf('id');
  const isActiveIndex = headers.indexOf('is_active');
  
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][emailIndex] === email && usersData[i][isActiveIndex]) {
      const userId = usersData[i][idIndex];
      
      // Get user's masjid access
      const masjidUsersSheet = getSheet('MasjidUsers');
      const masjidUsersData = masjidUsersSheet.getDataRange().getValues();
      const muHeaders = masjidUsersData[0];
      
      const masjidAccess = [];
      for (let j = 1; j < masjidUsersData.length; j++) {
        if (masjidUsersData[j][muHeaders.indexOf('user_id')] === userId) {
          masjidAccess.push({
            masjid_id: masjidUsersData[j][muHeaders.indexOf('masjid_id')],
            role_id: masjidUsersData[j][muHeaders.indexOf('role_id')]
          });
        }
      }
      
      return {
        id: userId,
        email: email,
        masjids: masjidAccess
      };
    }
  }
  
  throw new Error('User not found or inactive');
}

function hasAccess(user, masjidId, requiredRole) {
  if (!user || !user.masjids) return false;
  
  const access = user.masjids.find(m => m.masjid_id === masjidId);
  if (!access) return false;
  
  // Check role hierarchy
  const rolesSheet = getSheet('Roles');
  const rolesData = rolesSheet.getDataRange().getValues();
  const roleHeaders = rolesData[0];
  
  const userRoleIndex = rolesData.findIndex(r => r[roleHeaders.indexOf('id')] === access.role_id);
  const requiredRoleIndex = rolesData.findIndex(r => r[roleHeaders.indexOf('name')] === requiredRole);
  
  if (userRoleIndex === -1 || requiredRoleIndex === -1) return false;
  
  // Super Admin has access to everything
  const userRoleName = rolesData[userRoleIndex][roleHeaders.indexOf('name')];
  if (userRoleName === 'Super Admin') return true;
  
  return userRoleIndex >= requiredRoleIndex;
}

// ============================================
// DATABASE HELPERS
// ============================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(sheetName);
}

function generateId() {
  return Utilities.getUuid().split('-')[0];
}

function getRowIndex(sheet, columnName, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex] === value) {
      return i + 1; // 1-based index for Sheets
    }
  }
  return -1;
}

function findRows(sheet, columnName, value) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex] === value) {
      const row = {};
      headers.forEach((h, idx) => row[h] = data[i][idx]);
      results.push(row);
    }
  }
  return results;
}

function findRow(sheet, columnName, value) {
  const results = findRows(sheet, columnName, value);
  return results.length > 0 ? results[0] : null;
}

function parseRequestData(e) {
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {};
}

// ============================================
// MASJID OPERATIONS
// ============================================

function getMasjids(user) {
  const sheet = getSheet('Masjids');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let masjids = [];
  for (let i = 1; i < data.length; i++) {
    const masjid = {};
    headers.forEach((h, idx) => masjid[h] = data[i][idx]);
    masjids.push(masjid);
  }
  
  // Filter by user access if not Super Admin
  if (user) {
    const userMasjidIds = user.masjids.map(m => m.masjid_id);
    masjids = masjids.filter(m => userMasjidIds.includes(m.id));
  }
  
  return jsonResponse({ status: 'success', data: masjids });
}

function getMasjid(e) {
  const masjidId = e.parameter.masjid_id;
  const sheet = getSheet('Masjids');
  const masjid = findRow(sheet, 'id', masjidId);
  
  if (!masjid) {
    return jsonResponse({ status: 'error', message: 'Masjid not found' }, 404);
  }
  
  return jsonResponse({ status: 'success', data: masjid });
}

function updateMasjid(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const sheet = getSheet('Masjids');
  const rowIndex = getRowIndex(sheet, 'id', masjidId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Masjid not found' }, 404);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    name: data.name,
    location_address: data.location_address,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    updated_at: new Date()
  };
  
  headers.forEach((h, idx) => {
    if (updates[h] !== undefined) {
      sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
    }
  });
  
  return jsonResponse({ status: 'success', message: 'Masjid updated successfully' });
}

// ============================================
// PRAYER TIMES OPERATIONS
// ============================================

function getPrayerConfig(e) {
  const masjidId = e.parameter.masjid_id;
  const sheet = getSheet('PrayerTimesConfigs');
  const config = findRow(sheet, 'masjid_id', masjidId);
  
  if (!config) {
    return jsonResponse({ status: 'error', message: 'Prayer config not found' }, 404);
  }
  
  return jsonResponse({ status: 'success', data: config });
}

function updatePrayerConfig(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const sheet = getSheet('PrayerTimesConfigs');
  const rowIndex = getRowIndex(sheet, 'masjid_id', masjidId);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    calculation_method: data.calculation_method,
    madhab: data.madhab,
    high_latitude_rule: data.high_latitude_rule,
    fajr_adjustment_minutes: data.fajr_adjustment_minutes,
    dhuhr_adjustment_minutes: data.dhuhr_adjustment_minutes,
    asr_adjustment_minutes: data.asr_adjustment_minutes,
    maghrib_adjustment_minutes: data.maghrib_adjustment_minutes,
    isha_adjustment_minutes: data.isha_adjustment_minutes,
    iqamah_fajr_minutes: data.iqamah_fajr_minutes,
    iqamah_dhuhr_minutes: data.iqamah_dhuhr_minutes,
    iqamah_asr_minutes: data.iqamah_asr_minutes,
    iqamah_maghrib_minutes: data.iqamah_maghrib_minutes,
    iqamah_isha_minutes: data.iqamah_isha_minutes,
    updated_at: new Date()
  };
  
  if (rowIndex === -1) {
    // Insert new config
    const newRow = [generateId(), masjidId];
    headers.forEach((h, idx) => {
      if (idx > 1 && updates[h] !== undefined) {
        newRow.push(updates[h]);
      } else if (idx > 1) {
        newRow.push('');
      }
    });
    sheet.appendRow(newRow);
  } else {
    // Update existing config
    headers.forEach((h, idx) => {
      if (updates[h] !== undefined) {
        sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
      }
    });
  }
  
  return jsonResponse({ status: 'success', message: 'Prayer config updated successfully' });
}

function getPrayerTimes(e) {
  const masjidId = e.parameter.masjid_id;
  
  // Get masjid location
  const masjidSheet = getSheet('Masjids');
  const masjid = findRow(masjidSheet, 'id', masjidId);
  
  if (!masjid) {
    return jsonResponse({ status: 'error', message: 'Masjid not found' }, 404);
  }
  
  // Get prayer config
  const configSheet = getSheet('PrayerTimesConfigs');
  const config = findRow(configSheet, 'masjid_id', masjidId);
  
  // Calculate prayer times based on location and config
  const prayerTimes = calculatePrayerTimes(
    masjid.latitude,
    masjid.longitude,
    masjid.timezone,
    config
  );
  
  return jsonResponse({ status: 'success', data: prayerTimes });
}

function calculatePrayerTimes(latitude, longitude, timezone, config) {
  // This is a simplified prayer time calculation
  // In production, use a proper prayer time library
  
  const date = new Date();
  const tz = timezone || 'Asia/Jakarta';
  
  // Placeholder calculation - replace with actual algorithm
  const fajrTime = '04:30';
  const sunriseTime = '05:45';
  const dhuhrTime = '11:30';
  const asrTime = '14:45';
  const maghribTime = '17:15';
  const ishaTime = '18:30';
  
  return {
    date: date.toISOString().split('T')[0],
    fajr: fajrTime,
    sunrise: sunriseTime,
    dhuhr: dhuhrTime,
    asr: asrTime,
    maghrib: maghribTime,
    isha: ishaTime,
    iqamah: {
      fajr: config ? addMinutes(fajrTime, config.iqamah_fajr_minutes || 15) : addMinutes(fajrTime, 15),
      dhuhr: config ? addMinutes(dhuhrTime, config.iqamah_dhuhr_minutes || 15) : addMinutes(dhuhrTime, 15),
      asr: config ? addMinutes(asrTime, config.iqamah_asr_minutes || 15) : addMinutes(asrTime, 15),
      maghrib: config ? addMinutes(maghribTime, config.iqamah_maghrib_minutes || 10) : addMinutes(maghribTime, 10),
      isha: config ? addMinutes(ishaTime, config.iqamah_isha_minutes || 15) : addMinutes(ishaTime, 15)
    }
  };
}

function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// ============================================
// ANNOUNCEMENTS OPERATIONS
// ============================================

function getAnnouncements(e) {
  const masjidId = e.parameter.masjid_id;
  const status = e.parameter.status;
  
  const sheet = getSheet('Announcements');
  let announcements = findRows(sheet, 'masjid_id', masjidId);
  
  if (status === 'active') {
    const now = new Date();
    announcements = announcements.filter(a => {
      const startDate = new Date(a.start_date);
      const endDate = new Date(a.end_date);
      return a.is_active && now >= startDate && now <= endDate;
    });
  }
  
  return jsonResponse({ status: 'success', data: announcements });
}

function createAnnouncement(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const sheet = getSheet('Announcements');
  const id = generateId();
  const now = new Date();
  
  const newRow = [
    id,
    masjidId,
    data.title,
    data.content,
    data.image_url || '',
    data.start_date,
    data.end_date,
    data.is_active !== false,
    user.id,
    now,
    now
  ];
  
  sheet.appendRow(newRow);
  
  return jsonResponse({ 
    status: 'success', 
    message: 'Announcement created successfully',
    id: id
  });
}

function updateAnnouncement(e, user) {
  const data = parseRequestData(e);
  const announcementId = data.id;
  
  const sheet = getSheet('Announcements');
  const rowIndex = getRowIndex(sheet, 'id', announcementId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Announcement not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', announcementId);
  if (!hasAccess(user, existing.masjid_id, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    title: data.title,
    content: data.content,
    image_url: data.image_url,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: data.is_active,
    updated_at: new Date()
  };
  
  headers.forEach((h, idx) => {
    if (updates[h] !== undefined) {
      sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
    }
  });
  
  return jsonResponse({ status: 'success', message: 'Announcement updated successfully' });
}

function deleteAnnouncement(e, user) {
  const data = parseRequestData(e);
  const announcementId = data.id;
  
  const sheet = getSheet('Announcements');
  const rowIndex = getRowIndex(sheet, 'id', announcementId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Announcement not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', announcementId);
  if (!hasAccess(user, existing.masjid_id, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  sheet.deleteRow(rowIndex);
  
  return jsonResponse({ status: 'success', message: 'Announcement deleted successfully' });
}

// ============================================
// EVENTS OPERATIONS
// ============================================

function getEvents(e) {
  const masjidId = e.parameter.masjid_id;
  const status = e.parameter.status;
  const dateAfter = e.parameter.date_after;
  
  const sheet = getSheet('Events');
  let events = findRows(sheet, 'masjid_id', masjidId);
  
  if (status === 'active') {
    events = events.filter(ev => ev.is_active);
  }
  
  if (dateAfter) {
    events = events.filter(ev => new Date(ev.date) >= new Date(dateAfter));
  }
  
  return jsonResponse({ status: 'success', data: events });
}

function createEvent(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const sheet = getSheet('Events');
  const id = generateId();
  const now = new Date();
  
  const newRow = [
    id,
    masjidId,
    data.title,
    data.speaker,
    data.date,
    data.time,
    data.location,
    data.description,
    data.is_active !== false,
    user.id,
    now,
    now
  ];
  
  sheet.appendRow(newRow);
  
  return jsonResponse({ 
    status: 'success', 
    message: 'Event created successfully',
    id: id
  });
}

function updateEvent(e, user) {
  const data = parseRequestData(e);
  const eventId = data.id;
  
  const sheet = getSheet('Events');
  const rowIndex = getRowIndex(sheet, 'id', eventId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Event not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', eventId);
  if (!hasAccess(user, existing.masjid_id, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    title: data.title,
    speaker: data.speaker,
    date: data.date,
    time: data.time,
    location: data.location,
    description: data.description,
    is_active: data.is_active,
    updated_at: new Date()
  };
  
  headers.forEach((h, idx) => {
    if (updates[h] !== undefined) {
      sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
    }
  });
  
  return jsonResponse({ status: 'success', message: 'Event updated successfully' });
}

function deleteEvent(e, user) {
  const data = parseRequestData(e);
  const eventId = data.id;
  
  const sheet = getSheet('Events');
  const rowIndex = getRowIndex(sheet, 'id', eventId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Event not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', eventId);
  if (!hasAccess(user, existing.masjid_id, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  sheet.deleteRow(rowIndex);
  
  return jsonResponse({ status: 'success', message: 'Event deleted successfully' });
}

// ============================================
// MEDIA OPERATIONS
// ============================================

function getMedia(e) {
  const masjidId = e.parameter.masjid_id;
  const type = e.parameter.type;
  const status = e.parameter.status;
  
  const sheet = getSheet('Media');
  let media = findRows(sheet, 'masjid_id', masjidId);
  
  if (type) {
    media = media.filter(m => m.file_type === type);
  }
  
  if (status === 'active') {
    media = media.filter(m => m.is_active);
  }
  
  // Sort by display_order
  media.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  
  return jsonResponse({ status: 'success', data: media });
}

function uploadMedia(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  // Upload file to Google Drive
  const fileData = Utilities.base64Decode(data.file_data);
  const blob = Utilities.newBlob(fileData, data.file_type === 'video' ? 'video/mp4' : 'image/jpeg', data.file_name);
  
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const fileId = file.getId();
  const fileUrl = 'https://drive.google.com/uc?id=' + fileId;
  
  // Save to database
  const sheet = getSheet('Media');
  const id = generateId();
  const now = new Date();
  
  const newRow = [
    id,
    masjidId,
    data.file_name,
    fileId,
    data.file_type,
    data.display_order || 0,
    data.duration_seconds || 10,
    data.is_active !== false,
    user.id,
    now,
    now
  ];
  
  sheet.appendRow(newRow);
  
  return jsonResponse({ 
    status: 'success', 
    message: 'Media uploaded successfully',
    id: id,
    google_drive_file_id: fileId,
    file_url: fileUrl
  });
}

function updateMedia(e, user) {
  const data = parseRequestData(e);
  const mediaId = data.id;
  
  const sheet = getSheet('Media');
  const rowIndex = getRowIndex(sheet, 'id', mediaId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Media not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', mediaId);
  if (!hasAccess(user, existing.masjid_id, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    file_name: data.file_name,
    display_order: data.display_order,
    duration_seconds: data.duration_seconds,
    is_active: data.is_active,
    updated_at: new Date()
  };
  
  headers.forEach((h, idx) => {
    if (updates[h] !== undefined) {
      sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
    }
  });
  
  return jsonResponse({ status: 'success', message: 'Media updated successfully' });
}

function deleteMedia(e, user) {
  const data = parseRequestData(e);
  const mediaId = data.id;
  
  const sheet = getSheet('Media');
  const rowIndex = getRowIndex(sheet, 'id', mediaId);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'Media not found' }, 404);
  }
  
  const existing = findRow(sheet, 'id', mediaId);
  if (!hasAccess(user, existing.masjid_id, 'Content Editor')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  // Delete file from Google Drive
  try {
    const file = DriveApp.getFileById(existing.google_drive_file_id);
    file.setTrashed(true);
  } catch (err) {
    Logger.log('Could not delete Drive file: ' + err);
  }
  
  sheet.deleteRow(rowIndex);
  
  return jsonResponse({ status: 'success', message: 'Media deleted successfully' });
}

// ============================================
// USERS OPERATIONS
// ============================================

function getMasjidUsers(e, user) {
  const masjidId = e.parameter.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const masjidUsersSheet = getSheet('MasjidUsers');
  const masjidUsers = findRows(masjidUsersSheet, 'masjid_id', masjidId);
  
  const usersSheet = getSheet('Users');
  const rolesSheet = getSheet('Roles');
  
  const result = masjidUsers.map(mu => {
    const userRow = findRow(usersSheet, 'id', mu.user_id);
    const roleRow = findRow(rolesSheet, 'id', mu.role_id);
    
    return {
      ...mu,
      email: userRow ? userRow.email : 'unknown',
      role_name: roleRow ? roleRow.name : 'unknown'
    };
  });
  
  return jsonResponse({ status: 'success', data: result });
}

function addMasjidUser(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Super Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  // Find or create user
  const usersSheet = getSheet('Users');
  let targetUser = findRow(usersSheet, 'email', data.user_email);
  
  if (!targetUser) {
    const userId = generateId();
    const now = new Date();
    usersSheet.appendRow([userId, data.user_email, true, now, now]);
    targetUser = { id: userId, email: data.user_email };
  }
  
  // Find role
  const rolesSheet = getSheet('Roles');
  const role = findRow(rolesSheet, 'name', data.role_name);
  
  if (!role) {
    return jsonResponse({ status: 'error', message: 'Role not found' }, 404);
  }
  
  // Check if already exists
  const masjidUsersSheet = getSheet('MasjidUsers');
  const existing = findRow(masjidUsersSheet, 'user_id', targetUser.id);
  
  if (existing && existing.masjid_id === masjidId) {
    return jsonResponse({ status: 'error', message: 'User already exists for this masjid' }, 400);
  }
  
  const id = generateId();
  const now = new Date();
  masjidUsersSheet.appendRow([id, targetUser.id, masjidId, role.id, now, now]);
  
  return jsonResponse({ 
    status: 'success', 
    message: 'User added to masjid successfully'
  });
}

function updateMasjidUserRole(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Super Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const masjidUsersSheet = getSheet('MasjidUsers');
  const rowIndex = getRowIndex(masjidUsersSheet, 'user_id', data.user_id);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'User not found for this masjid' }, 404);
  }
  
  const rolesSheet = getSheet('Roles');
  const role = findRow(rolesSheet, 'name', data.role_name);
  
  if (!role) {
    return jsonResponse({ status: 'error', message: 'Role not found' }, 404);
  }
  
  const headers = masjidUsersSheet.getRange(1, 1, 1, masjidUsersSheet.getLastColumn()).getValues()[0];
  masjidUsersSheet.getRange(rowIndex, headers.indexOf('role_id') + 1).setValue(role.id);
  masjidUsersSheet.getRange(rowIndex, headers.indexOf('updated_at') + 1).setValue(new Date());
  
  return jsonResponse({ status: 'success', message: 'User role updated successfully' });
}

function removeMasjidUser(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Super Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const masjidUsersSheet = getSheet('MasjidUsers');
  const rowIndex = getRowIndex(masjidUsersSheet, 'user_id', data.user_id);
  
  if (rowIndex === -1) {
    return jsonResponse({ status: 'error', message: 'User not found for this masjid' }, 404);
  }
  
  masjidUsersSheet.deleteRow(rowIndex);
  
  return jsonResponse({ status: 'success', message: 'User removed from masjid successfully' });
}

// ============================================
// DISPLAY SETTINGS OPERATIONS
// ============================================

function getDisplaySettings(e) {
  const masjidId = e.parameter.masjid_id;
  
  const sheet = getSheet('DisplaySettings');
  const settings = findRow(sheet, 'masjid_id', masjidId);
  
  if (!settings) {
    return jsonResponse({ status: 'error', message: 'Display settings not found' }, 404);
  }
  
  return jsonResponse({ status: 'success', data: settings });
}

function updateDisplaySettings(e, user) {
  const data = parseRequestData(e);
  const masjidId = data.masjid_id;
  
  if (!hasAccess(user, masjidId, 'Masjid Admin')) {
    return jsonResponse({ status: 'error', message: 'Insufficient permissions' }, 403);
  }
  
  const sheet = getSheet('DisplaySettings');
  const rowIndex = getRowIndex(sheet, 'masjid_id', masjidId);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updates = {
    theme_color_primary: data.theme_color_primary,
    theme_color_secondary: data.theme_color_secondary,
    font_family_main: data.font_family_main,
    logo_image_url: data.logo_image_url,
    footer_text: data.footer_text,
    updated_at: new Date()
  };
  
  if (rowIndex === -1) {
    // Insert new settings
    const newRow = [generateId(), masjidId];
    headers.forEach((h, idx) => {
      if (idx > 1 && updates[h] !== undefined) {
        newRow.push(updates[h]);
      } else if (idx > 1) {
        newRow.push('');
      }
    });
    sheet.appendRow(newRow);
  } else {
    // Update existing settings
    headers.forEach((h, idx) => {
      if (updates[h] !== undefined) {
        sheet.getRange(rowIndex, idx + 1).setValue(updates[h]);
      }
    });
  }
  
  return jsonResponse({ status: 'success', message: 'Display settings updated successfully' });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================
// SETUP FUNCTION
// ============================================

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create sheets if they don't exist
  const sheetsConfig = [
    { name: 'Roles', headers: ['id', 'name'] },
    { name: 'Masjids', headers: ['id', 'name', 'location_address', 'latitude', 'longitude', 'timezone', 'created_at', 'updated_at'] },
    { name: 'Users', headers: ['id', 'email', 'is_active', 'created_at', 'updated_at'] },
    { name: 'MasjidUsers', headers: ['id', 'user_id', 'masjid_id', 'role_id', 'created_at', 'updated_at'] },
    { name: 'PrayerTimesConfigs', headers: ['id', 'masjid_id', 'calculation_method', 'madhab', 'high_latitude_rule', 'fajr_adjustment_minutes', 'dhuhr_adjustment_minutes', 'asr_adjustment_minutes', 'maghrib_adjustment_minutes', 'isha_adjustment_minutes', 'iqamah_fajr_minutes', 'iqamah_dhuhr_minutes', 'iqamah_asr_minutes', 'iqamah_maghrib_minutes', 'iqamah_isha_minutes', 'created_at', 'updated_at'] },
    { name: 'Announcements', headers: ['id', 'masjid_id', 'title', 'content', 'image_url', 'start_date', 'end_date', 'is_active', 'created_by_user_id', 'created_at', 'updated_at'] },
    { name: 'Events', headers: ['id', 'masjid_id', 'title', 'speaker', 'date', 'time', 'location', 'description', 'is_active', 'created_by_user_id', 'created_at', 'updated_at'] },
    { name: 'Media', headers: ['id', 'masjid_id', 'file_name', 'google_drive_file_id', 'file_type', 'display_order', 'duration_seconds', 'is_active', 'created_by_user_id', 'created_at', 'updated_at'] },
    { name: 'DisplaySettings', headers: ['id', 'masjid_id', 'theme_color_primary', 'theme_color_secondary', 'font_family_main', 'logo_image_url', 'footer_text', 'created_at', 'updated_at'] }
  ];
  
  sheetsConfig.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    }
  });
  
  // Add default roles
  const rolesSheet = ss.getSheetByName('Roles');
  const existingRoles = rolesSheet.getDataRange().getValues();
  
  if (existingRoles.length <= 1) {
    const defaultRoles = [
      [generateId(), 'Super Admin'],
      [generateId(), 'Masjid Admin'],
      [generateId(), 'Content Editor'],
      [generateId(), 'Viewer']
    ];
    rolesSheet.getRange(2, 1, defaultRoles.length, 2).setValues(defaultRoles);
  }
  
  Logger.log('Database setup completed!');
}

// Run this function first to setup the database
function initializeApp() {
  setupDatabase();
  Logger.log('App initialized successfully!');
}
