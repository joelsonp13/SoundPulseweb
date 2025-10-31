/* ====================================
   HOME VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeSearchResults, getThumbnail as getBestThumbnail } from '../utils/normalize.js';
import { showLoading, showError, showEmpty } from '../components/loading.js';
import player from '../player.js';
import * as Storage from '../storage.js';
import { $, createElement, showToast } from '../utils/dom.js';
import { enableLazyLoading, preloadPriorityImages } from '../utils/performance.js';

export async function initHomeView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    // Show loading
    showLoading(container, 'grid');
    
    try {
        // Fetch data from backend
        const [homeData, chartsData] = await Promise.all([
            api.getHome(),
            api.getCharts('BR')
        ]);
        
        renderHome(container, homeData, chartsData);
    } catch (error) {
        console.error('Error loading home:', error);
        showError(container, 'Erro ao carregar página inicial', 'Verifique se o backend está rodando');
    }
}

function renderHome(container, homeData, chartsData) {
    // Get user data
    const recentTracks = Storage.getRecentTracks().slice(0, 6);
    
    // Greeting based on time
    const hour = new Date().getHours();
    let greeting = 'Boa tarde';
    if (hour < 12) greeting = 'Bom dia';
    else if (hour >= 18) greeting = 'Boa noite';
    
    container.innerHTML = `
        <div class="home-view">
            <!-- Hero Banner -->
            <div class="home-hero">
                <div class="home-hero-bg">
                    <img src="${getBestThumbnail(chartsData.videos?.[0]?.thumbnails)}" alt="Featured" decoding="async">
                </div>
                <div class="home-hero-overlay"></div>
                <div class="home-hero-content">
                    <span class="home-hero-tag">🔥 Em Alta</span>
                    <h1 class="home-hero-title">Top 50 Brasil</h1>
                    <p class="home-hero-subtitle">As músicas mais ouvidas no Brasil agora</p>
                    <div class="home-hero-actions">
                        <button class="btn btn-primary" id="playTopCharts">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            Ouvir agora
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Greeting Section -->
            <section class="greeting-section">
                <h2 class="greeting-title">${greeting}</h2>
                <div class="greeting-grid" id="greetingGrid"></div>
            </section>
            
            <!-- Charts -->
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">🎵 Top 50 Brasil</h2>
                    <a href="#/browse" class="section-link">Ver tudo</a>
                </div>
                <div class="carousel-wrapper">
                    <button class="carousel-nav carousel-nav-prev" data-carousel="chartsCarousel" aria-label="Anterior">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <div class="carousel" id="chartsCarousel"></div>
                    <button class="carousel-nav carousel-nav-next" data-carousel="chartsCarousel" aria-label="Próximo">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
            </section>
            
            <!-- Home Sections (do backend) -->
            <div id="homeSections"></div>
        </div>
    `;
    
    // Render greeting grid (usa homeData com músicas reais)
    renderGreetingGrid(recentTracks, homeData);
    
    // Render charts (ainda usa chartsData mas mostra playlists)
    renderCharts(chartsData);
    
    // Render home sections from backend
    renderHomeSections(homeData);
    
    // Setup hero button
    setupHeroButton(chartsData);
    
    // Setup carousel navigation for all carousels
    setupCarouselNavigation();
    
    // 🚀 PERFORMANCE: Lazy loading e preload
    setTimeout(() => {
        enableLazyLoading();
        // Pré-carregar as 6 primeiras imagens do greeting grid
        const gridImages = Array.from(document.querySelectorAll('.greeting-card img'))
            .slice(0, 6)
            .map(img => img.src);
        preloadPriorityImages(gridImages);
    }, 0);
}

function renderGreetingGrid(recentTracks, homeData) {
    const grid = $('#greetingGrid');
    if (!grid) return;
    
    // CORREÇÃO: homeData tem seções com músicas reais (não playlists!)
    // Procurar a primeira seção que tenha "contents" com músicas
    let tracks = [];
    
    for (const section of homeData || []) {
        if (section.contents && section.contents.length > 0) {
            // Filtrar apenas items que sejam músicas (têm videoId)
            const songs = section.contents.filter(item => item.videoId);
            if (songs.length > 0) {
                tracks = songs;
                break; // Usar a primeira seção com músicas
            }
        }
    }
    
    const items = tracks.slice(0, 6);
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="color: var(--color-text-secondary);">Nenhuma música disponível</p>';
        return;
    }
    
    const htmlItems = items.map(item => {
        // Garantir que videoId existe e é válido
        const videoId = item.videoId;
        if (!videoId || videoId.startsWith('track-')) {
            return ''; // Ignorar IDs mockados/inválidos
        }
        
        const title = item.title || 'Unknown';
        const artist = item.artists?.[0]?.name || item.artist || 'Unknown';
        const image = getBestThumbnail(item.thumbnails);
        
        return `
            <div class="greeting-card" data-video-id="${videoId}">
                <img src="${image}" alt="${title}" loading="lazy" decoding="async">
                <div class="greeting-card-info">
                    <span class="greeting-card-title">${title}</span>
                </div>
                <button class="greeting-card-play">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
            </div>
        `;
    }).filter(Boolean);
    
    grid.innerHTML = htmlItems.join('');
    
    // Add click handlers (card and play button)
    grid.querySelectorAll('.greeting-card').forEach(card => {
        const playBtn = card.querySelector('.greeting-card-play');
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const videoId = card.dataset.videoId;
            if (videoId) {
                player.loadTrack(videoId);
                player.play();
            }
        };
        card.addEventListener('click', handler);
        if (playBtn) playBtn.addEventListener('click', handler);
    });
}

function renderCharts(chartsData) {
    const carousel = $('#chartsCarousel');
    if (!carousel) return;
    
    // CORREÇÃO: chartsData.videos retorna playlists (com playlistId), não músicas (com videoId)
    const playlists = chartsData.videos || chartsData.trending || [];
    
    if (playlists.length === 0) {
        carousel.innerHTML = '<p style="color: var(--color-text-secondary);">Nenhum chart disponível</p>';
        return;
    }
    
    carousel.innerHTML = playlists.slice(0, 10).map((track, index) => {
        const playlistId = track.playlistId;  // Mudança: usar playlistId em vez de videoId
        
        // Validação: ignorar items sem playlistId
        if (!playlistId) {
            return '';
        }
        
        const title = track.title || 'Unknown';
        const artist = track.artists?.[0]?.name || 'Unknown';
        const image = getBestThumbnail(track.thumbnails);
        
        return `
            <div class="music-card" data-playlist-id="${playlistId}">
                <div class="music-card-image">
                    <img src="${image}" alt="${title}" loading="lazy" decoding="async">
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
                    <div class="music-card-title">${title}</div>
                    <div class="music-card-artist">${artist}</div>
                </div>
            </div>
        `;
    }).filter(Boolean).join('');  // Filtrar items vazios
    
    // Add click handlers (card and play button) - agora navega para playlist
    carousel.querySelectorAll('.music-card').forEach(card => {
        const playBtn = card.querySelector('.btn-play-card');
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const playlistId = card.dataset.playlistId;
            if (playlistId) {
                // Navegar para página da playlist em vez de tentar tocar
                window.location.hash = `#/playlist/${playlistId}`;
            }
        };
        card.addEventListener('click', handler);
        if (playBtn) playBtn.addEventListener('click', handler);
    });
}

function renderHomeSections(homeData) {
    const sectionsContainer = $('#homeSections');
    
    if (!sectionsContainer) return;
    
    // Home data do ytmusicapi É um array direto de seções
    const sections = Array.isArray(homeData) ? homeData : [];
    
    if (sections.length === 0) {
        return;
    }
    
    // Renderizar cada seção
    const sectionsHTML = sections.map((section, index) => {
        const title = section.title || 'Seção';
        const contents = section.contents || [];
        
        if (contents.length === 0) {
            return '';
        }
        
        // Renderizar items
        const itemsHTML = contents.filter(Boolean).map(item => {
            return renderHomeItem(item);
        }).join('');
        
        const sectionId = `carousel-${index}`;
        
        return `
            <section class="section">
                <div class="section-header">
                    <h2 class="section-title">${title}</h2>
                </div>
                <div class="carousel-wrapper">
                    <button class="carousel-nav carousel-nav-prev" data-carousel="${sectionId}" aria-label="Anterior">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <div class="carousel" id="${sectionId}">
                        ${itemsHTML}
                    </div>
                    <button class="carousel-nav carousel-nav-next" data-carousel="${sectionId}" aria-label="Próximo">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
            </section>
        `;
    }).filter(Boolean).join('');
    
    sectionsContainer.innerHTML = sectionsHTML;
    
    // Add click handlers to all items
    setupHomeItemHandlers();
}

function renderHomeItem(item) {
    if (!item) return '';
    
    // Detectar tipo automaticamente se não tiver resultType
    let type = item.resultType;
    if (!type) {
        if (item.videoId) {
            type = 'song';  // Se tem videoId, é música/vídeo
        } else if (item.playlistId) {
            type = 'playlist';
        } else if (item.browseId) {
            // Detectar se é album, artist, etc pela estrutura
            // Albums normalmente têm artists[] e não têm videoId
            if (item.artists && item.artists.length > 0 && !item.videoId) {
                type = 'album';
            } else if (item.subscribers !== undefined || item.followers !== undefined) {
                type = 'artist';
            } else {
                type = 'playlist'; // Default para playlist se não conseguir detectar
            }
        }
    }
    
    // Usar playlistId se disponível, senão videoId ou browseId
    const videoId = item.playlistId || item.videoId || item.browseId;
    if (!videoId) {
        console.warn('⚠️ Item sem IDs válidos:', item);
        return '';
    }
    const title = item.title || 'Unknown';
    const subtitle = item.artists?.[0]?.name || item.author || item.description || '';
    const image = getBestThumbnail(item.thumbnails);
    
    if (!image) {
        console.warn('⚠️ Item sem thumbnail:', title);
    }
    
    return `
        <div class="music-card" data-id="${videoId}" data-type="${type}">
            <div class="music-card-image">
                <img src="${image}" alt="${title}" loading="lazy" decoding="async">
                <div class="music-card-overlay">
                    <button class="btn-play-card">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="music-card-info">
                <div class="music-card-title">${title}</div>
                <div class="music-card-artist">${subtitle}</div>
            </div>
        </div>
    `;
}

function setupHomeItemHandlers() {
    document.querySelectorAll('.music-card[data-id]').forEach(card => {
        const playBtn = card.querySelector('.btn-play-card');
        const onPlay = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = card.dataset.id;
            const type = card.dataset.type;
            if (type === 'song' || type === 'video') {
                player.loadTrack(id);
                player.play();
            }
        };
        const onNavigate = () => {
            const id = card.dataset.id;
            const type = card.dataset.type;
            if (type === 'playlist') {
                window.location.hash = `#/playlist/${id}`;
            } else if (type === 'album') {
                window.location.hash = `#/album/${id}`;
            } else if (type === 'artist') {
                window.location.hash = `#/artist/${id}`;
            } else if (type === 'song' || type === 'video') {
                // Se o tipo for música/vídeo, clique no card também toca
                player.loadTrack(id);
                player.play();
            }
        };
        card.addEventListener('click', onNavigate);
        if (playBtn) playBtn.addEventListener('click', onPlay);
    });
}

function setupHeroButton(chartsData) {
    const btn = $('#playTopCharts');
    if (!btn) return;
    
    btn.addEventListener('click', async () => {
        // Charts retorna playlists, não músicas diretas
        const playlists = chartsData.videos || chartsData.trending || [];
        
        if (playlists.length === 0) {
            showToast('⚠️ Nenhuma playlist disponível', 'warning');
            return;
        }
        
        const firstPlaylist = playlists[0];
        const playlistId = firstPlaylist.playlistId;
        
        if (!playlistId) {
            showToast('❌ Erro: playlist inválida', 'error');
            return;
        }
        
        // Carregar playlist e tocar primeira música
        try {
            const playlistData = await api.getPlaylist(playlistId, 100);
            const tracks = playlistData.tracks || [];
            
            if (tracks.length > 0) {
                const firstTrack = tracks[0];
                const videoId = firstTrack.videoId;
                
                if (videoId) {
                    player.loadTrack(videoId);
                    player.play();
                    showToast('🎵 Tocando Top Charts!', 'success');
                } else {
                    showToast('❌ Erro: música inválida', 'error');
                }
            } else {
                showToast('⚠️ Playlist vazia', 'warning');
            }
        } catch (error) {
            showToast('❌ Erro ao carregar Top Charts', 'error');
        }
    });
}

function setupCarouselNavigation() {
    // Pegar todos os botões de navegação
    const navButtons = document.querySelectorAll('.carousel-nav');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const carouselId = button.dataset.carousel;
            const carousel = document.getElementById(carouselId);
            
            if (!carousel) return;
            
            const scrollAmount = carousel.clientWidth * 0.8; // 80% da largura visível
            const isPrev = button.classList.contains('carousel-nav-prev');
            
            if (isPrev) {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
            
            // Atualizar estado dos botões após scroll
            setTimeout(() => updateCarouselButtons(carouselId), 300);
        });
    });
    
    // Atualizar estado inicial dos botões
    document.querySelectorAll('.carousel').forEach(carousel => {
        updateCarouselButtons(carousel.id);
        
        // Atualizar ao scrollar
        carousel.addEventListener('scroll', () => {
            updateCarouselButtons(carousel.id);
        });
    });
}

function updateCarouselButtons(carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const prevBtn = document.querySelector(`.carousel-nav-prev[data-carousel="${carouselId}"]`);
    const nextBtn = document.querySelector(`.carousel-nav-next[data-carousel="${carouselId}"]`);
    
    if (!prevBtn || !nextBtn) return;
    
    // Verificar se está no início
    const isAtStart = carousel.scrollLeft <= 0;
    prevBtn.classList.toggle('disabled', isAtStart);
    
    // Verificar se está no final
    const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;
    nextBtn.classList.toggle('disabled', isAtEnd);
}

export default initHomeView;
