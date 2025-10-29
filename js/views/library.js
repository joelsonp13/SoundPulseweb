/* ====================================
   LIBRARY VIEW
   ==================================== */

import { tracks, albums, artists } from '../data.js';
import * as Storage from '../storage.js';
import player from '../player.js';
import { $, createElement } from '../utils/dom.js';

let currentTab = 'tracks';

export function initLibraryView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="library-view">
            <div class="library-header">
                <h1 class="library-title">Sua Biblioteca</h1>
            </div>
            
            <div class="library-tabs">
                <button class="library-tab active" data-tab="tracks">Músicas</button>
                <button class="library-tab" data-tab="albums">Álbuns</button>
                <button class="library-tab" data-tab="artists">Artistas</button>
                <button class="library-tab" data-tab="playlists">Playlists</button>
            </div>
            
            <div class="library-content" id="libraryContent"></div>
        </div>
    `;
    
    setupTabHandlers();
    renderContent();
}

function setupTabHandlers() {
    const tabs = document.querySelectorAll('.library-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderContent();
        });
    });
}

function renderContent() {
    const container = $('#libraryContent');
    if (!container) return;
    
    if (currentTab === 'tracks') {
        renderLikedTracks();
    } else if (currentTab === 'albums') {
        renderLikedAlbums();
    } else if (currentTab === 'artists') {
        renderFollowedArtists();
    } else if (currentTab === 'playlists') {
        renderUserPlaylists();
    }
}

function renderLikedTracks() {
    const container = $('#libraryContent');
    const likedIds = Storage.getLikedTracks();
    const likedTracks = likedIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
    
    if (likedTracks.length === 0) {
        container.innerHTML = `
            <div class="library-empty">
                <svg class="library-empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/>
                </svg>
                <h3 class="library-empty-title">Nenhuma música curtida</h3>
                <p class="library-empty-subtitle">Curta músicas para vê-las aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="liked-songs-banner">
            <div class="liked-songs-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="white"/>
                </svg>
            </div>
            <div class="liked-songs-info">
                <h2 class="liked-songs-title">Músicas Curtidas</h2>
                <p class="liked-songs-count">${likedTracks.length} ${likedTracks.length === 1 ? 'música' : 'músicas'}</p>
            </div>
        </div>
        <div class="track-list" id="likedTracksList"></div>
    `;
    
    const list = $('#likedTracksList');
    likedTracks.forEach((track, index) => {
        list.appendChild(createTrackItem(track, index + 1, likedTracks.map(t => t.id)));
    });
}

function renderLikedAlbums() {
    const container = $('#libraryContent');
    const likedIds = Storage.getLikedAlbums();
    const likedAlbums = likedIds.map(id => albums.find(a => a.id === id)).filter(Boolean);
    
    if (likedAlbums.length === 0) {
        container.innerHTML = `
            <div class="library-empty">
                <svg class="library-empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h3 class="library-empty-title">Nenhum álbum salvo</h3>
                <p class="library-empty-subtitle">Salve álbuns para vê-los aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="library-grid" id="albumsGrid"></div>';
    const grid = $('#albumsGrid');
    
    likedAlbums.forEach(album => {
        const card = createElement('div', ['music-card']);
        card.innerHTML = `
            <div class="music-card-image">
                <img src="${album.image}" alt="${album.title}">
            </div>
            <div class="music-card-content">
                <div class="music-card-title">${album.title}</div>
                <div class="music-card-subtitle">${album.artistName} • ${album.year}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.hash = `#/album/${album.id}`;
        });
        grid.appendChild(card);
    });
}

function renderFollowedArtists() {
    const container = $('#libraryContent');
    const followedIds = Storage.getFollowedArtists();
    const followedArtists = followedIds.map(id => artists.find(a => a.id === id)).filter(Boolean);
    
    if (followedArtists.length === 0) {
        container.innerHTML = `
            <div class="library-empty">
                <svg class="library-empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <h3 class="library-empty-title">Nenhum artista seguido</h3>
                <p class="library-empty-subtitle">Siga artistas para vê-los aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="library-grid" id="artistsGrid"></div>';
    const grid = $('#artistsGrid');
    
    followedArtists.forEach(artist => {
        const card = createElement('div', ['music-card', 'round']);
        card.innerHTML = `
            <div class="music-card-image">
                <img src="${artist.image}" alt="${artist.name}">
            </div>
            <div class="music-card-content">
                <div class="music-card-title">${artist.name}</div>
                <div class="music-card-subtitle">Artista</div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.hash = `#/artist/${artist.id}`;
        });
        grid.appendChild(card);
    });
}

function renderUserPlaylists() {
    const container = $('#libraryContent');
    const playlists = Storage.getUserPlaylists();
    
    if (playlists.length === 0) {
        container.innerHTML = `
            <div class="library-empty">
                <svg class="library-empty-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
                </svg>
                <h3 class="library-empty-title">Nenhuma playlist criada</h3>
                <p class="library-empty-subtitle">Crie playlists para organizarsuas músicas</p>
                <button class="btn btn-primary" onclick="document.querySelector('.btn-create-playlist').click()">
                    Criar Playlist
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '<div class="library-grid" id="playlistsGrid"></div>';
    const grid = $('#playlistsGrid');
    
    playlists.forEach(playlist => {
        const card = createElement('div', ['music-card']);
        card.innerHTML = `
            <div class="music-card-image">
                ${playlist.image ? `<img src="${playlist.image}" alt="${playlist.title}">` : `
                    <div style="width: 100%; height: 100%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center;">
                        <svg viewBox="0 0 24 24" fill="white" style="width: 50%; height: 50%; opacity: 0.7;">
                            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                        </svg>
                    </div>
                `}
            </div>
            <div class="music-card-content">
                <div class="music-card-title">${playlist.title}</div>
                <div class="music-card-subtitle">${playlist.totalTracks} ${playlist.totalTracks === 1 ? 'música' : 'músicas'}</div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.hash = `#/playlist/${playlist.id}`;
        });
        grid.appendChild(card);
    });
}

function createTrackItem(track, number, queueIds) {
    const div = createElement('div', ['track-item']);
    div.innerHTML = `
        <div class="track-number">
            <span class="number">${number}</span>
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
        </div>
        <div class="track-info">
            <div class="track-image">
                <img src="${track.image}" alt="${track.title}">
            </div>
            <div class="track-details">
                <div class="track-name">${track.title}</div>
                <div class="track-artist">${track.artistName}</div>
            </div>
        </div>
        <div class="track-album">${track.albumName}</div>
        <div class="track-duration">${formatTime(track.duration)}</div>
    `;
    
    div.addEventListener('click', () => {
        player.playTrack(track.id, queueIds);
    });
    
    return div;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

