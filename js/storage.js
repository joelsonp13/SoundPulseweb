/* ====================================
   LOCAL STORAGE MANAGER
   ==================================== */

const STORAGE_KEYS = {
    LIKED_TRACKS: 'soundpulse_liked_tracks',
    LIKED_ALBUMS: 'soundpulse_liked_albums',
    LIKED_ARTISTS: 'soundpulse_liked_artists',
    USER_PLAYLISTS: 'soundpulse_user_playlists',
    RECENT_TRACKS: 'soundpulse_recent_tracks',
    QUEUE: 'soundpulse_queue',
    CURRENT_TRACK: 'soundpulse_current_track',
    VOLUME: 'soundpulse_volume',
    REPEAT_MODE: 'soundpulse_repeat_mode',
    SHUFFLE: 'soundpulse_shuffle',
    THEME: 'soundpulse_theme',
    SETTINGS: 'soundpulse_settings',
    USER_PROFILE: 'soundpulse_user_profile'
};

// ============ GENERIC STORAGE FUNCTIONS ============

function getItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error getting item ${key}:`, error);
        return defaultValue;
    }
}

function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error setting item ${key}:`, error);
        return false;
    }
}

function removeItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Error removing item ${key}:`, error);
        return false;
    }
}

// ============ LIKED TRACKS ============

export function getLikedTracks() {
    return getItem(STORAGE_KEYS.LIKED_TRACKS, []);
}

export function isTrackLiked(trackId) {
    const liked = getLikedTracks();
    return liked.includes(trackId);
}

export function likeTrack(trackId) {
    const liked = getLikedTracks();
    if (!liked.includes(trackId)) {
        liked.push(trackId);
        setItem(STORAGE_KEYS.LIKED_TRACKS, liked);
        return true;
    }
    return false;
}

export function unlikeTrack(trackId) {
    const liked = getLikedTracks();
    const index = liked.indexOf(trackId);
    if (index > -1) {
        liked.splice(index, 1);
        setItem(STORAGE_KEYS.LIKED_TRACKS, liked);
        return true;
    }
    return false;
}

export function toggleLikeTrack(trackId) {
    if (isTrackLiked(trackId)) {
        unlikeTrack(trackId);
        return false;
    } else {
        likeTrack(trackId);
        return true;
    }
}

// ============ LIKED ALBUMS ============

export function getLikedAlbums() {
    return getItem(STORAGE_KEYS.LIKED_ALBUMS, []);
}

export function isAlbumLiked(albumId) {
    const liked = getLikedAlbums();
    return liked.includes(albumId);
}

export function likeAlbum(albumId) {
    const liked = getLikedAlbums();
    if (!liked.includes(albumId)) {
        liked.push(albumId);
        setItem(STORAGE_KEYS.LIKED_ALBUMS, liked);
        return true;
    }
    return false;
}

export function unlikeAlbum(albumId) {
    const liked = getLikedAlbums();
    const index = liked.indexOf(albumId);
    if (index > -1) {
        liked.splice(index, 1);
        setItem(STORAGE_KEYS.LIKED_ALBUMS, liked);
        return true;
    }
    return false;
}

export function toggleLikeAlbum(albumId) {
    if (isAlbumLiked(albumId)) {
        unlikeAlbum(albumId);
        return false;
    } else {
        likeAlbum(albumId);
        return true;
    }
}

// ============ FOLLOWED ARTISTS ============

export function getFollowedArtists() {
    return getItem(STORAGE_KEYS.LIKED_ARTISTS, []);
}

export function isArtistFollowed(artistId) {
    const followed = getFollowedArtists();
    return followed.includes(artistId);
}

export function followArtist(artistId) {
    const followed = getFollowedArtists();
    if (!followed.includes(artistId)) {
        followed.push(artistId);
        setItem(STORAGE_KEYS.LIKED_ARTISTS, followed);
        return true;
    }
    return false;
}

export function unfollowArtist(artistId) {
    const followed = getFollowedArtists();
    const index = followed.indexOf(artistId);
    if (index > -1) {
        followed.splice(index, 1);
        setItem(STORAGE_KEYS.LIKED_ARTISTS, followed);
        return true;
    }
    return false;
}

export function toggleFollowArtist(artistId) {
    if (isArtistFollowed(artistId)) {
        unfollowArtist(artistId);
        return false;
    } else {
        followArtist(artistId);
        return true;
    }
}

// ============ USER PLAYLISTS ============

export function getUserPlaylists() {
    return getItem(STORAGE_KEYS.USER_PLAYLISTS, []);
}

export function getPlaylistById(playlistId) {
    const playlists = getUserPlaylists();
    return playlists.find(p => p.id === playlistId);
}

export function createPlaylist(name, description = '', isPublic = true) {
    const playlists = getUserPlaylists();
    const newPlaylist = {
        id: `user-playlist-${Date.now()}`,
        title: name,
        description: description,
        image: null,
        owner: 'Você',
        public: isPublic,
        collaborative: false,
        followers: 0,
        trackIds: [],
        totalTracks: 0,
        duration: 0,
        type: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    playlists.push(newPlaylist);
    setItem(STORAGE_KEYS.USER_PLAYLISTS, playlists);
    return newPlaylist;
}

export function updatePlaylist(playlistId, updates) {
    const playlists = getUserPlaylists();
    const index = playlists.findIndex(p => p.id === playlistId);
    if (index > -1) {
        playlists[index] = {
            ...playlists[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        setItem(STORAGE_KEYS.USER_PLAYLISTS, playlists);
        return playlists[index];
    }
    return null;
}

export function deletePlaylist(playlistId) {
    const playlists = getUserPlaylists();
    const filtered = playlists.filter(p => p.id !== playlistId);
    if (filtered.length < playlists.length) {
        setItem(STORAGE_KEYS.USER_PLAYLISTS, filtered);
        return true;
    }
    return false;
}

export function addTrackToPlaylist(playlistId, trackId) {
    const playlist = getPlaylistById(playlistId);
    if (playlist && !playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        playlist.totalTracks = playlist.trackIds.length;
        updatePlaylist(playlistId, playlist);
        return true;
    }
    return false;
}

export function removeTrackFromPlaylist(playlistId, trackId) {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
        const index = playlist.trackIds.indexOf(trackId);
        if (index > -1) {
            playlist.trackIds.splice(index, 1);
            playlist.totalTracks = playlist.trackIds.length;
            updatePlaylist(playlistId, playlist);
            return true;
        }
    }
    return false;
}

export function reorderPlaylistTracks(playlistId, fromIndex, toIndex) {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
        const tracks = [...playlist.trackIds];
        const [removed] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, removed);
        playlist.trackIds = tracks;
        updatePlaylist(playlistId, playlist);
        return true;
    }
    return false;
}

// ============ RECENT TRACKS ============

export function getRecentTracks() {
    return getItem(STORAGE_KEYS.RECENT_TRACKS, []);
}

export function addToRecentTracks(trackId) {
    const recent = getRecentTracks();
    // Remove if already exists
    const index = recent.indexOf(trackId);
    if (index > -1) {
        recent.splice(index, 1);
    }
    // Add to beginning
    recent.unshift(trackId);
    // Keep only last 100
    if (recent.length > 100) {
        recent.splice(100);
    }
    setItem(STORAGE_KEYS.RECENT_TRACKS, recent);
}

export function clearRecentTracks() {
    setItem(STORAGE_KEYS.RECENT_TRACKS, []);
}

// ============ QUEUE ============

export function getQueue() {
    return getItem(STORAGE_KEYS.QUEUE, []);
}

export function setQueue(trackIds) {
    setItem(STORAGE_KEYS.QUEUE, trackIds);
}

export function addToQueue(trackId) {
    const queue = getQueue();
    queue.push(trackId);
    setQueue(queue);
}

export function removeFromQueue(index) {
    const queue = getQueue();
    if (index >= 0 && index < queue.length) {
        queue.splice(index, 1);
        setQueue(queue);
        return true;
    }
    return false;
}

export function clearQueue() {
    setQueue([]);
}

// ============ PLAYER STATE ============

export function getCurrentTrack() {
    return getItem(STORAGE_KEYS.CURRENT_TRACK);
}

export function setCurrentTrack(trackId) {
    setItem(STORAGE_KEYS.CURRENT_TRACK, trackId);
}

export function getVolume() {
    return getItem(STORAGE_KEYS.VOLUME, 100);
}

export function setVolume(volume) {
    setItem(STORAGE_KEYS.VOLUME, Math.max(0, Math.min(100, volume)));
}

export function getRepeatMode() {
    return getItem(STORAGE_KEYS.REPEAT_MODE, 'off'); // 'off', 'all', 'one'
}

export function setRepeatMode(mode) {
    if (['off', 'all', 'one'].includes(mode)) {
        setItem(STORAGE_KEYS.REPEAT_MODE, mode);
    }
}

export function getShuffle() {
    return getItem(STORAGE_KEYS.SHUFFLE, false);
}

export function setShuffle(enabled) {
    setItem(STORAGE_KEYS.SHUFFLE, Boolean(enabled));
}

// ============ THEME ============

export function getTheme() {
    return getItem(STORAGE_KEYS.THEME, 'dark'); // 'dark', 'light', 'auto'
}

export function setTheme(theme) {
    if (['dark', 'light', 'auto'].includes(theme)) {
        setItem(STORAGE_KEYS.THEME, theme);
        applyTheme(theme);
    }
}

function applyTheme(theme) {
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    document.body.setAttribute('data-theme', theme);
}

// ============ SETTINGS ============

export function getSettings() {
    return getItem(STORAGE_KEYS.SETTINGS, {
        audioQuality: 'high', // 'low', 'normal', 'high', 'lossless'
        crossfade: false,
        gaplessPlayback: true,
        normalizeVolume: false,
        autoplay: true,
        showLyrics: true,
        language: 'pt-BR',
        notifications: true
    });
}

export function updateSettings(updates) {
    const settings = getSettings();
    const newSettings = { ...settings, ...updates };
    setItem(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
}

// ============ USER PROFILE ============

export function getUserProfile() {
    return getItem(STORAGE_KEYS.USER_PROFILE, {
        name: 'Usuário',
        email: 'usuario@soundpulse.com',
        avatar: null,
        isPremium: false,
        joinedDate: new Date().toISOString()
    });
}

export function updateUserProfile(updates) {
    const profile = getUserProfile();
    const newProfile = { ...profile, ...updates };
    setItem(STORAGE_KEYS.USER_PROFILE, newProfile);
    return newProfile;
}

// ============ CLEAR ALL DATA ============

export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        removeItem(key);
    });
}

// ============ INITIALIZE ============

export function initializeStorage() {
    // Apply saved theme
    const theme = getTheme();
    applyTheme(theme);
    
    // Initialize volume
    const volume = getVolume();
    
    return {
        theme,
        volume,
        settings: getSettings(),
        profile: getUserProfile()
    };
}

// Export all
export default {
    getLikedTracks,
    isTrackLiked,
    likeTrack,
    unlikeTrack,
    toggleLikeTrack,
    getLikedAlbums,
    isAlbumLiked,
    likeAlbum,
    unlikeAlbum,
    toggleLikeAlbum,
    getFollowedArtists,
    isArtistFollowed,
    followArtist,
    unfollowArtist,
    toggleFollowArtist,
    getUserPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    getRecentTracks,
    addToRecentTracks,
    clearRecentTracks,
    getQueue,
    setQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getCurrentTrack,
    setCurrentTrack,
    getVolume,
    setVolume,
    getRepeatMode,
    setRepeatMode,
    getShuffle,
    setShuffle,
    getTheme,
    setTheme,
    getSettings,
    updateSettings,
    getUserProfile,
    updateUserProfile,
    clearAllData,
    initializeStorage
};

