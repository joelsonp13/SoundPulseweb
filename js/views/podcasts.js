/* ====================================
   PODCASTS VIEW
   ==================================== */

import { $ } from '../utils/dom.js';
import { formatDuration } from '../utils/time.js';
import api from '../utils/api.js';
import { showLoading, showError } from '../components/loading.js';

let podcastsData = [];
let currentFilter = 'all';

export async function initPodcastsView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    showLoading(container, 'grid');
    
    try {
        const response = await api.getPodcasts('all');
        podcastsData = response.results || [];
        
        container.innerHTML = `
            <div class="podcasts-view">
                <h1 class="podcasts-title">Podcasts</h1>
                
                <div class="podcasts-filters">
                    <button class="filter-btn active" data-filter="all">Todos</button>
                    <button class="filter-btn" data-filter="following">Seguindo</button>
                    <button class="filter-btn" data-filter="downloaded">Baixados</button>
                </div>
                
                <div class="podcasts-grid" id="podcastsGrid">
                    ${renderPodcasts()}
                </div>
            </div>
        `;
        
        setupPodcastsEvents();
    } catch (error) {
        console.error('Error loading podcasts:', error);
        showError(container, 'Erro ao carregar podcasts');
    }
}

function renderPodcasts() {
    let filteredPodcasts = podcastsData;
    
    if (currentFilter === 'following') {
        filteredPodcasts = podcastsData.filter(p => p.isFollowing);
    } else if (currentFilter === 'downloaded') {
        filteredPodcasts = []; // Demo: nenhum baixado
    }
    
    if (filteredPodcasts.length === 0) {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
                <h3>Nenhum podcast encontrado</h3>
                <p>Explore e siga podcasts para vê-los aqui</p>
            </div>
        `;
    }
    
    return filteredPodcasts.map(podcast => createPodcastCard(podcast)).join('');
}

function createPodcastCard(podcast) {
    const followersFormatted = podcast.followers > 0 ? ((podcast.followers / 1000).toFixed(0) + 'K') : '';
    const statsDisplay = followersFormatted ? `<span>${podcast.episodes} episódios</span><span>•</span><span>${followersFormatted} seguidores</span>` : `<span>${podcast.episodes} episódios</span>`;
    
    return `
        <div class="podcast-card" data-podcast-id="${podcast.id}" data-browse-id="${podcast.browseId || podcast.id}">
            <div class="podcast-card-header">
                <img src="${podcast.image || 'assets/images/covers/placeholder.svg'}" alt="${podcast.title}" class="podcast-card-image" loading="lazy">
                <button class="btn-follow-podcast ${podcast.isFollowing ? 'following' : ''}" 
                        data-podcast-id="${podcast.id}" 
                        aria-label="${podcast.isFollowing ? 'Deixar de seguir' : 'Seguir'}">
                    ${podcast.isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
            </div>
            <div class="podcast-card-content">
                <h3 class="podcast-card-title">${podcast.title}</h3>
                <p class="podcast-card-author">${podcast.author || 'Unknown Author'}</p>
                ${podcast.description ? `<p class="podcast-card-description">${podcast.description}</p>` : ''}
                <div class="podcast-card-stats">
                    ${statsDisplay}
                </div>
            </div>
            ${podcast.latestEpisodes && podcast.latestEpisodes.length > 0 ? `
            <div class="podcast-episodes">
                <h4 class="episodes-title">Episódios Recentes</h4>
                ${podcast.latestEpisodes.map(episode => createEpisodeItem(episode, podcast.id)).join('')}
            </div>
            ` : ''}
        </div>
    `;
}

function createEpisodeItem(episode, podcastId) {
    const progressClass = episode.progress > 0 ? 'in-progress' : '';
    const progressStyle = episode.progress > 0 ? `style="width: ${episode.progress}%"` : '';
    
    return `
        <div class="episode-item ${progressClass}" data-episode-id="${episode.id}">
            <button class="btn-play-episode" 
                    data-podcast-id="${podcastId}" 
                    data-episode-id="${episode.id}"
                    aria-label="Tocar episódio">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
            <div class="episode-info">
                <h5 class="episode-title">${episode.title}</h5>
                <div class="episode-meta">
                    <span class="episode-date">${formatDate(episode.date)}</span>
                    <span>•</span>
                    <span class="episode-duration">${formatDuration(episode.duration)}</span>
                </div>
                ${episode.progress > 0 ? `
                    <div class="episode-progress">
                        <div class="episode-progress-bar">
                            <div class="episode-progress-fill" ${progressStyle}></div>
                        </div>
                    </div>
                ` : ''}
            </div>
            <button class="btn-download-episode" 
                    data-episode-id="${episode.id}"
                    aria-label="Baixar episódio">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                </svg>
            </button>
        </div>
    `;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return date.toLocaleDateString('pt-BR');
}

function setupPodcastsEvents() {
    // Filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const grid = $('#podcastsGrid');
            if (grid) grid.innerHTML = renderPodcasts();
            setupPodcastsEvents(); // Re-setup events
        });
    });
    
    // Seguir podcast
    const followButtons = document.querySelectorAll('.btn-follow-podcast');
    followButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const podcastId = btn.dataset.podcastId;
            toggleFollow(podcastId, btn);
        });
    });
    
    // Play episódio
    const playButtons = document.querySelectorAll('.btn-play-episode');
    playButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const episodeId = btn.dataset.episodeId;
            playEpisode(episodeId);
        });
    });
    
    // Download episódio
    const downloadButtons = document.querySelectorAll('.btn-download-episode');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const episodeId = btn.dataset.episodeId;
            downloadEpisode(episodeId);
        });
    });
}

function toggleFollow(podcastId, btn) {
    const podcast = podcastsData.find(p => p.id === podcastId);
    if (podcast) {
        podcast.isFollowing = !podcast.isFollowing;
        btn.textContent = podcast.isFollowing ? 'Seguindo' : 'Seguir';
        btn.classList.toggle('following');
    }
}

function playEpisode(episodeId) {
    console.log(`Playing episode: ${episodeId}`);
    alert(`Tocando episódio! (Demo - conectar com player real)`);
}

function downloadEpisode(episodeId) {
    console.log(`Downloading episode: ${episodeId}`);
    alert(`Download iniciado! (Demo)`);
}

