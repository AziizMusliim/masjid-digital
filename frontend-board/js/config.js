// ============================================
// BOARD CONFIGURATION
// Update these values with your actual configuration
// ============================================

const BOARD_CONFIG = {
    // Google Apps Script Web App URL
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwGx4riyYARkVto4cpcPM8jvsJnlhf0zk97nTTWZLnkLvYx4dbAEdiJC6IZh_y1VyAA/exec',
    
    // Masjid ID (from your Google Sheets database)
    masjidId: '1c5azS5Gy4KpxfaOQZAn0Vk4s4GDUCVrY9O1WRMZOGWE',
    
    // Refresh interval in milliseconds (default: 5 minutes)
    refreshInterval: 5 * 60 * 1000,
    
    // Slideshow interval in milliseconds (default: 10 seconds)
    slideshowInterval: 10 * 1000,
    
    // Show Islamic quotes in slideshow
    showQuotes: true,
    
    // Default display settings (will be overridden by database)
    defaults: {
        themeColorPrimary: '#00563F',
        themeColorSecondary: '#DAA520',
        fontFamilyMain: 'Roboto',
        footerText: 'Semoga Allah memberkahi kita semua.'
    }
};

// Islamic Quotes for slideshow
const ISLAMIC_QUOTES = [
    {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang'
    },
    {
        arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        translation: 'Sesungguhnya bersama kesulitan ada kemudahan (QS. Al-Insyirah: 6)'
    },
    {
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        translation: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat, dan peliharalah kami dari siksa neraka (QS. Al-Baqarah: 201)'
    },
    {
        arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
        translation: 'Dan katakanlah: "Ya Tuhan tambahkanlah ilmu kepadaku" (QS. Thaha: 114)'
    },
    {
        arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
        translation: 'Sesungguhnya Allah beserta orang-orang yang sabar (QS. Al-Baqarah: 153)'
    },
    {
        arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',
        translation: 'Dan janganlah kamu berputus asa dari rahmat Allah (QS. Yusuf: 87)'
    },
    {
        arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
        translation: 'Maka nikmat Tuhanmu yang manakah yang kamu dustakan? (QS. Ar-Rahman)'
    },
    {
        arabic: 'وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ ۖ لَّا إِلَٰهَ إِلَّا هُوَ الرَّحْمَٰنُ الرَّحِيمُ',
        translation: 'Dan Tuhan kamu adalah Tuhan Yang Maha Esa, tidak ada Tuhan selain Dia, Yang Maha Pengasih lagi Maha Penyayang (QS. Al-Baqarah: 163)'
    }
];
