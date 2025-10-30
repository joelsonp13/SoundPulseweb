/* ====================================
   BROWSE VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeTracks } from '../utils/normalize.js';
import { showLoading, showError } from '../components/loading.js';
import player from '../player.js';
import { $ } from '../utils/dom.js';

export async function initBrowseView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    showLoading(container, 'grid');
    
    try {
        const [moodsData, chartsData] = await Promise.all([
            api.getMoodCategories(),
            api.getCharts('BR')
        ]);
        
        renderBrowse(container, moodsData, chartsData);
    } catch (error) {
        console.error('Error loading browse:', error);
        showError(container, 'Erro ao carregar categorias');
    }
}

function renderBrowse(container, moodsData, chartsData) {
    container.innerHTML = `
        <div class="browse-view">
            <h1 class="page-title">Explorar</h1>
            
            <section class="browse-section">
                <h2 class="section-title">🔥 Top Charts Brasil</h2>
                <div class="carousel" id="chartsCarousel"></div>
            </section>
            
            <section class="browse-section">
                <h2 class="section-title">🎭 Navegar por humor</h2>
                <div class="categories-grid" id="moodsGrid"></div>
            </section>
        </div>
    `;
    
    renderCharts(chartsData);
    renderMoods(moodsData);
}

function renderCharts(chartsData) {
    const carousel = $('#chartsCarousel');
    if (!carousel) return;
    
    // CORREÇÃO: usar chartsData.videos
    const tracks = normalizeTracks(chartsData.videos || []);
    
    carousel.innerHTML = tracks.slice(0, 20).map((track, index) => `
        <div class="music-card" data-video-id="${track.videoId}">
            <div class="music-card-image">
                <img src="${track.image}" alt="${track.title}" loading="lazy">
                <div class="music-card-overlay">
                    <button class="btn-play-card">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
                <div class="music-card-badge">#${index + 1}</div>
            </div>
            <div class="music-card-info">
                <div class="music-card-title">${track.title}</div>
                <div class="music-card-artist">${track.artist}</div>
            </div>
        </div>
    `).join('');
    
    carousel.querySelectorAll('.music-card').forEach(card => {
        const playBtn = card.querySelector('.btn-play-card');
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const videoId = card.dataset.videoId;
            if (videoId) {
                player.loadTrack(videoId);
                player.play();
            }
        };
        // Tocar tanto pelo botão quanto pelo clique no card
        card.addEventListener('click', handler);
        if (playBtn) playBtn.addEventListener('click', handler);
    });
}

function renderMoods(moodsData) {
    const grid = $('#moodsGrid');
    if (!grid) return;
    
    const moods = moodsData.sections || [];
    
    const colors = [
        '#E13300', '#AF2896', '#1E3264', '#477D95',
        '#E8115B', '#DC148C', '#00A674', '#0C67CB',
        '#8D67AB', '#E61E32', '#2D46B9', '#509BF5'
    ];
    
    grid.innerHTML = moods.map((mood, index) => {
        const title = mood.title || 'Categoria';
        const params = mood.params || '';
        const color = colors[index % colors.length];
        
        return `
            <div class="category-card" data-params="${params}" style="background: ${color}">
                <h3>${title}</h3>
            </div>
        `;
    }).join('');
    
    grid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', async () => {
            const params = card.dataset.params;
            if (params) {
                try {
                    const playlistsData = await api.getMoodPlaylists(params);
                    // Navigate to first playlist
                    const firstPlaylist = playlistsData.results?.[0];
                    if (firstPlaylist) {
                        window.location.hash = `#/playlist/${firstPlaylist.browseId}`;
                    }
                } catch (error) {
                    console.error('Error loading mood playlists:', error);
                }
            }
        });
    });
}

export default initBrowseView;
