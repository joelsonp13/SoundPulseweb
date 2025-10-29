/* ====================================
   APP CORE ENTRY - Bundle mínimo para inicialização
   ==================================== */

// Core modules
import router from './router.js';
import * as Storage from './storage.js';
import { $, showToast } from './utils/dom.js';
import { cleanupMockData } from './utils/cleanup.js';

// Performance utilities
import { enableLazyLoading, preloadPriorityImages } from './utils/performance.js';

// Lazy load views
const loadView = (viewName) => {
    return import(`./views/${viewName}.min.js`);
};

// Lazy load player
let playerModule = null;
const getPlayer = async () => {
    if (!playerModule) {
        playerModule = await import('./player.min.js');
    }
    return playerModule.default || playerModule.player;
};

// Lazy load API
let apiModule = null;
const getAPI = async () => {
    if (!apiModule) {
        apiModule = await import('./utils/api.min.js');
    }
    return apiModule.default || apiModule.api;
};

class App {
    constructor() {
        this.init();
    }
    
    async init() {
        console.log('🎵 SoundPulse - Initializing...');
        
        // Register Service Worker
        this.registerServiceWorker();
        
        // Check backend health (lazy)
        setTimeout(() => this.checkBackendHealth(), 1000);
        
        // Cleanup mock data
        cleanupMockData();
        
        // Initialize storage
        Storage.initializeStorage();
        console.log('✓ Storage initialized');
        
        // Setup UI
        this.setupNavigationControls();
        this.setupThemeToggle();
        this.setupUserMenu();
        this.setupSidebar();
        
        // Register routes with lazy loading
        this.registerRoutes();
        
        // Start router
        router.start();
        console.log('✓ Router started');
        
        // Load sidebar playlists
        this.loadSidebarPlaylists();
        
        // Enable lazy loading for images
        enableLazyLoading();
        
        console.log('🎉 SoundPulse ready!');
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => {
                        console.log('✅ Service Worker registered');
                        
                        // Check for updates
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    showToast('Nova versão disponível! Recarregue a página.', 'info');
                                }
                            });
                        });
                    })
                    .catch(err => console.error('❌ SW registration failed:', err));
            });
        }
    }
    
    async checkBackendHealth() {
        try {
            const api = await getAPI();
            const isHealthy = await api.checkHealth();
            if (isHealthy) {
                console.log('✅ Backend conectado');
            } else {
                console.warn('⚠️ Backend offline');
                showToast('⚠️ Backend offline', 'warning');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar backend:', error);
        }
    }
    
    registerRoutes() {
        // Lazy load views
        router.register('/home', async () => {
            const { initHomeView } = await loadView('home');
            initHomeView();
        });
        
        router.register('/search', async () => {
            const { initSearchView } = await loadView('search');
            initSearchView();
        });
        
        router.register('/library', async () => {
            const { initLibraryView } = await loadView('library');
            initLibraryView();
        });
        
        router.register('/browse', async () => {
            const { initBrowseView } = await loadView('browse');
            initBrowseView();
        });
        
        router.register('/radio', async () => {
            const { initRadioView } = await loadView('radio');
            initRadioView();
        });
        
        router.register('/podcasts', async () => {
            const { initPodcastsView } = await loadView('podcasts');
            initPodcastsView();
        });
        
        router.register('/artist/:id', async (params) => {
            const { initArtistView } = await loadView('artist');
            initArtistView(params.id);
        });
        
        router.register('/album/:id', async (params) => {
            const { initAlbumView } = await loadView('album');
            initAlbumView(params.id);
        });
        
        router.register('/playlist/:id', async (params) => {
            const { initPlaylistView } = await loadView('playlist');
            initPlaylistView(params.id);
        });
        
        router.register('/profile', async () => {
            const { initProfileView } = await loadView('profile');
            initProfileView();
        });
        
        router.register('/settings', async () => {
            const { initSettingsView } = await loadView('settings');
            initSettingsView();
        });
        
        router.register('/premium', async () => {
            const { initPremiumView } = await loadView('premium');
            initPremiumView();
        });
        
        router.register('/events', () => {
            this.renderSimpleView('Eventos', 'Em breve...');
        });
    }
    
    setupNavigationControls() {
        const btnBack = $('#btnBack');
        const btnForward = $('#btnForward');
        
        if (btnBack) {
            btnBack.addEventListener('click', () => router.back());
        }
        
        if (btnForward) {
            btnForward.addEventListener('click', () => router.forward());
        }
        
        window.addEventListener('routechange', () => {
            if (btnBack) btnBack.disabled = !router.canGoBack();
            if (btnForward) btnForward.disabled = !router.canGoForward();
        });
    }
    
    setupThemeToggle() {
        const btnTheme = $('#btnTheme');
        if (!btnTheme) return;
        
        btnTheme.addEventListener('click', () => {
            const currentTheme = Storage.getTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            Storage.setTheme(newTheme);
            
            const iconSun = btnTheme.querySelector('.icon-sun');
            const iconMoon = btnTheme.querySelector('.icon-moon');
            if (newTheme === 'dark') {
                if (iconSun) iconSun.style.display = 'block';
                if (iconMoon) iconMoon.style.display = 'none';
            } else {
                if (iconSun) iconSun.style.display = 'none';
                if (iconMoon) iconMoon.style.display = 'block';
            }
            
            showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
        });
    }
    
    setupUserMenu() {
        const btnUser = $('#btnUser');
        const userDropdown = $('#userDropdown');
        
        if (!btnUser || !userDropdown) return;
        
        btnUser.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !btnUser.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
        
        const btnLogout = $('#btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    showToast('Logout realizado', 'success');
                }
            });
        }
    }
    
    setupSidebar() {
        const sidebar = $('#sidebar');
        const sidebarOverlay = $('#sidebarOverlay');
        const btnMenuToggle = $('#btnMenuToggle');
        const btnSidebarClose = $('#btnSidebarClose');
        
        if (!sidebar || !sidebarOverlay) return;
        
        const openSidebar = () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        
        const closeSidebar = () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        if (btnMenuToggle) {
            btnMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                openSidebar();
            });
        }
        
        if (btnSidebarClose) {
            btnSidebarClose.addEventListener('click', (e) => {
                e.stopPropagation();
                closeSidebar();
            });
        }
        
        sidebarOverlay.addEventListener('click', closeSidebar);
        
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(closeSidebar, 100);
            });
        });
        
        const btnCreatePlaylist = $('.btn-create-playlist');
        if (btnCreatePlaylist) {
            btnCreatePlaylist.addEventListener('click', () => {
                this.showCreatePlaylistModal();
            });
        }
    }
    
    loadSidebarPlaylists() {
        const container = $('#sidebarPlaylists');
        if (!container) return;
        
        const playlists = Storage.getUserPlaylists();
        
        container.innerHTML = '';
        
        if (playlists.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'playlist-empty';
            empty.innerHTML = '<p style="padding: 1rem; color: var(--color-text-tertiary); font-size: 0.875rem;">Nenhuma playlist criada</p>';
            container.appendChild(empty);
            return;
        }
        
        playlists.forEach(playlist => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#/playlist/${playlist.id}`;
            a.className = 'playlist-link';
            
            const icon = document.createElement('div');
            icon.className = 'playlist-icon';
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>';
            
            const name = document.createElement('span');
            name.className = 'playlist-name';
            name.textContent = playlist.title;
            
            a.appendChild(icon);
            a.appendChild(name);
            li.appendChild(a);
            container.appendChild(li);
        });
        
        window.addEventListener('playlistcreated', () => {
            this.loadSidebarPlaylists();
        });
        
        window.addEventListener('playlistdeleted', () => {
            this.loadSidebarPlaylists();
        });
    }
    
    showCreatePlaylistModal() {
        const overlay = $('#modalOverlay');
        if (!overlay) return;
        
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Criar Playlist</h3>
                    <button class="modal-close" id="modalClose">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <input type="text" class="input" id="playlistName" placeholder="Nome da playlist" style="margin-bottom: 1rem;" />
                    <textarea class="input" id="playlistDescription" placeholder="Descrição (opcional)" rows="3" style="resize: vertical;"></textarea>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="modalCancel">Cancelar</button>
                    <button class="btn btn-primary" id="modalCreate">Criar</button>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        
        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.innerHTML = '', 300);
        };
        
        $('#modalClose').addEventListener('click', closeModal);
        $('#modalCancel').addEventListener('click', closeModal);
        
        $('#modalCreate').addEventListener('click', () => {
            const name = $('#playlistName').value.trim();
            const description = $('#playlistDescription').value.trim();
            
            if (!name) {
                showToast('Digite um nome para a playlist', 'warning');
                return;
            }
            
            const playlist = Storage.createPlaylist(name, description);
            showToast('Playlist criada com sucesso!', 'success');
            closeModal();
            
            window.dispatchEvent(new CustomEvent('playlistcreated', {
                detail: { playlist }
            }));
            
            router.navigate(`/playlist/${playlist.id}`);
        });
        
        setTimeout(() => $('#playlistName').focus(), 100);
    }
    
    renderSimpleView(title, message) {
        const container = $('#viewContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h2 class="empty-state-title">${title}</h2>
                <p class="empty-state-description">${message}</p>
            </div>
        `;
    }
}

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}

export default App;


