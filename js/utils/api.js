/* ====================================
   API UTILITIES - Backend Integration
   ==================================== */

function resolveApiBase() {
    try {
        // 1) Override via localStorage (persistente)
        const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('API_BASE_URL') : null;
        if (ls && typeof ls === 'string' && ls.trim()) {
            return ls.replace(/\/$/, '');
        }
        
        // 2) DETECTAR SE ESTÁ RODANDO LOCALMENTE
        // Se hostname é localhost, 127.0.0.1 ou IP local, usar backend local
        const isLocal = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0' ||
            window.location.hostname.startsWith('192.168.') ||
            window.location.hostname.startsWith('10.') ||
            window.location.hostname.startsWith('172.')
        );
        
        if (isLocal) {
            return 'http://localhost:5000';
        }
        
        // 3) Meta tag no index.html (produção)
        const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="sp-api-base"]')?.content : '';
        if (meta && meta.trim()) {
            return meta.replace(/\/$/, '');
        }
        
        // 4) Variável global injetável
        if (typeof window !== 'undefined' && window.__SP_API_BASE__) {
            return String(window.__SP_API_BASE__).replace(/\/$/, '');
        }
        
        // 5) Fallback dev
        return 'http://localhost:5000';
    } catch (e) {
        return 'http://localhost:5000';
    }
}

const API_BASE_URL = resolveApiBase();

// Log da URL escolhida (apenas em dev)
if (typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
)) {
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
}

// 🚀 CACHE AGRESSIVO: 15 minutos para performance máxima
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

/**
 * Helper para fetch com error handling e retry
 */
async function fetchAPI(endpoint, options = {}, retries = 2) {
    // Verificar cache primeiro
    const cacheKey = `${endpoint}${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Cache hit: ${endpoint}`);
        return cached.data;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Armazenar em cache
        cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    } catch (error) {
        console.error(`❌ API Error: ${endpoint}`, error);
        
        // Retry em caso de erro
        if (retries > 0) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchAPI(endpoint, options, retries - 1);
        }
        
        throw error;
    }
}

/**
 * API principal - Exporta funções para cada endpoint do backend
 */
export const api = {
    /**
     * SEARCH - Buscar músicas, artistas, álbuns, playlists
     */
    async search(query, filter = 'songs', limit = 20) {
        if (!query) return { results: [], count: 0 };
        
        const params = new URLSearchParams({
            q: query,
            filter,
            limit: limit.toString()
        });
        
        return await fetchAPI(`/api/search?${params}`);
    },

    /**
     * SEARCH SUGGESTIONS - Autocomplete
     */
    async getSearchSuggestions(query) {
        if (!query || query.length < 2) return { suggestions: [] };
        
        const params = new URLSearchParams({ q: query });
        return await fetchAPI(`/api/search/suggestions?${params}`);
    },

    /**
     * SONG - Obter metadados de uma música
     */
    async getSong(videoId) {
        return await fetchAPI(`/api/song/${videoId}`);
    },

    /**
     * RELATED SONGS - Músicas similares/relacionadas
     */
    async getRelatedSongs(videoId, limit = 25) {
        return await fetchAPI(`/api/song/${videoId}/related`);
    },

    /**
     * LYRICS - Letras de música
     */
    async getLyrics(browseId) {
        return await fetchAPI(`/api/lyrics/${browseId}`);
    },

    /**
     * ARTIST - Perfil completo de artista
     */
    async getArtist(browseId) {
        return await fetchAPI(`/api/artist/${browseId}`);
    },

    /**
     * ARTIST ALBUMS - Discografia completa
     * @param {string} browseId - ID do artista
     * @param {string} channelId - (Opcional) channelId do artista para melhor precisão
     */
    async getArtistAlbums(browseId, channelId = null) {
        const url = channelId 
            ? `/api/artist/${browseId}/albums?params=${channelId}`
            : `/api/artist/${browseId}/albums`;
        return await fetchAPI(url);
    },

    /**
     * ALBUM - Detalhes e tracklist de álbum
     */
    async getAlbum(browseId) {
        return await fetchAPI(`/api/album/${browseId}`);
    },

    /**
     * PLAYLIST - Detalhes e músicas de playlist
     */
    async getPlaylist(browseId, limit = 100) {
        const params = new URLSearchParams({ limit: limit.toString() });
        return await fetchAPI(`/api/playlist/${browseId}?${params}`);
    },

    /**
     * WATCH PLAYLIST - Rádio automático baseado em uma música
     */
    async getWatchPlaylist(videoId, limit = 50) {
        const params = new URLSearchParams({ limit: limit.toString() });
        return await fetchAPI(`/api/watch/${videoId}?${params}`);
    },

    /**
     * CHARTS - Top músicas globais ou por país
     */
    async getCharts(country = 'BR') {
        const params = new URLSearchParams({ country });
        return await fetchAPI(`/api/charts?${params}`);
    },

    /**
     * HOME - Conteúdo da página inicial
     */
    async getHome() {
        return await fetchAPI('/api/home');
    },

    /**
     * MOOD CATEGORIES - Categorias de humor/gênero
     */
    async getMoodCategories() {
        return await fetchAPI('/api/moods');
    },

    /**
     * MOOD PLAYLISTS - Playlists por humor/gênero
     */
    async getMoodPlaylists(params) {
        return await fetchAPI(`/api/moods/${params}`);
    },

    /**
     * HEALTH - Verificar se backend está online
     */
    async checkHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    },

    /**
     * Limpar cache
     */
    clearCache() {
        cache.clear();
        console.log('🗑️ Cache limpo!');
    },
    
    /**
     * Obter URL base da API (para caso de precisar usar em outros lugares)
     */
    getBaseUrl() {
        return API_BASE_URL;
    }
};

export default api;
export { API_BASE_URL };
