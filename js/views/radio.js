/* ====================================
   RADIO VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeTracks } from '../utils/normalize.js';
import { showLoading, showError } from '../components/loading.js';
import { showToast } from '../utils/dom.js';
import player from '../player.js';
import { $ } from '../utils/dom.js';

export function initRadioView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="radio-view">
            <div class="radio-hero">
                <div class="radio-icon">📻</div>
                <h1 class="radio-title">Rádio</h1>
                <p class="radio-subtitle">Crie uma estação de rádio baseada em qualquer música</p>
            </div>
            
            <div class="radio-search">
                <div class="radio-search-box">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input type="text" id="radioSearchInput" placeholder="Buscar música para iniciar rádio..." autocomplete="off">
                </div>
                <div class="radio-suggestions hidden" id="radioSuggestions"></div>
            </div>
            
            <div id="radioContent">
                <div class="radio-placeholder">
                    <p>Busque por uma música para criar sua estação de rádio personalizada!</p>
                    <p class="radio-placeholder-hint">Tocaremos automaticamente 50 músicas similares</p>
                </div>
            </div>
        </div>
    `;
    
    setupRadioSearch();
}

let searchTimeout = null;

function setupRadioSearch() {
    const input = $('#radioSearchInput');
    const suggestionsBox = $('#radioSuggestions');
    
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (!query) {
            suggestionsBox?.classList.add('hidden');
            return;
        }
        
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchSongs(query), 300);
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.radio-search')) {
            suggestionsBox?.classList.add('hidden');
        }
    });
}

async function searchSongs(query) {
    const suggestionsBox = $('#radioSuggestions');
    if (!suggestionsBox) return;
    
    try {
        const data = await api.search(query, 'songs', 10);
        const tracks = normalizeTracks(data.results || []);
        
        if (tracks.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        
        suggestionsBox.innerHTML = tracks.map(track => `
            <div class="radio-suggestion-item" data-video-id="${track.videoId}">
                <img src="${track.image}" alt="${track.title}" loading="lazy">
                <div class="radio-suggestion-info">
                    <div class="radio-suggestion-title">${track.title}</div>
                    <div class="radio-suggestion-artist">${track.artist}</div>
                </div>
            </div>
        `).join('');
        
        suggestionsBox.classList.remove('hidden');
        
        // Setup click handlers
        suggestionsBox.querySelectorAll('.radio-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.dataset.videoId;
                suggestionsBox.classList.add('hidden');
                startRadio(videoId);
            });
        });
    } catch (error) {
        console.error('Error searching songs:', error);
    }
}

async function startRadio(videoId) {
    const contentContainer = $('#radioContent');
    if (!contentContainer) return;
    
    showLoading(contentContainer, 'list');
    
    try {
        const radioData = await api.getWatchPlaylist(videoId, 50);
        const tracks = normalizeTracks(radioData.tracks || []);
        
        if (tracks.length === 0) {
            showError(contentContainer, 'Não foi possível gerar rádio');
            return;
        }
        
        renderRadioStation(contentContainer, tracks, videoId);
        
        // Auto-play first track
        player.loadTrack(videoId);
        player.play();
        showToast('📻 Rádio iniciada!', 'success');
        
    } catch (error) {
        console.error('Error starting radio:', error);
        showError(contentContainer, 'Erro ao criar rádio');
    }
}

function renderRadioStation(container, tracks, currentVideoId) {
    container.innerHTML = `
        <div class="radio-station">
            <div class="radio-station-header">
                <h2>📻 Sua Estação Personalizada</h2>
                <p>${tracks.length} músicas similares preparadas para você</p>
            </div>
            
            <div class="radio-tracks" id="radioTracks"></div>
        </div>
    `;
    
    renderTracks(tracks);
}

function renderTracks(tracks) {
    const tracksContainer = $('#radioTracks');
    if (!tracksContainer) return;
    
    tracksContainer.innerHTML = tracks.map((track, index) => `
        <div class="track-item" data-video-id="${track.videoId}">
            <span class="track-number">${index + 1}</span>
            <div class="track-cover">
                <img src="${track.image}" alt="${track.title}" loading="lazy">
            </div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
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

export default initRadioView;
