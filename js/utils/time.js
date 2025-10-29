/* ====================================
   TIME UTILITIES - Formatação de tempo
   ==================================== */

/**
 * Formata segundos em MM:SS ou HH:MM:SS
 */
export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0:00';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formata duração total (ex: "1h 23min")
 */
export function formatDuration(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0min';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    
    return `${minutes}min`;
}

/**
 * Formata data (ex: "21 de outubro de 2022")
 */
export function formatDate(dateString, locale = 'pt-BR') {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Formata data curta (ex: "21/10/2022")
 */
export function formatDateShort(dateString, locale = 'pt-BR') {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale);
}

/**
 * Formata data relativa (ex: "há 2 dias")
 */
export function formatRelativeTime(dateString, locale = 'pt-BR') {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    if (weeks < 4) return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/**
 * Formata número com separadores (ex: 1.234.567)
 */
export function formatNumber(num, locale = 'pt-BR') {
    return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formata número abreviado (ex: 1.2M, 45K)
 */
export function formatNumberCompact(num, locale = 'pt-BR') {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Calcula duração total de array de tracks
 */
export function calculateTotalDuration(tracks) {
    return tracks.reduce((total, track) => total + (track.duration || 0), 0);
}

export default {
    formatTime,
    formatDuration,
    formatDate,
    formatDateShort,
    formatRelativeTime,
    formatNumber,
    formatNumberCompact,
    calculateTotalDuration
};

