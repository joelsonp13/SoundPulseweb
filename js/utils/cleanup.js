/* ====================================
   CLEANUP - Limpar dados mockados do localStorage
   ==================================== */

/**
 * Remove IDs mockados (track-*, artist-*, album-*, playlist-*) do localStorage
 */
export function cleanupMockData() {
    console.log('🧹 Limpando dados mockados do localStorage...');
    
    try {
        // Limpar recent tracks
        const recentTracks = JSON.parse(localStorage.getItem('soundpulse_recentTracks') || '[]');
        const validRecent = recentTracks.filter(id => 
            typeof id === 'string' && !id.startsWith('track-') && !id.startsWith('artist-')
        );
        localStorage.setItem('soundpulse_recentTracks', JSON.stringify(validRecent));
        
        // Limpar liked tracks
        const likedTracks = JSON.parse(localStorage.getItem('soundpulse_likedTracks') || '[]');
        const validLiked = likedTracks.filter(id => 
            typeof id === 'string' && !id.startsWith('track-')
        );
        localStorage.setItem('soundpulse_likedTracks', JSON.stringify(validLiked));
        
        // Limpar current track
        const currentTrack = localStorage.getItem('soundpulse_currentTrack');
        if (currentTrack && currentTrack.startsWith('track-')) {
            localStorage.removeItem('soundpulse_currentTrack');
        }
        
        console.log('✅ Dados mockados removidos!');
        console.log(`   Recent tracks: ${recentTracks.length} → ${validRecent.length}`);
        console.log(`   Liked tracks: ${likedTracks.length} → ${validLiked.length}`);
        
    } catch (error) {
        console.error('Erro ao limpar dados mockados:', error);
    }
}

/**
 * Resetar completamente o localStorage (útil para debug)
 */
export function resetAllStorage() {
    const confirm = window.confirm('⚠️ Isso vai apagar TODOS os dados salvos (curtidas, playlists, histórico). Continuar?');
    if (confirm) {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('soundpulse_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ Todo o localStorage foi limpo!');
        window.location.reload();
    }
}

