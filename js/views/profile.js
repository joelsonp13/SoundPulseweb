/* ====================================
   PROFILE VIEW
   ==================================== */

import { getUserProfile, getUserPlaylists } from '../storage.js';
import { $, createElement } from '../utils/dom.js';

export function initProfileView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    const profile = getUserProfile();
    const playlists = getUserPlaylists();
    
    container.innerHTML = `
        <div class="profile-view">
            <div class="header-with-image">
                <div class="header-image round">
                    ${profile.avatar ? `<img src="${profile.avatar}" alt="${profile.name}">` : `
                        <div style="width:100%;height:100%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;">
                            <svg viewBox="0 0 24 24" fill="white" style="width:50%;height:50%;">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        </div>
                    `}
                </div>
                <div class="header-info">
                    <div class="header-type">Perfil</div>
                    <h1 class="header-title">${profile.name}</h1>
                    <div class="header-metadata">
                        <span>${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'}</span>
                    </div>
                </div>
            </div>
            
            <section class="profile-playlists">
                <h2 class="section-title">Playlists Públicas</h2>
                <div class="grid grid-auto" id="playlistsGrid"></div>
            </section>
        </div>
    `;
    
    const grid = $('#playlistsGrid');
    if (playlists.length === 0) {
        grid.innerHTML = '<p style="color:var(--color-text-secondary);">Nenhuma playlist criada ainda.</p>';
    } else {
        playlists.forEach(playlist => {
            const div = createElement('div', ['music-card']);
            div.innerHTML = `
                <div class="music-card-image">
                    <div style="width:100%;height:100%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;">
                        <svg viewBox="0 0 24 24" fill="white" style="width:50%;height:50%;opacity:0.7;">
                            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                        </svg>
                    </div>
                </div>
                <div class="music-card-content">
                    <div class="music-card-title">${playlist.title}</div>
                    <div class="music-card-subtitle">${playlist.totalTracks} músicas</div>
                </div>
            `;
            div.addEventListener('click', () => window.location.hash = `#/playlist/${playlist.id}`);
            grid.appendChild(div);
        });
    }
}

