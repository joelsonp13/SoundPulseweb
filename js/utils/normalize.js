/* ====================================
   NORMALIZE - Converter dados ytmusicapi para formato frontend
   ==================================== */

/**
 * Normalizar track do backend para formato esperado
 * @param {Object} ytTrack - Dados brutos da track do backend
 * @param {string|null} fallbackImage - Imagem a usar quando track não tem thumbnails (útil para álbuns)
 */
export function normalizeTrack(ytTrack, fallbackImage = null) {
    if (!ytTrack) return null;

    const artistNames = Array.isArray(ytTrack.artists)
        ? ytTrack.artists.map(a => a?.name).filter(Boolean)
        : [];
    const artistEntities = Array.isArray(ytTrack.artists)
        ? ytTrack.artists.map(a => ({ id: a?.id, name: a?.name })).filter(a => a.name)
        : [];
    const primaryArtist = artistNames[0] || ytTrack.artist || 'Unknown Artist';
    
    // Converter duração se vier como string "3:45"
    let duration = ytTrack.duration || ytTrack.duration_seconds || 0;
    if (typeof duration === 'string') {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
            duration = parts[0] * 60 + parts[1]; // MM:SS
        } else if (parts.length === 3) {
            duration = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        }
    }

    // 🐛 DEBUG: Ver thumbnails
    console.log('📸 Track thumbnails:', ytTrack.thumbnails);
    console.log('📸 Track thumbnail:', ytTrack.thumbnail);
    console.log('📸 Fallback image:', fallbackImage);
    const trackImage = getThumbnail(ytTrack.thumbnails || ytTrack.thumbnail);
    console.log('📸 Parsed track image:', trackImage);
    
    // Se não tem imagem própria e tem fallback, usar fallback
    const finalImage = (trackImage === 'assets/images/covers/placeholder.svg' && fallbackImage) 
        ? fallbackImage 
        : trackImage;
    console.log('📸 Final track image:', finalImage);

    return {
        id: ytTrack.videoId || ytTrack.id,
        videoId: ytTrack.videoId || ytTrack.id,
        title: ytTrack.title || 'Unknown Title',
        artist: primaryArtist,
        artistName: primaryArtist, // Player usa artistName
        artistId: ytTrack.artists?.[0]?.id,
        artistNames: artistNames, // todos os artistas (nomes)
        artistEntities: artistEntities, // todos os artistas (id e nome)
        artistsDisplay: artistNames.length ? artistNames.join(', ') : primaryArtist,
        album: ytTrack.album?.name || ytTrack.album || '',
        albumId: ytTrack.album?.id,
        image: finalImage,
        duration: duration,
        year: ytTrack.year,
        isExplicit: ytTrack.isExplicit || false,
        browseId: ytTrack.browseId,
        type: 'song'
    };
}

/**
 * Normalizar artist do backend
 */
export function normalizeArtist(ytArtist, opts = {}) {
    if (!ytArtist) return null;

    // 🐛 DEBUG: Ver estrutura real dos dados do backend
    console.log('🎤 Dados brutos do artista:', ytArtist);

    // O browseId do artista pode vir como browseId, id ou channelId
    const artistId = ytArtist.browseId || ytArtist.id || ytArtist.channelId;

    return {
        id: artistId,
        browseId: artistId,
        channelId: ytArtist.channelId,
        name: ytArtist.name || ytArtist.artist || 'Unknown Artist',
        image: getThumbnail(ytArtist.thumbnails || ytArtist.thumbnail, opts.hero ? 'hero' : undefined),
        subscribers: ytArtist.subscribers,
        description: ytArtist.description,
        type: 'artist',
        verified: true
    };
}

/**
 * Normalizar album do backend
 */
export function normalizeAlbum(ytAlbum) {
    if (!ytAlbum) return null;

    return {
        id: ytAlbum.browseId || ytAlbum.id,
        browseId: ytAlbum.browseId || ytAlbum.id,
        title: ytAlbum.title || ytAlbum.name || 'Unknown Album',
        artist: ytAlbum.artists?.[0]?.name || ytAlbum.artist || '',
        artistId: ytAlbum.artists?.[0]?.id,
        image: getThumbnail(ytAlbum.thumbnails || ytAlbum.thumbnail),
        year: ytAlbum.year,
        trackCount: ytAlbum.trackCount || ytAlbum.tracks?.length || 0,
        duration: ytAlbum.duration,
        type: 'album'
    };
}

/**
 * Normalizar playlist do backend
 */
export function normalizePlaylist(ytPlaylist) {
    if (!ytPlaylist) return null;

    // Extrair nome do autor (pode vir como dict ou string)
    let author = ytPlaylist.author?.name || ytPlaylist.author || '';
    
    // Filtrar "YouTube Music" - remover marca
    if (author === 'YouTube Music') {
        author = '';
    }

    return {
        id: ytPlaylist.browseId || ytPlaylist.id,
        browseId: ytPlaylist.browseId || ytPlaylist.id,
        title: ytPlaylist.title || ytPlaylist.name || 'Unknown Playlist',
        description: ytPlaylist.description || '',
        image: getThumbnail(ytPlaylist.thumbnails || ytPlaylist.thumbnail),
        trackCount: ytPlaylist.trackCount || ytPlaylist.tracks?.length || 0,
        author: author,
        type: 'playlist'
    };
}

/**
 * Normalizar array de tracks
 * @param {Array} ytTracks - Array de tracks brutas do backend
 * @param {string|null} fallbackImage - Imagem a usar quando tracks não têm thumbnails (útil para álbuns)
 */
export function normalizeTracks(ytTracks, fallbackImage = null) {
    if (!Array.isArray(ytTracks)) return [];
    return ytTracks.map(track => normalizeTrack(track, fallbackImage)).filter(Boolean);
}

/**
 * Normalizar array de artists
 */
export function normalizeArtists(ytArtists) {
    if (!Array.isArray(ytArtists)) return [];
    return ytArtists.map(normalizeArtist).filter(Boolean);
}

/**
 * Normalizar array de albums
 */
export function normalizeAlbums(ytAlbums) {
    if (!Array.isArray(ytAlbums)) return [];
    return ytAlbums.map(normalizeAlbum).filter(Boolean);
}

/**
 * Normalizar array de playlists
 */
export function normalizePlaylists(ytPlaylists) {
    if (!Array.isArray(ytPlaylists)) return [];
    return ytPlaylists.map(normalizePlaylist).filter(Boolean);
}

/**
 * Normalizar resultados de busca
 */
export function normalizeSearchResults(results) {
    if (!results || !results.results) return [];
    
    return results.results.map(item => {
        switch (item.resultType || item.category) {
            case 'song':
            case 'video':
                return normalizeTrack(item);
            case 'artist':
                return normalizeArtist(item);
            case 'album':
                return normalizeAlbum(item);
            case 'playlist':
                return normalizePlaylist(item);
            default:
                return null;
        }
    }).filter(Boolean);
}

/**
 * Helper: Pegar melhor thumbnail disponível com resolução otimizada
 * 🚀 OTIMIZADO: 300x300 = qualidade boa + velocidade alta
 */
export function getThumbnail(thumbnails, mode) {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
        return 'assets/images/covers/placeholder.svg';
    }

    // ytmusicapi retorna thumbnails ordenadas: menor → maior
    // Pegar a última (melhor qualidade disponível)
    const index = thumbnails.length - 1;
    const bestThumb = thumbnails[index];
    let url = bestThumb?.url || bestThumb;
    if (!url || url === 'assets/images/covers/placeholder.svg') {
        return 'assets/images/covers/placeholder.svg';
    }
    
    // 👉 Se for para HERO, usar resolução maior
    if (mode === 'hero') {
        url = url.replace(/=w\d+-h\d+/g, '=w600-h600');
    } else {
    // 🚀 PERFORMANCE EXTREMA: 250x250 = qualidade excelente + máxima velocidade
    url = url.replace(/=w\d+-h\d+/g, '=w250-h250');
    }
    return url;
}

/**
 * Helper: Formatar duração de segundos para MM:SS
 */
export function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper: Formatar número com separador de milhares
 */
export function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

