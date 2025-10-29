/* ====================================
   API UTILITIES - Backend Integration
   ==================================== */

const API_BASE_URL = 'http://localhost:5000';

// 🚀 CACHE SUPER AGRESSIVO: 30 minutos para buscas (raramente mudam)
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos (otimizado!)

// 🚀 OTIMIZAÇÃO: Limpar cache automaticamente a cada hora para não encher memória
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            cache.delete(key);
        }
    }
    console.log(`🗑️ Cache cleanup: ${cache.size} entries remaining`);
}, 60 * 60 * 1000); // 1 hora

/**
 * Helper para fetch com error handling e retry otimizado
 */
async function fetchAPI(endpoint, options = {}, retries = 1) {  // 🚀 REDUZIDO: 1 retry apenas
    // Verificar cache primeiro
    const cacheKey = `${endpoint}${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Cache hit: ${endpoint}`);
        return cached.data;
    }

    try {
        // 🚀 OTIMIZAÇÃO: Timeout de 10 segundos para evitar travamentos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            ...options,
        });
        
        clearTimeout(timeoutId);

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
        
        // Retry em caso de erro (mais rápido)
        if (retries > 0) {
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 500));  // 🚀 REDUZIDO: 500ms em vez de 1000ms
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
        console.log(`🎤 API: Buscando artista com ID: ${browseId}`);
        const result = await fetchAPI(`/api/artist/${browseId}`);
        console.log(`🎤 API: Resposta recebida para ${browseId}:`, {
            name: result.name,
            browseId: result.browseId,
            channelId: result.channelId,
            id: result.id
        });
        return result;
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
    }
};

export default api;
