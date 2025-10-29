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
    
    console.log('💿 initAlbumView - browseId recebido:', browseId); // Debug
    
    showLoading(container, 'single');
    
    try {
        console.log('🌐 Buscando álbum no backend:', browseId); // Debug
        
        const albumData = await api.getAlbum(browseId);
        
        console.log('✅ Dados do álbum recebidos:', albumData); // Debug
        
        renderAlbum(container, albumData);
    } catch (error) {
        console.error('❌ Error loading album:', error);
        showError(container, 'Álbum não encontrado');
    }
}

function renderAlbum(container, albumData) {
    const album = normalizeAlbum(albumData);
    const tracks = normalizeTracks(albumData.tracks || []);
    
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
            <span class="track-number">${index + 1}</span>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <span class="track-duration">${formatDuration(track.duration)}</span>
            <button class="btn-icon track-play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    tracksContainer.querySelectorAll('.track-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.videoId;
            player.loadTrack(videoId);
            player.play();
        });
    });
}

function setupPlayButton(tracks) {
    const btn = $('#playAlbum');
    if (!btn || tracks.length === 0) return;
    
    btn.addEventListener('click', () => {
        // Load all tracks as queue
        player.loadTrack(tracks[0].videoId);
        player.play();
        showToast('🎵 Tocando álbum!', 'success');
    });
}

export default initAlbumView;
