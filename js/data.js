/* ====================================
   ⚠️ DEPRECATED - Este arquivo não é mais usado!
   
   O site agora usa dados REAIS do backend (ytmusicapi).
   Este arquivo é mantido apenas para compatibilidade.
   
   USE: import api from './utils/api.js'
   ==================================== */

// ============ ARTISTAS ============
export const artists = [
    {
        id: 'artist-1',
        name: 'The Weeknd',
        type: 'Artista',
        image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
        verified: true,
        monthlyListeners: 87500000,
        followers: 45000000,
        bio: 'Abel Makkonen Tesfaye, conhecido profissionalmente como The Weeknd, é um cantor, compositor e produtor canadense. Conhecido por sua versatilidade sônica e lirismo obscuro, seu trabalho explora hedonismo, melancolia e romance.',
        genres: ['Pop', 'R&B', 'Alternative']
    },
    {
        id: 'artist-2',
        name: 'Ed Sheeran',
        type: 'Artista',
        image: 'https://i.scdn.co/image/ab6761610000e5eb4d2f80cefbccdd9b0f4912d5',
        verified: true,
        monthlyListeners: 75000000,
        followers: 42000000,
        bio: 'Edward Christopher Sheeran é um cantor, compositor, guitarrista, produtor musical e ator britânico. Conhecido por suas baladas emotivas e performances acústicas íntimas.',
        genres: ['Pop', 'Folk', 'Acoustic']
    },
    {
        id: 'artist-3',
        name: 'Dua Lipa',
        type: 'Artista',
        image: 'https://i.scdn.co/image/ab6761610000e5eb0a00c3f58d83c643a6e05a37',
        verified: true,
        monthlyListeners: 70000000,
        followers: 38000000,
        bio: 'Dua Lipa é uma cantora e compositora britânica de ascendência albanesa. Seu estilo musical é descrito como dark pop, disco e electropop.',
        genres: ['Pop', 'Dance', 'Disco']
    },
    {
        id: 'artist-4',
        name: 'Drake',
        type: 'Artista',
        image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
        verified: true,
        monthlyListeners: 82000000,
        followers: 50000000,
        bio: 'Aubrey Drake Graham é um rapper, cantor, compositor, ator e empresário canadense. Uma figura influente na música popular contemporânea.',
        genres: ['Hip-Hop', 'Rap', 'R&B']
    },
    {
        id: 'artist-5',
        name: 'Taylor Swift',
        type: 'Artista',
        image: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0',
        verified: true,
        monthlyListeners: 85000000,
        followers: 48000000,
        bio: 'Taylor Alison Swift é uma cantora e compositora americana. Narrativa detalhada de sua vida pessoal é destaque em suas músicas.',
        genres: ['Pop', 'Country', 'Rock']
    }
];

// ============ ÁLBUNS ============
export const albums = [
    {
        id: 'album-1',
        title: 'After Hours',
        artistId: 'artist-1',
        artistName: 'The Weeknd',
        image: 'https://i.scdn.co/image/ab67616d0000b273ef6b4c3e96ca6bb5f2b45b8b',
        releaseDate: '2020-03-20',
        year: 2020,
        totalTracks: 14,
        duration: 3378, // segundos
        genre: 'R&B',
        label: 'XO/Republic Records',
        type: 'Álbum'
    },
    {
        id: 'album-2',
        title: '÷ (Divide)',
        artistId: 'artist-2',
        artistName: 'Ed Sheeran',
        image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
        releaseDate: '2017-03-03',
        year: 2017,
        totalTracks: 16,
        duration: 3520,
        genre: 'Pop',
        label: 'Atlantic Records',
        type: 'Álbum'
    },
    {
        id: 'album-3',
        title: 'Future Nostalgia',
        artistId: 'artist-3',
        artistName: 'Dua Lipa',
        image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02',
        releaseDate: '2020-03-27',
        year: 2020,
        totalTracks: 11,
        duration: 2224,
        genre: 'Pop',
        label: 'Warner Records',
        type: 'Álbum'
    },
    {
        id: 'album-4',
        title: 'Certified Lover Boy',
        artistId: 'artist-4',
        artistName: 'Drake',
        image: 'https://i.scdn.co/image/ab67616d0000b2739cbdd3d12420a053ed7a3e77',
        releaseDate: '2021-09-03',
        year: 2021,
        totalTracks: 21,
        duration: 5183,
        genre: 'Hip-Hop',
        label: 'OVO Sound',
        type: 'Álbum'
    },
    {
        id: 'album-5',
        title: 'Midnights',
        artistId: 'artist-5',
        artistName: 'Taylor Swift',
        image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02',
        releaseDate: '2022-10-21',
        year: 2022,
        totalTracks: 13,
        duration: 2671,
        genre: 'Pop',
        label: 'Republic Records',
        type: 'Álbum'
    }
];

// ============ MÚSICAS ============
export const tracks = [
    // After Hours - The Weeknd
    { id: 'track-1', title: 'Blinding Lights', artistId: 'artist-1', artistName: 'The Weeknd', albumId: 'album-1', albumName: 'After Hours', image: 'https://i.scdn.co/image/ab67616d0000b273ef6b4c3e96ca6bb5f2b45b8b', duration: 200, genre: 'R&B', releaseDate: '2020-03-20', popularity: 98, audioUrl: 'assets/audio/samples/track1.mp3' },
    { id: 'track-2', title: 'Save Your Tears', artistId: 'artist-1', artistName: 'The Weeknd', albumId: 'album-1', albumName: 'After Hours', image: 'https://i.scdn.co/image/ab67616d0000b273ef6b4c3e96ca6bb5f2b45b8b', duration: 215, genre: 'R&B', releaseDate: '2020-03-20', popularity: 95, audioUrl: 'assets/audio/samples/track2.mp3' },
    { id: 'track-3', title: 'After Hours', artistId: 'artist-1', artistName: 'The Weeknd', albumId: 'album-1', albumName: 'After Hours', image: 'https://i.scdn.co/image/ab67616d0000b273ef6b4c3e96ca6bb5f2b45b8b', duration: 361, genre: 'R&B', releaseDate: '2020-03-20', popularity: 89, audioUrl: 'assets/audio/samples/track3.mp3' },
    { id: 'track-4', title: 'In Your Eyes', artistId: 'artist-1', artistName: 'The Weeknd', albumId: 'album-1', albumName: 'After Hours', image: 'https://i.scdn.co/image/ab67616d0000b273ef6b4c3e96ca6bb5f2b45b8b', duration: 237, genre: 'R&B', releaseDate: '2020-03-20', popularity: 91, audioUrl: 'assets/audio/samples/track4.mp3' },
    
    // Divide - Ed Sheeran
    { id: 'track-5', title: 'Shape of You', artistId: 'artist-2', artistName: 'Ed Sheeran', albumId: 'album-2', albumName: '÷ (Divide)', image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', duration: 233, genre: 'Pop', releaseDate: '2017-03-03', popularity: 97, audioUrl: 'assets/audio/samples/track5.mp3' },
    { id: 'track-6', title: 'Castle on the Hill', artistId: 'artist-2', artistName: 'Ed Sheeran', albumId: 'album-2', albumName: '÷ (Divide)', image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', duration: 261, genre: 'Pop', releaseDate: '2017-03-03', popularity: 92, audioUrl: 'assets/audio/samples/track6.mp3' },
    { id: 'track-7', title: 'Perfect', artistId: 'artist-2', artistName: 'Ed Sheeran', albumId: 'album-2', albumName: '÷ (Divide)', image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', duration: 263, genre: 'Pop', releaseDate: '2017-03-03', popularity: 96, audioUrl: 'assets/audio/samples/track7.mp3' },
    { id: 'track-8', title: 'Galway Girl', artistId: 'artist-2', artistName: 'Ed Sheeran', albumId: 'album-2', albumName: '÷ (Divide)', image: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', duration: 170, genre: 'Folk', releaseDate: '2017-03-03', popularity: 88, audioUrl: 'assets/audio/samples/track8.mp3' },
    
    // Future Nostalgia - Dua Lipa
    { id: 'track-9', title: 'Don\'t Start Now', artistId: 'artist-3', artistName: 'Dua Lipa', albumId: 'album-3', albumName: 'Future Nostalgia', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 183, genre: 'Pop', releaseDate: '2020-03-27', popularity: 94, audioUrl: 'assets/audio/samples/track9.mp3' },
    { id: 'track-10', title: 'Levitating', artistId: 'artist-3', artistName: 'Dua Lipa', albumId: 'album-3', albumName: 'Future Nostalgia', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 203, genre: 'Pop', releaseDate: '2020-03-27', popularity: 96, audioUrl: 'assets/audio/samples/track10.mp3' },
    { id: 'track-11', title: 'Physical', artistId: 'artist-3', artistName: 'Dua Lipa', albumId: 'album-3', albumName: 'Future Nostalgia', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 194, genre: 'Dance', releaseDate: '2020-03-27', popularity: 91, audioUrl: 'assets/audio/samples/track11.mp3' },
    { id: 'track-12', title: 'Break My Heart', artistId: 'artist-3', artistName: 'Dua Lipa', albumId: 'album-3', albumName: 'Future Nostalgia', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 221, genre: 'Pop', releaseDate: '2020-03-27', popularity: 89, audioUrl: 'assets/audio/samples/track12.mp3' },
    
    // Certified Lover Boy - Drake
    { id: 'track-13', title: 'Way 2 Sexy', artistId: 'artist-4', artistName: 'Drake', albumId: 'album-4', albumName: 'Certified Lover Boy', image: 'https://i.scdn.co/image/ab67616d0000b2739cbdd3d12420a053ed7a3e77', duration: 257, genre: 'Hip-Hop', releaseDate: '2021-09-03', popularity: 93, audioUrl: 'assets/audio/samples/track13.mp3' },
    { id: 'track-14', title: 'Girls Want Girls', artistId: 'artist-4', artistName: 'Drake', albumId: 'album-4', albumName: 'Certified Lover Boy', image: 'https://i.scdn.co/image/ab67616d0000b2739cbdd3d12420a053ed7a3e77', duration: 242, genre: 'Hip-Hop', releaseDate: '2021-09-03', popularity: 90, audioUrl: 'assets/audio/samples/track14.mp3' },
    { id: 'track-15', title: 'Fair Trade', artistId: 'artist-4', artistName: 'Drake', albumId: 'album-4', albumName: 'Certified Lover Boy', image: 'https://i.scdn.co/image/ab67616d0000b2739cbdd3d12420a053ed7a3e77', duration: 291, genre: 'Hip-Hop', releaseDate: '2021-09-03', popularity: 87, audioUrl: 'assets/audio/samples/track15.mp3' },
    
    // Midnights - Taylor Swift
    { id: 'track-16', title: 'Anti-Hero', artistId: 'artist-5', artistName: 'Taylor Swift', albumId: 'album-5', albumName: 'Midnights', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 200, genre: 'Pop', releaseDate: '2022-10-21', popularity: 99, audioUrl: 'assets/audio/samples/track16.mp3' },
    { id: 'track-17', title: 'Lavender Haze', artistId: 'artist-5', artistName: 'Taylor Swift', albumId: 'album-5', albumName: 'Midnights', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 202, genre: 'Pop', releaseDate: '2022-10-21', popularity: 94, audioUrl: 'assets/audio/samples/track17.mp3' },
    { id: 'track-18', title: 'Midnight Rain', artistId: 'artist-5', artistName: 'Taylor Swift', albumId: 'album-5', albumName: 'Midnights', image: 'https://i.scdn.co/image/ab67616d0000b273f2284eca4e4d9f5e5cd7fc02', duration: 154, genre: 'Pop', releaseDate: '2022-10-21', popularity: 92, audioUrl: 'assets/audio/samples/track18.mp3' }
];

// ============ PLAYLISTS ============
export const playlists = [
    {
        id: 'playlist-1',
        title: 'Top 50 Global',
        description: 'As 50 músicas mais ouvidas no mundo agora',
        image: 'https://charts-images.scdn.co/assets/locale_en/regional/daily/region_global_default.jpg',
        owner: 'SoundPulse',
        public: true,
        collaborative: false,
        followers: 32000000,
        trackIds: ['track-16', 'track-1', 'track-10', 'track-5', 'track-9', 'track-7', 'track-13', 'track-2', 'track-17', 'track-11'],
        totalTracks: 50,
        duration: 10200,
        type: 'editorial'
    },
    {
        id: 'playlist-2',
        title: 'RapCaviar',
        description: 'Novos hits de hip-hop e rap. Capa: Drake',
        image: 'https://i.scdn.co/image/ab67706f000000027e2e2d94fc31c5f626684e1e',
        owner: 'SoundPulse',
        public: true,
        collaborative: false,
        followers: 15000000,
        trackIds: ['track-13', 'track-14', 'track-15'],
        totalTracks: 50,
        duration: 9800,
        type: 'editorial'
    },
    {
        id: 'playlist-3',
        title: 'Today\'s Top Hits',
        description: 'Os maiores hits de hoje. Capa: The Weeknd',
        image: 'https://i.scdn.co/image/ab67706f000000021ea1f0c2ac65886e240b3d2e',
        owner: 'SoundPulse',
        public: true,
        collaborative: false,
        followers: 28000000,
        trackIds: ['track-1', 'track-16', 'track-9', 'track-5', 'track-10', 'track-2', 'track-17', 'track-7'],
        totalTracks: 50,
        duration: 10500,
        type: 'editorial'
    },
    {
        id: 'playlist-4',
        title: 'Chill Vibes',
        description: 'Músicas relaxantes para descontrair',
        image: 'https://i.scdn.co/image/ab67706f00000002fe3b35a292863a99330f7071',
        owner: 'SoundPulse',
        public: true,
        collaborative: false,
        followers: 8500000,
        trackIds: ['track-7', 'track-3', 'track-18', 'track-6', 'track-4'],
        totalTracks: 100,
        duration: 18000,
        type: 'editorial'
    }
];

// ============ CATEGORIAS ============
export const categories = [
    { id: 'cat-1', name: 'Pop', color: '#8400E7', image: 'https://i.scdn.co/image/ab67fb8200005caf4b6d0e0ce35f4ce7e3dc6c56' },
    { id: 'cat-2', name: 'Hip-Hop', color: '#E13300', image: 'https://i.scdn.co/image/ab67fb8200005caf5d32d0929e5c2da73cf49f09' },
    { id: 'cat-3', name: 'Rock', color: '#E8115B', image: 'https://i.scdn.co/image/ab67fb8200005cafa03df2891bd07627efc25bbe' },
    { id: 'cat-4', name: 'Latin', color: '#E61E32', image: 'https://i.scdn.co/image/ab67fb8200005caf6e89c0eeb1fcc34c91f24b43' },
    { id: 'cat-5', name: 'Eletrônica', color: '#1E3264', image: 'https://i.scdn.co/image/ab67fb8200005caf604423bb3c62aa2be7c9cd91' },
    { id: 'cat-6', name: 'R&B', color: '#BA5D07', image: 'https://i.scdn.co/image/ab67fb8200005caf6c28b85b8c5dbf47f3b07001' },
    { id: 'cat-7', name: 'Country', color: '#8D67AB', image: 'https://i.scdn.co/image/ab67fb8200005caf8316f08961bf0f3dbf4cdf08' },
    { id: 'cat-8', name: 'Jazz', color: '#2D46B9', image: 'https://i.scdn.co/image/ab67fb8200005caf0cd79b88abf12555f8f6e216' },
    { id: 'cat-9', name: 'Clássica', color: '#8D67AB', image: 'https://i.scdn.co/image/ab67fb8200005cafb0c207945e670b72d9ee49a1' },
    { id: 'cat-10', name: 'Indie', color: '#DC148C', image: 'https://i.scdn.co/image/ab67fb8200005caf91e35bcecc9e8ea719ab7ef1' }
];

// ============ GÊNEROS ============
export const genres = ['Pop', 'Hip-Hop', 'R&B', 'Rock', 'Electronic', 'Jazz', 'Country', 'Classical', 'Reggae', 'Blues', 'Folk', 'Latin', 'Soul', 'Funk', 'Disco', 'Metal', 'Punk', 'Alternative', 'Indie', 'Dance'];

// ============ HUMORES ============
export const moods = [
    { id: 'mood-1', name: 'Feliz', color: '#FFC107' },
    { id: 'mood-2', name: 'Triste', color: '#2196F3' },
    { id: 'mood-3', name: 'Energético', color: '#FF5722' },
    { id: 'mood-4', name: 'Calmo', color: '#009688' },
    { id: 'mood-5', name: 'Romântico', color: '#E91E63' },
    { id: 'mood-6', name: 'Motivado', color: '#FF9800' },
    { id: 'mood-7', name: 'Nostálgico', color: '#9C27B0' },
    { id: 'mood-8', name: 'Festa', color: '#E91E63' }
];

// ============ LETRAS DE MÚSICAS (exemplo genérico) ============
export const lyrics = {
    'track-1': {
        title: 'Exemplo de Música 1',
        artist: 'Artista de Exemplo',
        lines: [
            { time: 0, text: '[Letras não disponíveis]' },
            { time: 2, text: 'Esta é uma demonstração' },
            { time: 5, text: 'Com letras genéricas de exemplo' },
            { time: 9, text: 'Para fins ilustrativos' },
            { time: 12, text: 'Sem conteúdo protegido' },
            { time: 15, text: 'Por direitos autorais' }
        ]
    },
    'track-5': {
        title: 'Exemplo de Música 2',
        artist: 'Artista de Exemplo',
        lines: [
            { time: 0, text: '[Letras não disponíveis]' },
            { time: 3, text: 'Exemplo de letra sincronizada' },
            { time: 6, text: 'Para demonstração do player' },
            { time: 9, text: 'Sem conteúdo real de músicas' }
        ]
    }
};

// Funções auxiliares de busca
export function getTrackById(id) {
    return tracks.find(t => t.id === id);
}

export function getArtistById(id) {
    return artists.find(a => a.id === id);
}

export function getAlbumById(id) {
    return albums.find(a => a.id === id);
}

export function getPlaylistById(id) {
    return playlists.find(p => p.id === id);
}

export function getTracksByArtist(artistId) {
    return tracks.filter(t => t.artistId === artistId);
}

export function getAlbumsByArtist(artistId) {
    return albums.filter(a => a.artistId === artistId);
}

export function getTracksByAlbum(albumId) {
    return tracks.filter(t => t.albumId === albumId);
}

export function getTracksByIds(ids) {
    return ids.map(id => getTrackById(id)).filter(Boolean);
}

export function searchTracks(query) {
    const q = query.toLowerCase();
    return tracks.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.albumName.toLowerCase().includes(q)
    );
}

export function searchArtists(query) {
    const q = query.toLowerCase();
    return artists.filter(a => a.name.toLowerCase().includes(q));
}

export function searchAlbums(query) {
    const q = query.toLowerCase();
    return albums.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.artistName.toLowerCase().includes(q)
    );
}

export function searchPlaylists(query) {
    const q = query.toLowerCase();
    return playlists.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
}

export function searchAll(query) {
    return {
        tracks: searchTracks(query),
        artists: searchArtists(query),
        albums: searchAlbums(query),
        playlists: searchPlaylists(query)
    };
}

// Rankings
export function getTopTracks(limit = 50) {
    return [...tracks].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export function getTopArtists(limit = 50) {
    return [...artists].sort((a, b) => b.monthlyListeners - a.monthlyListeners).slice(0, limit);
}

// Export tudo
export default {
    artists,
    albums,
    tracks,
    playlists,
    categories,
    genres,
    moods,
    lyrics,
    getTrackById,
    getArtistById,
    getAlbumById,
    getPlaylistById,
    getTracksByArtist,
    getAlbumsByArtist,
    getTracksByAlbum,
    getTracksByIds,
    searchTracks,
    searchArtists,
    searchAlbums,
    searchPlaylists,
    searchAll,
    getTopTracks,
    getTopArtists
};

