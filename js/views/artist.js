/* ====================================
   ARTIST VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeArtist, normalizeTracks, normalizeAlbums } from '../utils/normalize.js';
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
        
        // 🔍 VALIDAÇÃO CRÍTICA: Verificar se o artista retornado corresponde ao ID solicitado
        const returnedArtistId = artistData.browseId || artistData.id || artistData.channelId;
        if (returnedArtistId && returnedArtistId !== browseId) {
            console.warn(`⚠️ INCONSISTÊNCIA DE ID DETECTADA!`);
            console.warn(`   Solicitado: ${browseId}`);
            console.warn(`   Retornado: ${returnedArtistId}`);
            console.warn(`   Nome: ${artistData.name || 'N/A'}`);
            
            // Estratégia de fallback: tentar diferentes abordagens
            try {
                console.log('🔄 Tentando estratégia de fallback...');
                
                // 1. Tentar buscar novamente com o ID retornado
                const correctedArtistData = await api.getArtist(returnedArtistId);
                console.log('✅ Dados corrigidos (método 1):', correctedArtistData);
                
                // 2. Verificar se o ID corrigido é consistente
                const correctedId = correctedArtistData.browseId || correctedArtistData.id || correctedArtistData.channelId;
                if (correctedId === returnedArtistId) {
                    console.log('✅ ID consistente após correção');
                    Object.assign(artistData, correctedArtistData);
                } else {
                    console.warn('⚠️ ID ainda inconsistente após correção, usando dados originais');
                    // Manter dados originais mas adicionar flag de inconsistência
                    artistData._inconsistentId = true;
                    artistData._requestedId = browseId;
                    artistData._returnedId = returnedArtistId;
                }
            } catch (fallbackError) {
                console.error('❌ Falha na estratégia de fallback:', fallbackError);
                // Manter dados originais mas adicionar flag de inconsistência
                artistData._inconsistentId = true;
                artistData._requestedId = browseId;
                artistData._returnedId = returnedArtistId;
            }
        }
        
        // 2️⃣ Buscar álbuns (pode usar channelId se disponível)
        const channelId = artistData.channelId || artistData.params;
        console.log('🌐 2/2 Buscando álbuns do artista... channelId:', channelId); // Debug
        
        const albumsData = await api.getArtistAlbums(browseId, channelId);
        
        console.log('✅ Álbuns recebidos:', albumsData); // Debug
        
        renderArtist(container, artistData, albumsData);
    } catch (error) {
        console.error('❌ Error loading artist:', error);
        showError(container, 'Artista não encontrado', 'Verifique o ID ou tente outro artista');
    }
}

function extractCollaborators(topTracks, mainArtistId) {
    const collaboratorsMap = new Map();
    
    topTracks.forEach((track, index) => {
        if (track.allArtists) {
            track.allArtists.forEach(artist => {
                // Não incluir o artista principal
                if (artist.id && artist.id !== mainArtistId) {
                    if (!collaboratorsMap.has(artist.id)) {
                        collaboratorsMap.set(artist.id, {
                            id: artist.id,
                            browseId: artist.id,
                            name: artist.name,
                            count: 1 // Contador de colaborações
                        });
                    } else {
                        collaboratorsMap.get(artist.id).count++;
                    }
                }
            });
        }
    });
    
    // Ordenar por número de colaborações (mais frequente primeiro)
    return Array.from(collaboratorsMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6); // Limitar a 6 artistas
}

async function fetchCollaboratorImages(collaborators) {
    // Buscar imagens em paralelo (simples e direto)
    const results = await Promise.all(
        collaborators.map(async (collaborator) => {
            try {
                // Fazer requisição SEM retry (imagens não são críticas)
                const response = await fetch(`http://localhost:5000/api/artist/${collaborator.id}`);
                if (!response.ok) throw new Error();
                
                const artistData = await response.json();
                const normalized = normalizeArtist(artistData);
                
                return {
                    ...collaborator,
                    image: normalized.image
                };
            } catch {
                // Fallback silencioso (sem logs)
                return {
                    ...collaborator,
                    image: 'assets/images/covers/placeholder.svg'
                };
            }
        })
    );
    
    return results;
}

async function renderArtist(container, artistData, albumsData) {
    const artist = normalizeArtist(artistData);
    
    // 🔍 VALIDAÇÃO FINAL: Verificar se o artista foi normalizado corretamente
    if (!artist) {
        console.error('❌ Falha na normalização do artista:', artistData);
        showError(container, 'Erro ao processar dados do artista', 'Dados inválidos recebidos do servidor');
        return;
    }
    
    const topTracks = normalizeTracks(artistData.songs?.results || []);
    const albums = normalizeAlbums(albumsData.results || []);
    const collaborators = extractCollaborators(topTracks, artist.id);
    
    console.log('🎤 renderArtist - Dados do artista:', artist); // Debug
    console.log('🎵 renderArtist - Top tracks:', topTracks); // Debug
    console.log('💿 renderArtist - Álbuns:', albums); // Debug
    console.log('🎭 renderArtist - Colaboradores:', collaborators); // Debug
    
    // 🔍 DEBUG: Mostrar informações de debug se disponíveis
    if (artist._debug) {
        console.log('🔍 Debug info do artista:', artist._debug);
    }
    
    // 🔍 NOTIFICAÇÃO: Mostrar aviso se houver inconsistência de ID
    const hasInconsistency = artistData._inconsistentId;
    const inconsistencyWarning = hasInconsistency ? `
        <div class="alert alert-warning" style="margin: 10px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
            <strong>⚠️ Aviso:</strong> Dados do artista podem estar incorretos devido a inconsistência de IDs.
            <br><small>ID solicitado: ${artistData._requestedId} | ID retornado: ${artistData._returnedId}</small>
        </div>
    ` : '';
    
    container.innerHTML = `
        <div class="artist-view">
            ${inconsistencyWarning}
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
            
            ${collaborators.length > 0 ? `
            <section class="artist-section">
                <h2 class="section-title">Artistas Relacionados</h2>
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
    
    if (collaborators.length > 0) {
        // Buscar imagens dos colaboradores e renderizar
        const collaboratorsWithImages = await fetchCollaboratorImages(collaborators);
        renderRelatedArtists(collaboratorsWithImages);
    }
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
                <div class="track-artist">${track.artist}</div>
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
                <div class="music-card-artist">${album.year || 'Álbum'} • ${album.trackCount || 0} músicas</div>
            </div>
        </div>
    `).join('');
    
    carousel.querySelectorAll('.music-card').forEach(card => {
        card.addEventListener('click', () => {
            window.location.hash = `#/album/${card.dataset.id}`;
        });
    });
}

function renderRelatedArtists(artists) {
    const carousel = $('#relatedArtistsCarousel');
    if (!carousel) return;
    
    // Renderizar com imagens já carregadas
    carousel.innerHTML = artists.map(artist => `
        <div class="artist-card-related" data-id="${artist.id}">
            <div class="artist-card-image-round">
                <img src="${artist.image || 'assets/images/covers/placeholder.svg'}" 
                     alt="${artist.name}" 
                     loading="lazy">
                <div class="artist-card-overlay">
                    <button class="btn-play-artist">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="artist-card-info-center">
                <div class="artist-card-name">${artist.name}</div>
                <div class="artist-card-label">Artista</div>
                <div class="artist-card-collab">${artist.count} ${artist.count === 1 ? 'música' : 'músicas'}</div>
            </div>
        </div>
    `).join('');
    
    // Setup click handlers
    carousel.querySelectorAll('.artist-card-related').forEach(card => {
        card.addEventListener('click', () => {
            window.location.hash = `#/artist/${card.dataset.id}`;
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
