/* ====================================
   ALBUM VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeAlbum, normalizeTracks, formatDuration } from '../utils/normalize.js';
import { showLoading, showError } from '../components/loading.js';
import player from '../player.js';
import { $, showToast } from '../utils/dom.js';

export async function initAlbumView(browseId) {
    const container = $('#viewContainer');
    if (!container) return;
    
    showLoading(container, 'single');
    
    try {
        const albumData = await api.getAlbum(browseId);
        renderAlbum(container, albumData);
    } catch (error) {
        console.error('❌ Error loading album:', error);
        showError(container, 'Álbum não encontrado');
    }
}

function renderAlbum(container, albumData) {
    const album = normalizeAlbum(albumData);
    // Passar album.image como fallbackImage - a normalização já cuida da lógica
    const tracks = normalizeTracks(albumData.tracks || [], album.image);
    
    // 🐛 DEBUG: Ver o que está vindo do backend
    console.log('🎵 Album image:', album.image);
    console.log('🎵 First track keys:', Object.keys(albumData.tracks?.[0] || {}));
    console.log('🎵 First track raw data:', albumData.tracks?.[0]);
    console.log('🎵 First track normalized:', tracks[0]);
    
    container.innerHTML = `
        <div class="album-view">
            <div class="album-header">
                <div class="album-cover">
                    <img src="${album.image}" alt="${album.title}">
                </div>
                <div class="album-info">
                    <span class="album-type">Álbum</span>
                    <h1 class="album-title">${album.title}</h1>
                    <div class="album-meta">
                        <span>${album.artist}</span>
                        ${album.year ? `<span>• ${album.year}</span>` : ''}
                        <span>• ${tracks.length} músicas</span>
                        ${albumData.duration ? `<span>• ${albumData.duration}</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="album-actions">
                <button class="btn btn-primary" id="playAlbum">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                </button>
            </div>
            
            <div class="album-tracks" id="albumTracks"></div>
        </div>
    `;
    
    renderTracks(tracks);
    setupPlayButton(tracks);
}

function renderTracks(tracks) {
    const tracksContainer = $('#albumTracks');
    if (!tracksContainer) return;
    
    tracksContainer.innerHTML = tracks.map((track, index) => `
        <div class="track-item" data-video-id="${track.videoId}">
            <span class="track-number">
                <span class="number">${index + 1}</span>
                <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </span>
            <div class="track-image">
                <img src="${track.image}" alt="${track.title}" loading="lazy">
            </div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <span class="track-duration">${formatDuration(track.duration)}</span>
            <button class="btn-icon track-play">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Extrair array de videoIds para a queue
    const videoIds = tracks.map(t => t.videoId);
    
    tracksContainer.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.videoId;
            if (videoId) {
                player.playTrack(videoId, videoIds);
            }
        });
    });
}

function setupPlayButton(tracks) {
    const btn = $('#playAlbum');
    if (!btn || tracks.length === 0) return;
    
    btn.addEventListener('click', () => {
        // Extrair array de videoIds para a queue
        const videoIds = tracks.map(t => t.videoId);
        player.playTrack(videoIds[0], videoIds);
        showToast('🎵 Tocando álbum!', 'success');
    });
}

export default initAlbumView;
