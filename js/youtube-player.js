/**
 * YouTube IFrame Player Wrapper
 * Gerencia reprodução de música usando YouTube IFrame API
 */

class YouTubePlayer {
    constructor() {
        this.player = null;
        this.isReady = false;
        this.currentVideoId = null;
        this.onReadyCallback = null;
        this.onStateChangeCallback = null;
        this.onErrorCallback = null;
        
        // Aguardar YouTube API carregar
        if (window.YT && window.YT.Player) {
            this.init();
        } else {
            window.onYouTubeIframeAPIReady = () => this.init();
        }
    }
    
    init() {
        console.log('🎵 Inicializando YouTube IFrame Player...');
        
        this.player = new YT.Player('youtubePlayer', {
            height: '0',
            width: '0',
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'fs': 0,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0,
                'showinfo': 0,
                'iv_load_policy': 3,
                'cc_load_policy': 0,
                'origin': window.location.origin
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event),
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onError': (event) => this.onPlayerError(event)
            }
        });
    }
    
    onPlayerReady(event) {
        console.log('✅ YouTube Player pronto!');
        this.isReady = true;
        if (this.onReadyCallback) {
            this.onReadyCallback(event);
        }
    }
    
    onPlayerStateChange(event) {
        const states = {
            [-1]: 'unstarted',
            [0]: 'ended',
            [1]: 'playing',
            [2]: 'paused',
            [3]: 'buffering',
            [5]: 'cued'
        };
        
        const state = states[event.data] || 'unknown';
        console.log(`🎵 Player estado: ${state}`);
        
        if (this.onStateChangeCallback) {
            this.onStateChangeCallback(event.data, state);
        }
    }
    
    onPlayerError(event) {
        const errors = {
            2: 'Parâmetros inválidos',
            5: 'Erro de reprodução HTML5',
            100: 'Vídeo não encontrado ou privado',
            101: 'Vídeo não pode ser reproduzido em modo embarcado',
            150: 'Vídeo não pode ser reproduzido em modo embarcado'
        };
        
        const errorMsg = errors[event.data] || 'Erro desconhecido';
        console.error(`❌ YouTube Player erro: ${errorMsg}`, event.data);
        
        if (this.onErrorCallback) {
            this.onErrorCallback(event.data, errorMsg);
        }
    }
    
    // ============================================
    // CONTROLES PÚBLICOS
    // ============================================
    
    loadVideo(videoId) {
        if (!this.isReady) {
            console.warn('⏳ Player ainda não está pronto');
            return false;
        }
        
        this.currentVideoId = videoId;
        this.player.loadVideoById(videoId);
        return true;
    }
    
    play() {
        if (this.isReady && this.player) {
            this.player.playVideo();
        }
    }
    
    pause() {
        if (this.isReady && this.player) {
            this.player.pauseVideo();
        }
    }
    
    stop() {
        if (this.isReady && this.player) {
            this.player.stopVideo();
        }
    }
    
    seekTo(seconds) {
        if (this.isReady && this.player) {
            this.player.seekTo(seconds, true);
        }
    }
    
    setVolume(volume) {
        // volume: 0-100
        if (this.isReady && this.player) {
            this.player.setVolume(volume);
        }
    }
    
    mute() {
        if (this.isReady && this.player) {
            this.player.mute();
        }
    }
    
    unmute() {
        if (this.isReady && this.player) {
            this.player.unMute();
        }
    }
    
    // ============================================
    // GETTERS
    // ============================================
    
    getCurrentTime() {
        if (this.isReady && this.player) {
            return this.player.getCurrentTime() || 0;
        }
        return 0;
    }
    
    getDuration() {
        if (this.isReady && this.player) {
            return this.player.getDuration() || 0;
        }
        return 0;
    }
    
    getVolume() {
        if (this.isReady && this.player) {
            return this.player.getVolume() || 50;
        }
        return 50;
    }
    
    isMuted() {
        if (this.isReady && this.player) {
            return this.player.isMuted();
        }
        return false;
    }
    
    getPlayerState() {
        if (this.isReady && this.player) {
            return this.player.getPlayerState();
        }
        return -1;
    }
    
    isPlaying() {
        return this.getPlayerState() === 1; // YT.PlayerState.PLAYING
    }
    
    isPaused() {
        return this.getPlayerState() === 2; // YT.PlayerState.PAUSED
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    onReady(callback) {
        this.onReadyCallback = callback;
        // Se já estiver pronto, chama imediatamente
        if (this.isReady) {
            callback();
        }
    }
    
    onStateChange(callback) {
        this.onStateChangeCallback = callback;
    }
    
    onError(callback) {
        this.onErrorCallback = callback;
    }
}

export default YouTubePlayer;

