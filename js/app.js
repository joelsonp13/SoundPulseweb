/* ====================================
   APP MAIN - Inicialização da aplicação
   ==================================== */

import router from './router.js';
import player from './player.js';
import api from './utils/api.js';
import * as Storage from './storage.js';
import { cleanupMockData } from './utils/cleanup.js';
import { $, showToast } from './utils/dom.js';

// Import views
import { initHomeView } from './views/home.js';
import { initSearchView } from './views/search.js';
import { initLibraryView } from './views/library.js';
import { initBrowseView } from './views/browse.js';
import { initArtistView } from './views/artist.js';
import { initAlbumView } from './views/album.js';
import { initPlaylistView } from './views/playlist.js';
import { initProfileView } from './views/profile.js';
import { initSettingsView } from './views/settings.js';
import { initPremiumView } from './views/premium.js';
import { initRadioView } from './views/radio.js';
import { initPodcastsView } from './views/podcasts.js';

class App {
    constructor() {
        this.init();
    }
    
    async init() {
        console.log('🎵 SoundPulse - Initializing...');
        
        // Check backend health
        await this.checkBackendHealth();
        
        // Cleanup mock data from localStorage
        cleanupMockData();
        
        // Initialize storage
        const state = Storage.initializeStorage();
        console.log('✓ Storage initialized');
        
        // Setup navigation controls
        this.setupNavigationControls();
        
        // Setup theme toggle
        this.setupThemeToggle();
        
        // Setup user menu
        this.setupUserMenu();
        
        // Setup sidebar
        this.setupSidebar();
        
        // Register routes
        this.registerRoutes();
        
        // Start router
        router.start();
        console.log('✓ Router started');
        
        // Initialize player
        console.log('✓ Player initialized');
        
        // 🚀 PERFORMANCE: Ativar lazy loading global
        setTimeout(() => {
            import('./utils/performance.js').then(perf => {
                perf.enableLazyLoading();
                console.log('✓ Lazy loading ativado');
            });
        }, 1000);
        
        // Load user playlists in sidebar
        this.loadSidebarPlaylists();
        
        console.log('🎉 SoundPulse ready!');
    }
    
    async checkBackendHealth() {
        try {
            const isHealthy = await api.checkHealth();
            if (isHealthy) {
                console.log('✅ Backend conectado: http://localhost:5000');
            } else {
                console.warn('⚠️ Backend offline! Algumas funcionalidades podem não funcionar.');
                showToast('⚠️ Backend offline. Inicie: python run_dev.py', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar backend:', error);
            showToast('❌ Erro ao conectar com backend', 'error');
        }
    }
    
    registerRoutes() {
        // Main routes
        router.register('/home', initHomeView);
        router.register('/search', initSearchView);
        router.register('/library', initLibraryView);
        router.register('/browse', initBrowseView);
        router.register('/radio', initRadioView);
        router.register('/podcasts', initPodcastsView);
        router.register('/events', () => this.renderSimpleView('Eventos', 'Em breve...'));
        
        // Performance Dashboard (métricas em tempo real)
        router.register('/performance', async () => {
            const { initPerformanceDashboard } = await import('./views/performance-dashboard.js');
            initPerformanceDashboard();
        });
        
        // Detail routes (com wrapper para extrair ID do params)
        router.register('/artist/:id', (params) => {
            console.log('🎤 Router → initArtistView com params:', params); // Debug
            initArtistView(params.id);
        });
        router.register('/album/:id', (params) => {
            console.log('💿 Router → initAlbumView com params:', params); // Debug
            initAlbumView(params.id);
        });
        router.register('/playlist/:id', (params) => {
            console.log('📝 Router → initPlaylistView com params:', params); // Debug
            initPlaylistView(params.id);
        });
        router.register('/profile', initProfileView);
        router.register('/settings', initSettingsView);
        router.register('/premium', initPremiumView);
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
        
        // Update button states on route change
        window.addEventListener('routechange', () => {
            if (btnBack) {
                btnBack.disabled = !router.canGoBack();
            }
            if (btnForward) {
                btnForward.disabled = !router.canGoForward();
            }
        });
    }
    
    setupThemeToggle() {
        const btnTheme = $('#btnTheme');
        if (!btnTheme) return;
        
        btnTheme.addEventListener('click', () => {
            const currentTheme = Storage.getTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            Storage.setTheme(newTheme);
            
            // Update icon
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
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !btnUser.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
        
        // Logout
        const btnLogout = $('#btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    showToast('Logout realizado', 'success');
                    // In a real app, would clear session and redirect
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
        
        // Function to open sidebar
        const openSidebar = () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        };
        
        // Function to close sidebar
        const closeSidebar = () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
        };
        
        // Mobile menu toggle (hamburger button)
        if (btnMenuToggle) {
            btnMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                openSidebar();
            });
        }
        
        // Sidebar close button (X button)
        if (btnSidebarClose) {
            btnSidebarClose.addEventListener('click', (e) => {
                e.stopPropagation();
                closeSidebar();
            });
        }
        
        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar();
        });
        
        // Close sidebar when clicking a nav link (mobile)
        const navLinks = sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to allow navigation
                setTimeout(closeSidebar, 100);
            });
        });
        
        // Create playlist button
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
        
        // Listen to playlist updates
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
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('playlistcreated', {
                detail: { playlist }
            }));
            
            // Navigate to playlist
            router.navigate(`/playlist/${playlist.id}`);
        });
        
        // Focus name input
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new App());
} else {
    new App();
}

export default App;

