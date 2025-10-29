/* ====================================
   NORMALIZE - Converter dados ytmusicapi para formato frontend
   ==================================== */

/**
 * Normalizar track do backend para formato esperado
 */
export function normalizeTrack(ytTrack) {
    if (!ytTrack) return null;

    // Pegar TODOS os artistas, não só o primeiro
    const rawArtists = ytTrack.artists || [];
    
    // Processar cada artista (mas eles não têm thumbnails no ytmusicapi)
    // Só têm id e name. Imagens serão buscadas via API quando necessário.
    const allArtists = rawArtists.map(artist => ({
        id: artist.id,
        name: artist.name
    }));
    
    const artistNames = allArtists.map(a => a.name).filter(Boolean);
    const artistName = artistNames.length > 0 
        ? artistNames.join(', ') 
        : (ytTrack.artist || 'Unknown Artist');
    
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

    return {
        id: ytTrack.videoId || ytTrack.id,
        videoId: ytTrack.videoId || ytTrack.id,
        title: ytTrack.title || 'Unknown Title',
        artist: artistName,
        artistName: artistName, // Agora contém "Artista 1, Artista 2, Artista 3"
        artistId: ytTrack.artists?.[0]?.id,
        allArtists: allArtists, // NOVO: Array completo para referência
        album: ytTrack.album?.name || ytTrack.album || '',
        albumId: ytTrack.album?.id,
        image: getThumbnail(ytTrack.thumbnails || ytTrack.thumbnail),
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
export function normalizeArtist(ytArtist) {
    if (!ytArtist) return null;

    // O browseId do artista pode vir como browseId, id ou channelId
    const artistId = ytArtist.browseId || ytArtist.id || ytArtist.channelId;
    
    // 🔍 VALIDAÇÃO: Garantir que temos um ID válido
    if (!artistId) {
        console.warn('⚠️ Artista sem ID válido:', ytArtist);
        return null;
    }

    // 🔍 VALIDAÇÃO: Verificar consistência de IDs
    const channelId = ytArtist.channelId;
    if (channelId && channelId !== artistId) {
        console.warn(`⚠️ Inconsistência de ID detectada na normalização:`);
        console.warn(`   artistId: ${artistId}`);
        console.warn(`   channelId: ${channelId}`);
        console.warn(`   name: ${ytArtist.name || 'N/A'}`);
    }

    return {
        id: artistId,
        browseId: artistId,
        channelId: channelId || artistId, // Usar channelId se disponível, senão usar artistId
        name: ytArtist.name || ytArtist.artist || 'Unknown Artist',
        image: getThumbnail(ytArtist.thumbnails || ytArtist.thumbnail),
        subscribers: ytArtist.subscribers,
        description: ytArtist.description,
        type: 'artist',
        verified: true,
        // 🔍 DEBUG: Manter IDs originais para debug
        _debug: {
            originalBrowseId: ytArtist.browseId,
            originalId: ytArtist.id,
            originalChannelId: ytArtist.channelId
        }
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
        artist: ytAlbum.artists?.[0]?.name || ytAlbum.artist || 'Unknown Artist',
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

    return {
        id: ytPlaylist.browseId || ytPlaylist.id,
        browseId: ytPlaylist.browseId || ytPlaylist.id,
        title: ytPlaylist.title || ytPlaylist.name || 'Unknown Playlist',
        description: ytPlaylist.description || '',
        image: getThumbnail(ytPlaylist.thumbnails || ytPlaylist.thumbnail),
        trackCount: ytPlaylist.trackCount || ytPlaylist.tracks?.length || 0,
        author: ytPlaylist.author?.name || ytPlaylist.author || 'YouTube Music',
        type: 'playlist'
    };
}

/**
 * Normalizar array de tracks
 */
export function normalizeTracks(ytTracks) {
    if (!Array.isArray(ytTracks)) return [];
    return ytTracks.map(normalizeTrack).filter(Boolean);
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
 * 🚀 OTIMIZADO: Tamanhos inteligentes baseados no uso
 */
export function getThumbnail(thumbnails, size = 'medium') {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
        return 'assets/images/covers/placeholder.svg';
    }

    // 🚀 OTIMIZAÇÃO: Tamanhos otimizados para performance
    const sizes = {
        small: 120,   // Cards pequenos, greeting grid
        medium: 250,  // Cards normais, carousels (default)
        large: 500    // Hero, fullscreen, detalhes
    };
    
    const targetSize = sizes[size] || sizes.medium;
    
    // Escolher thumbnail mais próxima do tamanho desejado (não sempre a maior!)
    let selectedThumb = thumbnails[0];
    for (const thumb of thumbnails) {
        if (thumb.width && thumb.width >= targetSize) {
            selectedThumb = thumb;
            break;
        }
    }
    
    let url = selectedThumb?.url || selectedThumb;
    
    if (!url || url === 'assets/images/covers/placeholder.svg') {
        return 'assets/images/covers/placeholder.svg';
    }
    
    // 🚀 OTIMIZAÇÃO: Forçar tamanho específico na URL do YouTube
    // Reduz tráfego em até 80%!
    url = url.replace(/=w\d+-h\d+/g, `=w${targetSize}-h${targetSize}`)
             .replace(/=s\d+/g, `=s${targetSize}`);
    
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

