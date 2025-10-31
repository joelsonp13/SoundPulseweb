/* ====================================
   PLAYLIST VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizePlaylist, normalizeTracks, formatDuration } from '../utils/normalize.js';
import { showLoading, showError } from '../components/loading.js';
import player from '../player.js';
import { $, showToast } from '../utils/dom.js';

export async function initPlaylistView(browseId) {
    const container = $('#viewContainer');
    if (!container) return;
    
    console.log('📝 initPlaylistView - browseId recebido:', browseId); // Debug
    
    showLoading(container, 'single');
    
    try {
        console.log('🌐 Buscando playlist no backend:', browseId); // Debug
        
        const playlistData = await api.getPlaylist(browseId, 100);
        
        console.log('✅ Dados da playlist recebidos:', playlistData); // Debug
        
        renderPlaylist(container, playlistData);
    } catch (error) {
        console.error('❌ Error loading playlist:', error);
        showError(container, 'Playlist não encontrada');
    }
}

function renderPlaylist(container, playlistData) {
    const playlist = normalizePlaylist(playlistData);
    const tracks = normalizeTracks(playlistData.tracks || []);
    
    container.innerHTML = `
        <div class="playlist-view">
            <div class="playlist-header">
                <div class="playlist-cover">
                    <img src="${playlist.image}" alt="${playlist.title}" loading="eager">
                </div>
                <div class="playlist-info">
                    <span class="playlist-type">Playlist</span>
                    <h1 class="playlist-title">${playlist.title}</h1>
                    ${playlist.description ? `<p class="playlist-description">${playlist.description}</p>` : ''}
                    <div class="playlist-meta">
                        ${playlist.author ? `<span>${playlist.author}</span>` : ''}
                        ${tracks.length > 0 ? `<span>${playlist.author ? '• ' : ''}${tracks.length} músicas</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="playlist-actions">
                <button class="btn btn-primary" id="playPlaylist">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                </button>
            </div>
            
            <div class="playlist-tracks" id="playlistTracks"></div>
        </div>
    `;
    
    renderTracks(tracks);
    setupPlayButton(tracks);
}

function renderTracks(tracks) {
    const tracksContainer = $('#playlistTracks');
    if (!tracksContainer) return;
    
    if (tracks.length === 0) {
        tracksContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: var(--spacing-2xl);">Nenhuma música nesta playlist</p>';
        return;
    }
    
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
            <button class="btn-icon track-play" aria-label="Tocar ${track.title}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Extrair array de videoIds para a queue
    const videoIds = tracks.map(t => t.videoId);
    
    tracksContainer.querySelectorAll('.track-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            const videoId = item.dataset.videoId;
            if (videoId) {
                player.playTrack(videoId, videoIds);
            }
        });
    });
}

function setupPlayButton(tracks) {
    const btn = $('#playPlaylist');
    if (!btn || tracks.length === 0) return;
    
    btn.addEventListener('click', () => {
        // Extrair array de videoIds para a queue
        const videoIds = tracks.map(t => t.videoId);
        player.playTrack(videoIds[0], videoIds);
        showToast('🎵 Tocando playlist!', 'success');
    });
}

export default initPlaylistView;
