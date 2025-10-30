/* ====================================
   MUSIC PLAYER - Controle de reprodução de áudio
   ==================================== */

import { formatTime } from './utils/time.js';
import * as Storage from './storage.js';
import { $ } from './utils/dom.js';
import AudioVisualizer from './visualizer.js';
import YouTubePlayer from './youtube-player.js';

// Performance helper: throttle using RequestAnimationFrame
function rafThrottle(callback) {
    let rafId = null;
    return function(...args) {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            callback.apply(this, args);
            rafId = null;
        });
    };
}

class MusicPlayer {
    constructor() {
        // YouTube Player (método primário)
        this.ytPlayer = new YouTubePlayer();
        this.updateInterval = null; // Para atualizar progresso manualmente
        
        // 🚀 FALLBACK: HTML5 Audio para vídeos com erro 150
        this.fallbackAudio = new Audio();
        this.usingFallback = false;
        
        this.currentTrack = null;
        this.queue = [];
        this.currentIndex = 0;
        this.repeatMode = 'off'; // 'off', 'all', 'one'
        this.shuffle = false;
        this.volume = 100;
        this.isPlaying = false;
        
        // Prefetch de stream direto
        this._prefetch = { videoId: null, promise: null, url: null };
        
        // Initialize from storage
        this.loadState();
        
        // Initialize visualizer (desabilitado por enquanto - precisa adaptar para YouTube)
        // this.visualizer = new AudioVisualizer(this);
        
        // Setup YouTube Player callbacks
        this.setupYouTubeCallbacks();
        
        // Setup Fallback Audio callbacks
        this.setupFallbackAudio();
        
        // Bind methods
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        this.togglePlay = this.togglePlay.bind(this);
        this.next = this.next.bind(this);
        this.previous = this.previous.bind(this);
        this.seek = this.seek.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.toggleMute = this.toggleMute.bind(this);
        this.toggleRepeat = this.toggleRepeat.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        
        // Setup event listeners
        this.setupUIControls();
        this.setupFullscreenControls();
    }
    
    setupYouTubeCallbacks() {
        // Callback quando player estiver pronto
        this.ytPlayer.onReady(() => {
            console.log('✅ YouTube Player pronto e conectado ao MusicPlayer!');
            this.ytPlayer.setVolume(this.volume);
            
            // Iniciar intervalo para atualizar progresso (YouTube não tem timeupdate)
            this.startProgressUpdater();
        });
        
        // Callback para mudanças de estado
        this.ytPlayer.onStateChange((state, stateName) => {
            console.log(`🎵 Estado mudou: ${stateName}`);
            
            if (state === 1) { // Playing
                this.isPlaying = true;
                this.updatePlayPauseButton();
                
                // Debug: Mostrar duração quando começar a tocar
                const dur = this.ytPlayer.getDuration();
                console.log(`⏱️ Duração do vídeo: ${dur} segundos`);
            } else if (state === 2) { // Paused
                this.isPlaying = false;
                this.updatePlayPauseButton();
            } else if (state === 0) { // Ended
                this.handleTrackEnded();
            }
        });
        
        // Callback para erros
        this.ytPlayer.onError(async (errorCode, errorMsg) => {
            console.error(`❌ YouTube Player erro: ${errorMsg}`);
            
            // 🚀 ERRO 150/101: Vídeo bloqueado para embed → USAR FALLBACK AUDIO
            if (errorCode === 150 || errorCode === 101) {
                const videoId = this.currentTrack?.videoId || this.currentTrack?.id;
                
                if (videoId) {
                    console.log(`🔄 Vídeo bloqueado. Tentando fallback com stream direto...`);
                    this.showToast(' Aguarde por favor...', 'info');
                    // Usar prefetch se já disponível
                    if (this._prefetch.videoId === videoId && this._prefetch.url) {
                        await this.loadDirectStream(videoId, this._prefetch.url);
                        return;
                    }
                    // Se estiver em andamento, aguardar
                    if (this._prefetch.videoId === videoId && this._prefetch.promise) {
                        try {
                            const url = await this._prefetch.promise;
                            await this.loadDirectStream(videoId, url);
                            return;
                        } catch (e) {
                            // fallback para fetch direto
                        }
                    }
                    // fallback padrão
                    await this.loadDirectStream(videoId);
                    return; // NÃO pular para próxima
                }
            }
            
            // Outros erros: pular para próxima música
            this.next();
        });
    }
    
    // Prefetch do stream direto para acelerar fallback
    _startPrefetch(videoId) {
        if (!videoId) return;
        if (this._prefetch.videoId === videoId && (this._prefetch.url || this._prefetch.promise)) {
            return; // já está pronto/em andamento
        }
        this._prefetch = { videoId, promise: null, url: null };
        this._prefetch.promise = (async () => {
            try {
                const resp = await fetch(`http://localhost:5000/api/stream/${videoId}`);
                const data = await resp.json();
                if (data?.streamUrl) {
                    this._prefetch.url = data.streamUrl;
                    return data.streamUrl;
                }
                throw new Error('Stream URL não encontrado');
            } catch (e) {
                // Não quebrar fluxo por falha de prefetch
                console.warn('Prefetch stream falhou:', e.message || e);
                throw e;
            }
        })();
    }
    
    setupFallbackAudio() {
        // Eventos do HTML5 Audio (fallback)
        this.fallbackAudio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
        });
        
        this.fallbackAudio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        });
        
        this.fallbackAudio.addEventListener('ended', () => {
            this.handleTrackEnded();
        });
        
        this.fallbackAudio.addEventListener('timeupdate', () => {
            if (this.usingFallback) {
                this.updateProgress();
            }
        });
        
        this.fallbackAudio.addEventListener('error', (e) => {
            // Ignorar erros se não está usando fallback (src vazio)
            if (!this.usingFallback || !this.fallbackAudio.src) return;
            
            console.error('❌ Fallback Audio erro:', e);
            this.showToast(' Não foi possível tocar esta música. Pulando...', 'error');
            this.next();
        });
    }
    
    async loadDirectStream(videoId, prefetchedUrl) {
        try {
            // Parar YouTube Player
            if (this.ytPlayer.isPlaying()) {
                this.ytPlayer.pause();
            }
            
            // Usar URL já prefetechada ou buscar
            let streamUrl = prefetchedUrl;
            if (!streamUrl) {
                const response = await fetch(`http://localhost:5000/api/stream/${videoId}`);
                const data = await response.json();
                if (!data.streamUrl) throw new Error('Stream URL não encontrado');
                streamUrl = data.streamUrl;
            }
            
            console.log('✅ Stream direto obtido:', streamUrl.substring(0, 50) + '...');
            
            // Carregar no HTML5 Audio
            this.fallbackAudio.src = streamUrl;
            this.fallbackAudio.volume = this.volume / 100;
            this.usingFallback = true;
            
            // Esconder YouTube Player, mostrar fallback indicator
            const ytContainer = document.getElementById('youtubePlayerContainer');
            if (ytContainer) {
                ytContainer.style.display = 'none';
            }
            
            // Play
            await this.fallbackAudio.play();
            this.showToast(' Obrigado por aguardar!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao carregar stream direto:', error);
            this.showToast(' Não foi possível tocar esta música. Pulando...', 'error');
            this.next();
        }
    }
    
    startProgressUpdater() {
        // Parar intervalo anterior se existir
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        console.log('🔄 Iniciando intervalo de atualização de progresso...');
        
        // Atualizar progresso a cada 100ms
        this.updateInterval = setInterval(() => {
            // Atualizar sempre (YouTube ou Fallback)
            if (this.usingFallback) {
                if (this.fallbackAudio.currentTime > 0 && !this.fallbackAudio.paused) {
                    this.updateProgress();
                }
            } else {
                // Sempre atualizar quando YouTube Player está pronto
                if (this.ytPlayer && this.ytPlayer.isReady && this.currentTrack) {
                    this.updateProgress();
                }
            }
        }, 100);
    }
    
    loadState() {
        this.volume = Storage.getVolume();
        this.repeatMode = Storage.getRepeatMode();
        this.shuffle = Storage.getShuffle();
        this.queue = Storage.getQueue();
    }
    
    setupEventListeners() {
        // Método vazio agora - eventos são tratados no setupYouTubeCallbacks
    }
    
    setupUIControls() {
        // Play/Pause
        const btnPlayPause = $('#btnPlayPause');
        if (btnPlayPause) {
            btnPlayPause.addEventListener('click', this.togglePlay);
        }
        
        // Next/Previous
        const btnNext = $('#btnNext');
        const btnPrevious = $('#btnPrevious');
        if (btnNext) btnNext.addEventListener('click', this.next);
        if (btnPrevious) btnPrevious.addEventListener('click', this.previous);
        
        // Repeat
        const btnRepeat = $('#btnRepeat');
        if (btnRepeat) {
            btnRepeat.addEventListener('click', this.toggleRepeat);
            this.updateRepeatButton();
        }
        
        // Shuffle
        const btnShuffle = $('#btnShuffle');
        if (btnShuffle) {
            btnShuffle.addEventListener('click', this.toggleShuffle);
            this.updateShuffleButton();
        }
        
        // Volume
        const btnVolume = $('#btnVolume');
        const volumeBar = $('#volumeBar');
        if (btnVolume) {
            btnVolume.addEventListener('click', this.toggleMute);
        }
        if (volumeBar) {
            volumeBar.addEventListener('click', (e) => {
                const rect = volumeBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.setVolume(Math.round(percent * 100));
            });
        }
        
        // Progress bar
        const progressBarBg = $('#progressBarBg');
        if (progressBarBg) {
            progressBarBg.addEventListener('click', (e) => {
                const rect = progressBarBg.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const duration = this.ytPlayer.getDuration();
                this.seek(percent * duration);
            });
        }
        
        // Like button
        const btnLikePlayer = $('#btnLikePlayer');
        if (btnLikePlayer) {
            btnLikePlayer.addEventListener('click', () => {
                if (this.currentTrack) {
                    const liked = Storage.toggleLikeTrack(this.currentTrack.id);
                    this.updateLikeButton();
                    
                    // Dispatch event
                    window.dispatchEvent(new CustomEvent('trackliked', {
                        detail: { trackId: this.currentTrack.id, liked }
                    }));
                }
            });
        }
    }
    
    async loadTrack(videoIdOrTrack) {
        if (!videoIdOrTrack) return false;
        
        // 🔄 RESETAR FALLBACK (tentar YouTube IFrame primeiro)
        this.usingFallback = false;
        this.fallbackAudio.pause();
        this.fallbackAudio.src = '';
        
        // Mostrar YouTube Player container novamente
        const ytContainer = document.getElementById('youtubePlayerContainer');
        if (ytContainer) {
            ytContainer.style.display = 'block';
        }
        
        // 🚀 ACEITA TANTO videoId (string) QUANTO objeto track completo
        let track;
        let videoId;
        
        if (typeof videoIdOrTrack === 'string') {
            // Recebeu videoId - BUSCAR DADOS COMPLETOS DO BACKEND
            videoId = videoIdOrTrack;
            
            // Prefetch do stream direto em paralelo
            this._startPrefetch(videoId);
            
            // Criar objeto temporário enquanto carrega
            this.currentTrack = {
                id: videoId,
                videoId: videoId,
                title: 'Carregando...',
                artist: '',
                artistName: '',
                image: 'assets/images/covers/placeholder.svg',
                duration: 0
            };
            
            // Atualizar UI com placeholder
            this.updateUI();
            
            console.log(`📺 Carregando música pelo videoId: ${videoId}`);
            
            // Buscar dados completos do backend (async)
            try {
                const response = await fetch(`http://localhost:5000/api/song/${videoId}`);
                const songData = await response.json();
                
                // Converter duração se vier como string "3:45"
                let duration = songData.duration || songData.duration_seconds || 0;
                if (typeof duration === 'string') {
                    const parts = duration.split(':').map(Number);
                    if (parts.length === 2) {
                        duration = parts[0] * 60 + parts[1]; // MM:SS
                    } else if (parts.length === 3) {
                        duration = parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
                    }
                }
                
                // Criar objeto track completo com dados do backend
                track = {
                    id: videoId,
                    videoId: videoId,
                    title: songData.title || 'Música Desconhecida',
                    artist: songData.artists?.[0]?.name || 'Artista Desconhecido',
                    artistName: songData.artists?.[0]?.name || 'Artista Desconhecido',
                    artistId: songData.artists?.[0]?.id,
                    image: this.getBestThumbnail(songData.thumbnails),
                    duration: duration,
                    album: songData.album?.name,
                    albumId: songData.album?.id
                };
                
                console.log(`✅ Dados da música carregados:`, track);
            } catch (error) {
                console.error(`❌ Erro ao buscar dados da música:`, error);
                // Manter placeholder se falhar
                track = this.currentTrack;
            }
        } else {
            // Recebeu objeto track completo do backend
            track = videoIdOrTrack;
            videoId = track.videoId || track.id;
            
            // Prefetch do stream direto em paralelo
            this._startPrefetch(videoId);
            
            console.log(`📺 Carregando música com dados: ${track.title}`);
        }
        
        this.currentTrack = track;
        
        // Load video no YouTube Player
        if (this.ytPlayer.isReady) {
            this.ytPlayer.loadVideo(videoId);
        } else {
            // Se player ainda não está pronto, aguardar
            this.ytPlayer.onReady(() => {
                this.ytPlayer.loadVideo(videoId);
            });
        }
        
        // Update UI com dados completos
        this.updateUI();
        this.updateLikeButton();
        
        // Add to recent
        Storage.addToRecentTracks(videoId);
        Storage.setCurrentTrack(videoId);
        
        return true;
    }
    
    getBestThumbnail(thumbnails) {
        if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
            return 'assets/images/covers/placeholder.svg';
        }
        
        // Pegar a última (melhor qualidade)
        const index = thumbnails.length - 1;
        const bestThumb = thumbnails[index];
        let url = bestThumb?.url || bestThumb;
        
        if (!url || url === 'assets/images/covers/placeholder.svg') {
            return 'assets/images/covers/placeholder.svg';
        }
        
        // Otimizar para 250x250
        url = url.replace(/=w\d+-h\d+/g, '=w250-h250');
        
        return url;
    }
    
    playTrack(trackId, queueTracks = []) {
        // Load track
        if (!this.loadTrack(trackId)) return;
        
        // Set queue
        if (queueTracks.length > 0) {
            this.queue = queueTracks;
            this.currentIndex = this.queue.indexOf(trackId);
            if (this.currentIndex === -1) {
                this.queue.unshift(trackId);
                this.currentIndex = 0;
            }
            Storage.setQueue(this.queue);
        }
        
        // Play
        this.play();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('trackchange', {
            detail: { track: this.currentTrack }
        }));
    }
    
    play() {
        if (this.usingFallback) {
            this.fallbackAudio.play();
        } else if (this.ytPlayer && this.currentTrack) {
            this.ytPlayer.play();
        }
    }
    
    pause() {
        if (this.usingFallback) {
            this.fallbackAudio.pause();
        } else if (this.ytPlayer) {
            this.ytPlayer.pause();
        }
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    next() {
        if (this.queue.length === 0) return;
        
        if (this.shuffle) {
            // Random next (excluding current)
            const availableIndices = this.queue
                .map((_, i) => i)
                .filter(i => i !== this.currentIndex);
            if (availableIndices.length > 0) {
                this.currentIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            }
        } else {
            this.currentIndex++;
            if (this.currentIndex >= this.queue.length) {
                if (this.repeatMode === 'all') {
                    this.currentIndex = 0;
                } else {
                    this.currentIndex = this.queue.length - 1;
                    this.pause();
                    return;
                }
            }
        }
        
        const nextTrackId = this.queue[this.currentIndex];
        this.playTrack(nextTrackId, this.queue);
    }
    
    previous() {
        // If more than 3 seconds played, restart current track
        if (this.audio && this.audio.currentTime > 3) {
            this.seek(0);
            return;
        }
        
        if (this.queue.length === 0) return;
        
        this.currentIndex--;
        if (this.currentIndex < 0) {
            if (this.repeatMode === 'all') {
                this.currentIndex = this.queue.length - 1;
            } else {
                this.currentIndex = 0;
                this.seek(0);
                return;
            }
        }
        
        const prevTrackId = this.queue[this.currentIndex];
        this.playTrack(prevTrackId, this.queue);
    }
    
    seek(time) {
        if (this.usingFallback) {
            this.fallbackAudio.currentTime = Math.max(0, Math.min(time, this.fallbackAudio.duration || 0));
        } else if (this.ytPlayer && this.ytPlayer.isReady) {
            const duration = this.ytPlayer.getDuration();
            const seekTime = Math.max(0, Math.min(time, duration));
            this.ytPlayer.seekTo(seekTime);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        
        if (this.usingFallback) {
            this.fallbackAudio.volume = this.volume / 100;
        } else if (this.ytPlayer && this.ytPlayer.isReady) {
            this.ytPlayer.setVolume(this.volume);
        }
        
        Storage.setVolume(this.volume);
        this.updateVolumeUI();
    }
    
    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 100);
        }
    }
    
    toggleRepeat() {
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        Storage.setRepeatMode(this.repeatMode);
        this.updateRepeatButton();
    }
    
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        Storage.setShuffle(this.shuffle);
        this.updateShuffleButton();
    }
    
    handleTrackEnded() {
        if (this.repeatMode === 'one') {
            this.seek(0);
            this.play();
        } else {
            this.next();
        }
    }
    
    updateUI() {
        if (!this.currentTrack) return;
        
        // Update track info
        const trackImage = $('#playerTrackImage');
        const trackName = $('#playerTrackName');
        const trackArtist = $('#playerTrackArtist');
        
        if (trackImage) trackImage.src = this.currentTrack.image;
        if (trackName) {
            trackName.textContent = this.currentTrack.title;
            trackName.style.cursor = 'pointer';
            trackName.onclick = () => {
                window.location.hash = `#/album/${this.currentTrack.albumId}`;
            };
        }
        if (trackArtist) {
            trackArtist.textContent = this.currentTrack.artistName;
            trackArtist.style.cursor = 'pointer';
            trackArtist.onclick = () => {
                window.location.hash = `#/artist/${this.currentTrack.artistId}`;
            };
        }
        
        // Update document title
        document.title = `${this.currentTrack.title} • ${this.currentTrack.artistName} - SoundPulse`;
        
        // Update fullscreen if active
        const fullscreenPlayer = $('#fullscreenPlayer');
        if (fullscreenPlayer && fullscreenPlayer.classList.contains('active')) {
            this.updateFullscreenContent();
        }
    }
    
    updateProgress() {
        let currentTime, duration;
        
        if (this.usingFallback) {
            currentTime = this.fallbackAudio.currentTime || 0;
            duration = this.fallbackAudio.duration || 0;
        } else {
            if (!this.ytPlayer || !this.ytPlayer.isReady) return;
            currentTime = this.ytPlayer.getCurrentTime() || 0;
            duration = this.ytPlayer.getDuration() || 0;
        }
        
        // Debug: Ver valores a cada 5 segundos
        if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) > 0) {
            console.log(`⏱️ Progresso: ${Math.floor(currentTime)}s / ${Math.floor(duration)}s`);
        }
        
        const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
        
        // Update time (CURRENT + TOTAL)
        const timeCurrent = $('#timeCurrentPlayer');
        const timeTotal = $('#timeTotalPlayer');
        
        if (timeCurrent) {
            timeCurrent.textContent = formatTime(currentTime);
        }
        if (timeTotal) {
            timeTotal.textContent = formatTime(duration);
        }
        
        // Update progress bar
        const progressFill = $('#progressBarFill');
        const progressHandle = $('#progressBarHandle');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressHandle) {
            progressHandle.style.left = `${percent}%`;
        }
        
        // Update fullscreen progress
        const fullscreenProgressFill = $('#fullscreenProgressFill');
        const fullscreenProgressHandle = $('#fullscreenProgressHandle');
        const fullscreenTimeCurrent = $('#fullscreenTimeCurrent');
        const fullscreenTimeTotal = $('#fullscreenTimeTotal');
        
        if (fullscreenProgressFill) {
            fullscreenProgressFill.style.width = `${percent}%`;
        }
        if (fullscreenProgressHandle) {
            fullscreenProgressHandle.style.left = `${percent}%`;
        }
        if (fullscreenTimeCurrent) {
            fullscreenTimeCurrent.textContent = formatTime(currentTime);
        }
        if (fullscreenTimeTotal) {
            fullscreenTimeTotal.textContent = formatTime(duration);
        }
    }
    
    updatePlayPauseButton() {
        const btnPlayPause = $('#btnPlayPause');
        const iconPlay = btnPlayPause?.querySelector('.icon-play');
        const iconPause = btnPlayPause?.querySelector('.icon-pause');
        
        if (this.isPlaying) {
            if (iconPlay) iconPlay.style.display = 'none';
            if (iconPause) iconPause.style.display = 'block';
        } else {
            if (iconPlay) iconPlay.style.display = 'block';
            if (iconPause) iconPause.style.display = 'none';
        }
    }
    
    updateLikeButton() {
        const btnLike = $('#btnLikePlayer');
        if (btnLike && this.currentTrack) {
            const liked = Storage.isTrackLiked(this.currentTrack.id);
            if (liked) {
                btnLike.classList.add('liked');
            } else {
                btnLike.classList.remove('liked');
            }
        }
    }
    
    updateRepeatButton() {
        const btnRepeat = $('#btnRepeat');
        if (btnRepeat) {
            btnRepeat.classList.toggle('active', this.repeatMode !== 'off');
            btnRepeat.setAttribute('aria-label', `Repetir: ${this.repeatMode}`);
        }
    }
    
    updateShuffleButton() {
        const btnShuffle = $('#btnShuffle');
        if (btnShuffle) {
            btnShuffle.classList.toggle('active', this.shuffle);
        }
    }
    
    updateVolumeUI() {
        const volumeFill = $('#volumeFill');
        const btnVolume = $('#btnVolume');
        const iconVolume = btnVolume?.querySelector('.icon-volume');
        const iconMute = btnVolume?.querySelector('.icon-mute');
        
        if (volumeFill) {
            volumeFill.style.width = `${this.volume}%`;
        }
        
        if (this.volume === 0) {
            if (iconVolume) iconVolume.style.display = 'none';
            if (iconMute) iconMute.style.display = 'block';
        } else {
            if (iconVolume) iconVolume.style.display = 'block';
            if (iconMute) iconMute.style.display = 'none';
        }
    }
    
    getCurrentTrack() {
        return this.currentTrack;
    }
    
    getQueue() {
        return this.queue;
    }
    
    isCurrentlyPlaying(trackId) {
        return this.currentTrack && this.currentTrack.id === trackId && this.isPlaying;
    }
    
    // ============ FULLSCREEN PLAYER ============
    
    setupFullscreenControls() {
        const btnFullscreen = $('#btnFullscreen');
        const btnCloseFullscreen = $('#btnCloseFullscreen');
        const fullscreenPlayer = $('#fullscreenPlayer');
        
        if (!btnFullscreen || !fullscreenPlayer) return;
        
        // Open fullscreen
        btnFullscreen.addEventListener('click', () => {
            this.openFullscreen();
        });
        
        // Close fullscreen
        if (btnCloseFullscreen) {
            btnCloseFullscreen.addEventListener('click', () => {
                this.closeFullscreen();
            });
        }
        
        // ESC key closes fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenPlayer.classList.contains('active')) {
                this.closeFullscreen();
            }
        });
        
        // Fullscreen controls (sync with main player)
        const btnFullscreenPlay = $('#btnFullscreenPlay');
        const btnFullscreenNext = $('#btnFullscreenNext');
        const btnFullscreenPrevious = $('#btnFullscreenPrevious');
        const btnFullscreenShuffle = $('#btnFullscreenShuffle');
        const btnFullscreenRepeat = $('#btnFullscreenRepeat');
        
        if (btnFullscreenPlay) {
            btnFullscreenPlay.addEventListener('click', () => this.togglePlay());
        }
        if (btnFullscreenNext) {
            btnFullscreenNext.addEventListener('click', () => this.next());
        }
        if (btnFullscreenPrevious) {
            btnFullscreenPrevious.addEventListener('click', () => this.previous());
        }
        if (btnFullscreenShuffle) {
            btnFullscreenShuffle.addEventListener('click', () => this.toggleShuffle());
        }
        if (btnFullscreenRepeat) {
            btnFullscreenRepeat.addEventListener('click', () => this.toggleRepeat());
        }
        
        // Progress bar
        const fullscreenProgressBar = $('#fullscreenProgressBar');
        if (fullscreenProgressBar) {
            fullscreenProgressBar.addEventListener('click', (e) => {
                const rect = fullscreenProgressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                this.seek(percent * 100);
            });
        }
    }
    
    openFullscreen() {
        const fullscreenPlayer = $('#fullscreenPlayer');
        if (!fullscreenPlayer) return;
        
        // Show fullscreen
        fullscreenPlayer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update fullscreen content
        this.updateFullscreenContent();
        
        // Extract and apply background color
        if (this.currentTrack) {
            this.applyBlurBackground(this.currentTrack.image);
        }
        
        // Start lyrics sync if available
        this.syncLyrics();
    }
    
    closeFullscreen() {
        const fullscreenPlayer = $('#fullscreenPlayer');
        if (!fullscreenPlayer) return;
        
        fullscreenPlayer.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    updateFullscreenContent() {
        if (!this.currentTrack) return;
        
        // Update artwork
        const fullscreenArtwork = $('#fullscreenArtwork');
        if (fullscreenArtwork) {
            fullscreenArtwork.src = this.currentTrack.image;
            fullscreenArtwork.alt = this.currentTrack.title;
        }
        
        // Update track info
        const fullscreenTrackTitle = $('#fullscreenTrackTitle');
        const fullscreenTrackArtist = $('#fullscreenTrackArtist');
        if (fullscreenTrackTitle) fullscreenTrackTitle.textContent = this.currentTrack.title;
        if (fullscreenTrackArtist) fullscreenTrackArtist.textContent = this.currentTrack.artist;
        
        // Update play/pause button
        const btnFullscreenPlay = $('#btnFullscreenPlay');
        if (btnFullscreenPlay) {
            const iconPlay = btnFullscreenPlay.querySelector('.icon-play');
            const iconPause = btnFullscreenPlay.querySelector('.icon-pause');
            if (this.isPlaying) {
                if (iconPlay) iconPlay.style.display = 'none';
                if (iconPause) iconPause.style.display = 'block';
            } else {
                if (iconPlay) iconPlay.style.display = 'block';
                if (iconPause) iconPause.style.display = 'none';
            }
        }
    }
    
    applyBlurBackground(imageUrl) {
        const fullscreenBackground = $('#fullscreenBackground');
        if (!fullscreenBackground) return;
        
        // Simple approach: use image as background
        fullscreenBackground.style.backgroundImage = `url(${imageUrl})`;
        
        // Advanced: extract dominant color (requires canvas)
        this.extractColorFromImage(imageUrl, (color) => {
            fullscreenBackground.style.background = `
                linear-gradient(
                    135deg,
                    ${color} 0%,
                    rgba(0, 0, 0, 0.8) 100%
                )
            `;
        });
    }
    
    extractColorFromImage(imageUrl, callback) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get pixel data from center of image
                const centerX = Math.floor(img.width / 2);
                const centerY = Math.floor(img.height / 2);
                const imageData = ctx.getImageData(centerX, centerY, 1, 1);
                const pixel = imageData.data;
                
                // Create RGB color
                const color = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, 0.4)`;
                callback(color);
            } catch (e) {
                // CORS error or other issue - use fallback
                callback('rgba(30, 215, 96, 0.3)'); // Primary color
            }
        };
        
        img.onerror = () => {
            callback('rgba(30, 215, 96, 0.3)'); // Fallback
        };
    }
    
    syncLyrics() {
        const fullscreenLyrics = $('#fullscreenLyrics');
        if (!fullscreenLyrics || !this.currentTrack) return;
        
        // Import lyrics from data.js
        import('./data.js').then(module => {
            const lyrics = module.lyrics[this.currentTrack.id];
            if (!lyrics) {
                fullscreenLyrics.innerHTML = '<p class="lyrics-line">Letras não disponíveis</p>';
                return;
            }
            
            // Render lyrics lines
            fullscreenLyrics.innerHTML = lyrics.lines.map((line, index) => 
                `<p class="lyrics-line" data-time="${line.time}" data-index="${index}">${line.text}</p>`
            ).join('');
            
            // Sync lyrics with audio time
            if (this.audio) {
                const updateActiveLyric = () => {
                    const currentTime = this.audio.currentTime;
                    const lines = fullscreenLyrics.querySelectorAll('.lyrics-line');
                    
                    lines.forEach(line => {
                        const lineTime = parseFloat(line.dataset.time);
                        const lineIndex = parseInt(line.dataset.index);
                        const nextLine = lines[lineIndex + 1];
                        const nextTime = nextLine ? parseFloat(nextLine.dataset.time) : Infinity;
                        
                        if (currentTime >= lineTime && currentTime < nextTime) {
                            line.classList.add('active');
                            // Auto-scroll to active line
                            line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            line.classList.remove('active');
                        }
                    });
                };
                
                // Update lyrics on time update
                this.audio.addEventListener('timeupdate', updateActiveLyric);
            }
        });
    }
    
    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Ícones para cada tipo
        const icons = {
            success: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
            error: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
            warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
            info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
        };
        
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                ${icons[type] || icons.info}
            </svg>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remover toast após 5 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Create singleton instance
const player = new MusicPlayer();

// Export
export default player;
export { player };

