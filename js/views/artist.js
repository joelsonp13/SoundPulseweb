/* ====================================
   ARTIST VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeArtist, normalizeTracks, normalizeAlbums, normalizeSearchResults, normalizeAlbum, getThumbnail as getBestThumbnail } from '../utils/normalize.js';
import { showLoading, showError } from '../components/loading.js';
import player from '../player.js';
import { $, createElement, showToast } from '../utils/dom.js';

export async function initArtistView(browseId) {
    const container = $('#viewContainer');
    if (!container) return;
    
    console.log('🎤 initArtistView - browseId recebido:', browseId); // Debug
    
    showLoading(container, 'single');
    
    try {
        console.log('🌐 1/2 Buscando dados do artista...'); // Debug
        
        // 1️⃣ Buscar info do artista primeiro (para pegar channelId se necessário)
        const artistData = await api.getArtist(browseId);
        
        console.log('✅ Dados do artista recebidos:', artistData); // Debug
        
        // 2️⃣ Buscar álbuns com estratégia de retry (cobre casos como MC Poze)
        const candidates = [
            artistData.params,
            artistData.channelId,
            null
        ].filter(Boolean);
        
        let albumsData = { results: [] };
        for (let i = 0; i < (candidates.length || 1); i++) {
            const paramsCandidate = candidates[i] || null;
            console.log('🌐 Tentando buscar álbuns... params:', paramsCandidate); // Debug
            albumsData = await api.getArtistAlbums(browseId, paramsCandidate);
            if (Array.isArray(albumsData?.results) && albumsData.results.length > 0) {
                break;
            }
        }
        
        // 3️⃣ Fallback replicando o Search: se ainda vazio, buscar por álbuns via search
        if (!Array.isArray(albumsData?.results) || albumsData.results.length === 0) {
            try {
                const artistName = artistData?.name || artistData?.artist || '';
                if (artistName) {
                    console.log('🔎 Fallback: buscando álbuns via search para', artistName);
                    const searchAlbums = await api.search(artistName, 'albums', 50);
                    const normalized = normalizeSearchResults(searchAlbums);
                    const onlyAlbums = normalized.filter(item => item.type === 'album');
                    // Adaptar ao formato esperado por renderAlbums (normalizeAlbums já lida com objetos de álbum)
                    albumsData = { results: onlyAlbums };
                }
            } catch (e) {
                console.warn('Fallback search falhou:', e);
            }
        }
        
        console.log('✅ Álbuns recebidos:', albumsData); // Debug
        
        renderArtist(container, artistData, albumsData);
    } catch (error) {
        console.error('❌ Error loading artist:', error);
        showError(container, 'Artista não encontrado', 'Verifique o ID ou tente outro artista');
    }
}

function renderArtist(container, artistData, albumsData) {
    // Usar hero true para obter imagem grande
    const artist = normalizeArtist(artistData, { hero: true });
    const topTracks = normalizeTracks(artistData.songs?.results || []);
    // Aceitar tanto álbuns crus (do endpoint) quanto já normalizados (do fallback de search)
    const rawAlbums = albumsData.results || [];
    const albums = rawAlbums.map(a => (a && a.image ? a : normalizeAlbum(a))).filter(Boolean);

    // Extrair artistas relacionados a partir dos participantes das faixas
    const relatedArtists = extractRelatedArtists(topTracks, artist.name).slice(0, 12);
    
    console.log('🎤 renderArtist - Dados do artista:', artist); // Debug
    console.log('🎵 renderArtist - Top tracks:', topTracks); // Debug
    console.log('💿 renderArtist - Álbuns:', albums); // Debug
    console.log('👥 renderArtist - Relacionados:', relatedArtists); // Debug
    
    container.innerHTML = `
        <div class="artist-view">
            <div class="artist-hero">
                <div class="artist-hero-bg">
                    <img src="${artist.image}" alt="${artist.name}">
                </div>
                <div class="artist-hero-overlay"></div>
                <div class="artist-hero-content">
                    <span class="artist-verified">✓ Artista verificado</span>
                    <h1 class="artist-name">${artist.name}</h1>
                    <p class="artist-stats">${artist.subscribers || 'Sem dados'}</p>
                </div>
            </div>
            
            <div class="artist-actions">
                <button class="btn btn-primary" id="playArtist">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                </button>
            </div>
            
            ${topTracks.length > 0 ? `
            <section class="artist-section">
                <h2 class="section-title">Populares</h2>
                <div class="track-list" id="topTracks"></div>
            </section>
            ` : ''}
            
            ${albums.length > 0 ? `
            <section class="artist-section">
                <h2 class="section-title">Discografia</h2>
                <div class="carousel" id="albumsCarousel"></div>
            </section>
            ` : ''}

            ${relatedArtists.length > 0 ? `
            <section class="artist-section">
                <h2 class="section-title">Artistas relacionados</h2>
                <div class="carousel" id="relatedArtistsCarousel"></div>
            </section>
            ` : ''}
            
            ${artistData.description ? `
            <section class="artist-section">
                <h2 class="section-title">Sobre</h2>
                <p class="artist-bio">${artistData.description}</p>
            </section>
            ` : ''}
        </div>
    `;
    
    if (topTracks.length > 0) {
        renderTopTracks(topTracks.slice(0, 10));
        setupPlayButton(topTracks);
    }
    
    if (albums.length > 0) {
        renderAlbums(albums);
    }

    if (relatedArtists.length > 0) {
        enrichRelatedArtistsWithImages(relatedArtists).then(enriched => {
            renderRelatedArtists(enriched);
        }).catch(() => {
            renderRelatedArtists(relatedArtists);
        });
    }
}

async function enrichRelatedArtistsWithImages(artists) {
    // Buscar imagens via search (artists) em paralelo, limitado aos primeiros 8-12
    const limited = artists.slice(0, 12);
    const enriched = await Promise.all(limited.map(async (a) => {
        try {
            // Se já tiver imagem (futuro), manter
            if (a.image) return a;
            const data = await api.search(a.name, 'artists', 1);
            const first = (data?.results || [])[0];
            if (first && (first.thumbnails || first.thumbnail)) {
                return { ...a, image: getBestThumbnail(first.thumbnails || first.thumbnail) };
            }
        } catch (e) {
            // ignore
        }
        return a;
    }));
    return enriched;
}

function extractRelatedArtists(tracks, mainArtistName) {
    const map = new Map();
    tracks.forEach(t => {
        (t.artistEntities || []).forEach(a => {
            if (!a || !a.name) return;
            if (a.name === mainArtistName) return;
            const key = a.id || a.name;
            if (!map.has(key)) {
                map.set(key, { id: a.id, name: a.name });
            }
        });
    });
    return Array.from(map.values());
}

function renderRelatedArtists(artists) {
    const carousel = $('#relatedArtistsCarousel');
    if (!carousel) return;

    // Cards com imagem quando disponível, fallback com inicial
    carousel.innerHTML = artists.map(a => `
        <div class="artist-card" data-id="${a.id || ''}" data-name="${a.name}">
            <div class="artist-card-image">
                ${a.image ? `<img src="${a.image}" alt="${a.name}" loading="lazy">` : `<div class="avatar-fallback">${(a.name || '?').charAt(0).toUpperCase()}</div>`}
            </div>
            <div class="artist-card-info">
                <div class="artist-card-title">${a.name}</div>
            </div>
        </div>
    `).join('');

    carousel.querySelectorAll('.artist-card').forEach(card => {
        card.addEventListener('click', async () => {
            const id = card.getAttribute('data-id');
            const name = card.getAttribute('data-name');
            if (id) {
                window.location.hash = `#/artist/${id}`;
                return;
            }
            // Resolver via busca se não houver ID
            try {
                const data = await api.search(name, 'artists', 1);
                const first = (data?.results || []).find(r => (r.resultType || r.type) === 'artist');
                const artistId = first?.browseId || first?.id;
                if (artistId) {
                    window.location.hash = `#/artist/${artistId}`;
                }
            } catch (e) {
                console.warn('Falha ao resolver artista relacionado via busca:', e);
            }
        });
    });
}

function renderTopTracks(tracks) {
    const trackList = $('#topTracks');
    if (!trackList) return;
    
    console.log('🎵 renderTopTracks - Renderizando', tracks.length, 'músicas'); // Debug
    
    trackList.innerHTML = tracks.map((track, index) => `
        <div class="track-item" data-video-id="${track.videoId}">
            <span class="track-number">${index + 1}</span>
            <div class="track-thumbnail">
                <img src="${track.image}" alt="${track.title}" loading="lazy" decoding="async">
            </div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artistsDisplay || track.artist}</div>
            </div>
            <span class="track-duration">${track.duration || ''}</span>
            <button class="btn-icon track-play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    trackList.querySelectorAll('.track-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            // Passar o objeto track completo, não apenas videoId
            const track = tracks[index];
            player.loadTrack(track);
            player.play();
        });
    });
}

function renderAlbums(albums) {
    const carousel = $('#albumsCarousel');
    if (!carousel) return;
    
    carousel.innerHTML = albums.map(album => `
        <div class="music-card" data-id="${album.browseId}">
            <div class="music-card-image">
                <img src="${album.image}" alt="${album.title}" loading="lazy">
                <div class="music-card-overlay">
                    <button class="btn-play-card">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="music-card-info">
                <div class="music-card-title">${album.title}</div>
                <div class="music-card-artist">${album.year || ''}</div>
            </div>
        </div>
    `).join('');
    
    carousel.querySelectorAll('.music-card').forEach(card => {
        card.addEventListener('click', () => {
            window.location.hash = `#/album/${card.dataset.id}`;
        });
    });
}

function setupPlayButton(tracks) {
    const btn = $('#playArtist');
    if (!btn || tracks.length === 0) return;
    
    btn.addEventListener('click', () => {
        player.loadTrack(tracks[0].videoId);
        player.play();
        showToast('🎵 Tocando agora!', 'success');
    });
}

export default initArtistView;
