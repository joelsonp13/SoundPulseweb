/* ====================================
   SEARCH VIEW - Integrado com Backend
   ==================================== */

import api from '../utils/api.js';
import { normalizeSearchResults, getThumbnail as getBestThumbnail } from '../utils/normalize.js';
import { showLoading, showEmpty, showError } from '../components/loading.js';
import player from '../player.js';
import { $, createElement } from '../utils/dom.js';
import { enableLazyLoading } from '../utils/performance.js';

let currentResults = [];
let currentTab = 'songs';
let searchTimeout = null;
let currentQuery = ''; // 🚀 Cache da query atual
let isSearching = false; // 🚀 Prevenir buscas duplicadas

// 🚀 VIRTUALIZAÇÃO: Renderizar em lotes para performance máxima
const ITEMS_PER_BATCH = 8; // 🚀 REDUZIDO: 8 itens primeiro lote para velocidade máxima
let renderBatchTimeout = null;

export function initSearchView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="search-view">
            <div class="search-header">
                <div class="search-box">
                    <div class="search-input-wrapper">
                        <svg class="search-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input type="text" class="search-input" id="searchInput" placeholder="O que você quer ouvir?" autofocus>
                        <button class="search-submit" id="searchSubmit" title="Buscar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </button>
                        <button class="search-clear hidden" id="searchClear" title="Limpar">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="search-suggestions hidden" id="searchSuggestions"></div>
                </div>
            </div>
            
            <div class="search-tabs hidden" id="searchTabs">
                <button class="search-tab active" data-tab="songs">Músicas</button>
                <button class="search-tab" data-tab="artists">Artistas</button>
                <button class="search-tab" data-tab="albums">Álbuns</button>
                <button class="search-tab" data-tab="playlists">Playlists</button>
            </div>
            
            <div class="search-results" id="searchResults">
                <div class="search-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.3">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <h3>Busque por músicas, artistas, álbuns ou playlists</h3>
                    <p>Digite algo para começar</p>
                </div>
            </div>
        </div>
    `;
    
    setupSearchHandlers();
}

function setupSearchHandlers() {
    const searchInput = $('#searchInput');
    const searchSubmit = $('#searchSubmit');
    const searchClear = $('#searchClear');
    const searchTabs = $('#searchTabs');
    const suggestionsBox = $('#searchSuggestions');
    
    if (!searchInput) return;
    
    // 🔧 FIX: Input apenas para sugestões e show/hide botões
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Show/hide clear button
        if (query) {
            searchClear?.classList.remove('hidden');
        } else {
            searchClear?.classList.add('hidden');
            suggestionsBox?.classList.add('hidden');
            searchTabs?.classList.add('hidden');
            showPlaceholder();
            return;
        }
        
        // Apenas sugestões (autocomplete)
        clearTimeout(searchTimeout);
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => loadSuggestions(query), 200);
        }
        
        // ❌ REMOVIDO: Busca automática
    });
    
    // 🆕 BOTÃO DE BUSCA
    searchSubmit?.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });
    
    // 🆕 ENTER PARA BUSCAR
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                performSearch(query);
                suggestionsBox?.classList.add('hidden');
            }
        }
    });
    
    // Clear button
    searchClear?.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.add('hidden');
        suggestionsBox?.classList.add('hidden');
        searchTabs?.classList.add('hidden');
        showPlaceholder();
        searchInput.focus();
    });
    
    // Tab handlers - 🚀 OTIMIZADO: Troca instantânea de filtros
    searchTabs?.querySelectorAll('.search-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const newTab = tab.dataset.tab;
            if (newTab === currentTab) return;
            
            console.log(`🔄 Mudando filtro: ${currentTab} → ${newTab}`);
            currentTab = newTab;
            
            // Update active tab
            searchTabs.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 🚀 OTIMIZAÇÃO RADICAL: Se já temos resultados, filtrar localmente primeiro
            const query = searchInput.value.trim();
            if (query && currentResults.length > 0) {
                console.log(`⚡ Filtro local instantâneo para "${query}"`);
                filterResultsLocally(newTab);
            } else if (query) {
                console.log(`🔍 Buscando "${query}" com filtro "${newTab}"`);
                performSearch(query);
            }
        });
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            suggestionsBox?.classList.add('hidden');
        }
    });
}

async function loadSuggestions(query) {
    const suggestionsBox = $('#searchSuggestions');
    if (!suggestionsBox) return;
    
    try {
        const data = await api.getSearchSuggestions(query);
        const suggestions = data.suggestions || [];
        
        if (suggestions.length === 0) {
            suggestionsBox.classList.add('hidden');
            return;
        }
        
        suggestionsBox.innerHTML = suggestions.slice(0, 8).map(suggestion => `
            <div class="search-suggestion-item" data-query="${suggestion}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <span>${suggestion}</span>
            </div>
        `).join('');
        
        suggestionsBox.classList.remove('hidden');
        
        // Click handlers
        suggestionsBox.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query;
                $('#searchInput').value = query;
                suggestionsBox.classList.add('hidden');
                performSearch(query);
            });
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

async function performSearch(query) {
    const resultsContainer = $('#searchResults');
    const searchTabs = $('#searchTabs');
    const suggestionsBox = $('#searchSuggestions');
    
    if (!resultsContainer || !query) return;
    
    console.log(`🔍 performSearch: query="${query}", tab="${currentTab}", isSearching=${isSearching}`);
    
    // 🚀 OTIMIZAÇÃO: Prevenir buscas duplicadas (mas permitir mudança de filtro)
    if (isSearching && query === currentQuery) {
        console.log('🚫 Busca já em andamento, ignorando...');
        return;
    }
    
    isSearching = true;
    currentQuery = query;
    
    // Hide suggestions
    suggestionsBox?.classList.add('hidden');
    
    // Show loading (mais rápido)
    showLoading(resultsContainer, 'list');
    searchTabs?.classList.remove('hidden');
    
    // 🚀 OTIMIZAÇÃO: Mostrar feedback imediato
    console.log(`⏱️ Iniciando busca: ${new Date().toLocaleTimeString()}`);
    
    try {
        // 🚀 OTIMIZAÇÃO RADICAL: Busca paralela de todos os tipos
        console.log(`📡 Fazendo busca paralela para "${query}"`);
        
        // Buscar todos os tipos em paralelo (máxima velocidade)
        const searchPromises = [
            api.search(query, 'songs', 8),
            api.search(query, 'artists', 4),
            api.search(query, 'albums', 4),
            api.search(query, 'playlists', 4)
        ];
        
        const [songsData, artistsData, albumsData, playlistsData] = await Promise.all(searchPromises);
        
        // Combinar todos os resultados
        const allResults = [
            ...normalizeSearchResults(songsData),
            ...normalizeSearchResults(artistsData),
            ...normalizeSearchResults(albumsData),
            ...normalizeSearchResults(playlistsData)
        ];
        
        currentResults = allResults;
        console.log(`🎯 Total de resultados: ${currentResults.length} itens`);
        console.log(`⏱️ Busca paralela concluída: ${new Date().toLocaleTimeString()}`);
        
        if (currentResults.length === 0) {
            showEmpty(resultsContainer, `Nenhum resultado para "${query}"`, '🔍');
            return;
        }
        
        // Filtrar para o tipo atual
        filterResultsLocally(currentTab);
    } catch (error) {
        console.error('Search error:', error);
        showError(resultsContainer, 'Erro na busca', 'Tente novamente');
    } finally {
        isSearching = false;
    }
}

function renderResults(results) {
    const resultsContainer = $('#searchResults');
    if (!resultsContainer) return;
    
    // 🚀 OTIMIZAÇÃO: Renderizar tudo de uma vez (30 itens é gerenciável)
    // Para listas maiores, considerar virtualização completa
    
    // Usar DocumentFragment para batch rendering
    const fragment = document.createDocumentFragment();
    const listWrapper = document.createElement('div');
    listWrapper.className = 'search-results-list';
    
    // 🚀 OTIMIZAÇÃO CRÍTICA: Renderizar primeiro lote imediatamente (primeiros 15 visíveis)
    const firstBatch = results.slice(0, ITEMS_PER_BATCH);
    const secondBatch = results.slice(ITEMS_PER_BATCH);
    
    // Renderizar primeiro lote (aparece instantaneamente)
    listWrapper.innerHTML = firstBatch.map(item => renderResultItem(item)).join('');
    
    fragment.appendChild(listWrapper);
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(fragment);
    
    // Setup handlers para primeiro lote
    setupResultHandlers();
    
    // 🚀 Lazy loading para primeiro lote
    requestAnimationFrame(() => enableLazyLoading());
    
    // 🚀 SEGUNDO LOTE: Renderizar resto após frame (não bloqueia UI)
    if (secondBatch.length > 0) {
        requestAnimationFrame(() => {
            const list = resultsContainer.querySelector('.search-results-list');
            if (!list) return;
            
            // Adicionar segundo lote
            const secondBatchHTML = secondBatch.map(item => renderResultItem(item)).join('');
            list.insertAdjacentHTML('beforeend', secondBatchHTML);
            
            // Setup handlers para segundo lote
            setupResultHandlers();
            
            // Lazy loading para segundo lote
            requestAnimationFrame(() => enableLazyLoading());
        });
    }
}

function renderResultItem(item) {
    const type = item.type;
    
    // 🎨 Layout especial para artistas
    if (type === 'artist') {
        return renderArtistCard(item);
    }
    
    const id = item.id || item.videoId || item.browseId;
    const title = item.title || item.name;
    const subtitle = getSubtitle(item);
    const image = item.image;
    
    return `
        <div class="result-item" data-id="${id}" data-type="${type}">
            <div class="result-item-image">
                <img src="${image}" alt="${title}" loading="lazy" decoding="async" fetchpriority="low">
                <div class="result-item-overlay">
                    <button class="btn-play-result">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="result-item-info">
                <div class="result-item-title">${title}</div>
                <div class="result-item-subtitle">${subtitle}</div>
            </div>
        </div>
    `;
}

function renderArtistCard(artist) {
    const id = artist.id || artist.browseId;
    const name = artist.name || 'Artista Desconhecido';
    const image = artist.image || 'assets/images/covers/placeholder.svg';
    const subscribers = artist.subscribers || '';
    
    return `
        <div class="artist-card" data-id="${id}" data-type="artist">
            <div class="artist-card-image">
                <img src="${image}" alt="${name}" loading="lazy" decoding="async" fetchpriority="low">
                <div class="artist-card-overlay">
                    <button class="btn-play-artist">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="artist-card-info">
                <div class="artist-card-name">${name}</div>
                <div class="artist-card-label">Artista</div>
                ${subscribers ? `<div class="artist-card-subscribers">${subscribers}</div>` : ''}
            </div>
        </div>
    `;
}

function getSubtitle(item) {
    switch (item.type) {
        case 'song':
            return `${item.artist} ${item.album ? `• ${item.album}` : ''}`;
        case 'artist':
            return `Artista ${item.subscribers ? `• ${item.subscribers} inscritos` : ''}`;
        case 'album':
            return `${item.artist} ${item.year ? `• ${item.year}` : ''}`;
        case 'playlist':
            return `Playlist ${item.trackCount ? `• ${item.trackCount} músicas` : ''}`;
        default:
            return '';
    }
}

function setupResultHandlers() {
    // Handlers para músicas, álbuns, playlists
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            
            console.log('🎯 Clicou no item:', { id, type }); // Debug
            
            // Se clicou no botão play
            if (e.target.closest('.btn-play-result')) {
                handleResultClick(id, type, true); // true = play action
            } else {
                // Clicou no card = navegar
                handleResultClick(id, type, false); // false = navigate action
            }
        });
    });
    
    // Handlers para artistas
    document.querySelectorAll('.artist-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const id = card.dataset.id;
            
            console.log('🎤 Clicou no artista:', id); // Debug
            
            // Sempre navegar para página do artista
            window.location.hash = `#/artist/${id}`;
        });
    });
}

function handleResultClick(id, type, isPlayAction) {
    console.log('🚀 handleResultClick:', { id, type, isPlayAction }); // Debug
    
    switch (type) {
        case 'song':
            // Música: sempre tocar (tanto no botão quanto no card)
            player.loadTrack(id);
            player.play();
            break;
            
        case 'artist':
            // Artista: navegar para página
            window.location.hash = `#/artist/${id}`;
            break;
            
        case 'album':
            if (isPlayAction) {
                // Botão play: tocar primeira música do álbum (TODO: implementar)
                window.location.hash = `#/album/${id}`;
            } else {
                // Card: navegar para página do álbum
                window.location.hash = `#/album/${id}`;
            }
            break;
            
        case 'playlist':
            if (isPlayAction) {
                // Botão play: tocar primeira música da playlist (TODO: implementar)
                window.location.hash = `#/playlist/${id}`;
            } else {
                // Card: navegar para página da playlist
                window.location.hash = `#/playlist/${id}`;
            }
            break;
            
        default:
            console.warn('⚠️ Tipo desconhecido:', type);
    }
}

function showPlaceholder() {
    const resultsContainer = $('#searchResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="search-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64" opacity="0.3">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <h3>Busque por músicas, artistas, álbuns ou playlists</h3>
            <p>Digite algo para começar</p>
        </div>
    `;
}

// 🚀 OTIMIZAÇÃO RADICAL: Filtro local instantâneo
function filterResultsLocally(filterType) {
    console.log(`⚡ Filtro local: ${currentResults.length} resultados → ${filterType}`);
    
    // Filtrar resultados existentes por tipo
    const filteredResults = currentResults.filter(item => {
        switch (filterType) {
            case 'songs':
                return item.type === 'song';
            case 'artists':
                return item.type === 'artist';
            case 'albums':
                return item.type === 'album';
            case 'playlists':
                return item.type === 'playlist';
            default:
                return true;
        }
    });
    
    console.log(`⚡ Filtro local: ${filteredResults.length} resultados encontrados`);
    
    if (filteredResults.length === 0) {
        // Se não há resultados locais, fazer busca no servidor
        const query = $('#searchInput').value.trim();
        if (query) {
            console.log(`🔍 Nenhum resultado local, buscando no servidor...`);
            performSearch(query);
        }
        return;
    }
    
    // Renderizar resultados filtrados instantaneamente
    renderResults(filteredResults);
}

export default initSearchView;
