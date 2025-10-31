/* ====================================
   PODCASTS VIEW
   ==================================== */

import { $ } from '../utils/dom.js';
import { formatDuration } from '../utils/time.js';
import api from '../utils/api.js';
import { showLoading, showError } from '../components/loading.js';
import player from '../player.js';

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
                
                <div class="podcasts-search">
                    <input type="text" placeholder="Buscar podcasts..." id="podcastSearchInput" class="podcast-search-input">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                    </svg>
                </div>
                
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
            ${podcast.episodes > 3 ? `
            <button class="btn-see-more-episodes" data-browse-id="${podcast.browseId || podcast.id}">
                Ver todos os episódios
            </button>
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

let searchDebounceTimer;

function setupPodcastsEvents() {
    // Busca de podcasts
    const searchInput = $('#podcastSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            const query = e.target.value.trim();
            
            if (query.length > 0) {
                searchDebounceTimer = setTimeout(() => {
                    handlePodcastSearch(query);
                }, 500);
            } else {
                // Se limpar a busca, recarregar podcasts padrão
                handlePodcastSearch('');
            }
        });
    }
    
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
    
    // Ver mais episódios
    const seeMoreButtons = document.querySelectorAll('.btn-see-more-episodes');
    seeMoreButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const browseId = btn.dataset.browseId;
            if (browseId) {
                window.location.hash = `#/podcast/${browseId}`;
            }
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

async function playEpisode(episodeId) {
    console.log(`Playing episode: ${episodeId}`);
    
    // Buscar o episódio nos dados para pegar videoId
    let videoId = episodeId;
    
    for (const podcast of podcastsData) {
        const episode = podcast.latestEpisodes?.find(ep => ep.id === episodeId);
        if (episode && episode.videoId) {
            videoId = episode.videoId;
            break;
        }
    }
    
    // Se ainda não tiver videoId e começar com MPED, tentar extrair
    if (!videoId && episodeId.startsWith('MPED')) {
        videoId = episodeId.substring(4);
    }
    
    if (videoId) {
        player.loadTrack(videoId);
        player.play();
    }
}

function downloadEpisode(episodeId) {
    console.log(`Downloading episode: ${episodeId}`);
    alert(`Download iniciado! (Demo)`);
}

async function handlePodcastSearch(query) {
    const grid = $('#podcastsGrid');
    if (!grid) return;
    
    if (query.length === 0) {
        // Recarregar podcasts padrão
        try {
            const response = await api.getPodcasts('all');
            podcastsData = response.results || [];
            grid.innerHTML = renderPodcasts();
            setupPodcastsEvents();
        } catch (error) {
            console.error('Error loading podcasts:', error);
        }
        return;
    }
    
    // Mostrar loading
    grid.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const response = await api.searchPodcasts(query);
        podcastsData = response.results || [];
        grid.innerHTML = renderPodcasts();
        setupPodcastsEvents();
    } catch (error) {
        console.error('Error searching podcasts:', error);
        grid.innerHTML = '<div class="empty-state"><h3>Erro ao buscar podcasts</h3></div>';
    }
}

export async function initPodcastDetailView(params) {
    const container = $('#viewContainer');
    if (!container) return;
    
    const browseId = params.id;
    if (!browseId) {
        container.innerHTML = '<div class="empty-state"><h3>Podcast não encontrado</h3></div>';
        return;
    }
    
    showLoading(container, 'list');
    
    try {
        const podcast = await api.getPodcastDetail(browseId);
        
        container.innerHTML = `
            <div class="podcast-detail-view">
                <div class="podcast-detail-header">
                    <div class="podcast-detail-cover">
                        <img src="${podcast.image}" alt="${podcast.title}" loading="eager">
                    </div>
                    <div class="podcast-detail-info">
                        <span class="podcast-detail-type">Podcast</span>
                        <h1 class="podcast-detail-title">${podcast.title}</h1>
                        <div class="podcast-detail-author">
                            <span>por</span>
                            <span class="author-name">${podcast.author}</span>
                        </div>
                        ${podcast.description ? `<p class="podcast-detail-description">${podcast.description}</p>` : ''}
                        <div class="podcast-detail-meta">
                            <span>${podcast.episodes?.length || 0} episódios</span>
                        </div>
                    </div>
                </div>
                
                <div class="podcast-detail-actions">
                    <button class="btn btn-primary" id="playPodcast">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        Play
                    </button>
                </div>
                
                <div class="podcast-episodes-list" id="podcastEpisodesList"></div>
            </div>
        `;
        
        renderPodcastEpisodes(podcast.episodes || []);
        setupPodcastPlayButton(podcast);
    } catch (error) {
        console.error('Error loading podcast:', error);
        showError(container, 'Erro ao carregar podcast');
    }
}

function renderPodcastEpisodes(episodes) {
    const container = $('#podcastEpisodesList');
    if (!container) return;
    
    if (episodes.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-secondary); padding: var(--spacing-xl);">Nenhum episódio disponível</p>';
        return;
    }
    
    container.innerHTML = episodes.map((episode, index) => `
        <div class="episode-item" data-episode-id="${episode.id}">
            <span class="episode-number">${index + 1}</span>
            <button class="btn-play-episode-detail" 
                    data-episode-id="${episode.id}"
                    data-video-id="${episode.videoId}"
                    aria-label="Tocar episódio">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>
            <div class="episode-info">
                <h5 class="episode-title">${episode.title}</h5>
                <div class="episode-meta">
                    <span class="episode-date">${episode.date || ''}</span>
                    ${episode.durationRaw ? `<span>•</span><span class="episode-duration">${episode.durationRaw}</span>` : ''}
                </div>
                ${episode.description ? `<p class="episode-description">${episode.description.substring(0, 150)}${episode.description.length > 150 ? '...' : ''}</p>` : ''}
            </div>
        </div>
    `).join('');
    
    setupEpisodePlayButtons();
}

function setupPodcastPlayButton(podcast) {
    const btn = $('#playPodcast');
    if (!btn || !podcast.episodes || podcast.episodes.length === 0) return;
    
    btn.addEventListener('click', () => {
        const firstEpisode = podcast.episodes[0];
        if (firstEpisode && firstEpisode.videoId) {
            player.loadTrack(firstEpisode.videoId);
            player.play();
        }
    });
}

function setupEpisodePlayButtons() {
    document.querySelectorAll('.btn-play-episode-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const videoId = btn.dataset.videoId;
            if (videoId) {
                player.loadTrack(videoId);
                player.play();
            }
        });
    });
}

function getBestThumbnail(thumbnails) {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
        return 'assets/images/covers/placeholder.svg';
    }
    const sortedThumbs = thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
    return sortedThumbs[0]?.url || 'assets/images/covers/placeholder.svg';
}

