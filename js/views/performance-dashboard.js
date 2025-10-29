/* ====================================
   PERFORMANCE DASHBOARD VIEW
   ==================================== */

import metrics from '../utils/metrics.js';
import { $ } from '../utils/dom.js';

export function initPerformanceDashboard() {
    const container = $('#viewContainer');
    if (!container) return;
    
    const allMetrics = metrics.getAllMetrics();
    const score = metrics.getScore();
    
    container.innerHTML = `
        <div class="performance-dashboard">
            <header class="dashboard-header">
                <h1>📊 Performance Dashboard</h1>
                <p>Monitoramento em tempo real do desempenho da aplicação</p>
            </header>
            
            <div class="performance-score">
                <div class="score-circle ${getScoreClass(score)}">
                    <span class="score-value">${score}</span>
                    <span class="score-label">Score</span>
                </div>
                <div class="score-info">
                    <h3>${getScoreLabel(score)}</h3>
                    <p>${getScoreDescription(score)}</p>
                </div>
            </div>
            
            <section class="metrics-section">
                <h2>🎯 Core Web Vitals</h2>
                <div class="metrics-grid">
                    ${renderMetricCard('FCP', 'First Contentful Paint', allMetrics.FCP, 'ms')}
                    ${renderMetricCard('LCP', 'Largest Contentful Paint', allMetrics.LCP, 'ms')}
                    ${renderMetricCard('FID', 'First Input Delay', allMetrics.FID, 'ms')}
                    ${renderMetricCard('CLS', 'Cumulative Layout Shift', allMetrics.CLS, '')}
                    ${renderMetricCard('TTFB', 'Time to First Byte', allMetrics.TTFB, 'ms')}
                </div>
            </section>
            
            <section class="metrics-section">
                <h2>⚡ Custom Metrics</h2>
                <div class="metrics-grid">
                    ${renderCustomMetrics(allMetrics)}
                </div>
            </section>
            
            <section class="metrics-section">
                <h2>💾 Cache Status</h2>
                <div class="cache-info">
                    ${renderCacheInfo()}
                </div>
            </section>
            
            <section class="metrics-section">
                <h2>🌐 Network Info</h2>
                <div class="network-info">
                    ${renderNetworkInfo()}
                </div>
            </section>
            
            <section class="metrics-section">
                <h2>📈 Resource Timing</h2>
                <div class="resources-table">
                    ${renderResourceTiming()}
                </div>
            </section>
            
            <div class="dashboard-actions">
                <button class="btn btn-primary" id="refreshMetrics">🔄 Atualizar</button>
                <button class="btn btn-secondary" id="clearCache">🗑️ Limpar Cache</button>
                <button class="btn btn-secondary" id="exportMetrics">📥 Exportar JSON</button>
            </div>
        </div>
    `;
    
    setupDashboardActions();
}

function renderMetricCard(name, label, value, unit) {
    if (value === null || value === undefined) {
        return `
            <div class="metric-card metric-unknown">
                <div class="metric-name">${name}</div>
                <div class="metric-label">${label}</div>
                <div class="metric-value">-</div>
            </div>
        `;
    }
    
    const rating = metrics.getRating(name, value);
    const formattedValue = unit === 'ms' ? value.toFixed(0) : value.toFixed(3);
    
    return `
        <div class="metric-card metric-${rating}">
            <div class="metric-name">${name}</div>
            <div class="metric-label">${label}</div>
            <div class="metric-value">${formattedValue}${unit}</div>
            <div class="metric-rating">${getRatingEmoji(rating)} ${rating}</div>
        </div>
    `;
}

function renderCustomMetrics(allMetrics) {
    const customKeys = Object.keys(allMetrics).filter(key => 
        !['FCP', 'LCP', 'FID', 'CLS', 'TTFB'].includes(key)
    );
    
    if (customKeys.length === 0) {
        return '<p style="color: var(--color-text-secondary);">Nenhuma métrica customizada disponível</p>';
    }
    
    return customKeys.map(key => {
        const value = allMetrics[key];
        return `
            <div class="metric-card">
                <div class="metric-name">${key}</div>
                <div class="metric-value">${value.toFixed(2)}ms</div>
            </div>
        `;
    }).join('');
}

function renderCacheInfo() {
    if ('caches' in window) {
        return `
            <div class="info-item">
                <strong>Cache API:</strong> ✅ Disponível
            </div>
            <div class="info-item">
                <strong>Service Worker:</strong> ${navigator.serviceWorker?.controller ? '✅ Ativo' : '❌ Inativo'}
            </div>
            <div class="info-item">
                <button class="btn btn-sm" onclick="caches.keys().then(keys => alert('Caches: ' + keys.join(', ')))">
                    Ver Caches
                </button>
            </div>
        `;
    }
    
    return '<p>❌ Cache API não disponível</p>';
}

function renderNetworkInfo() {
    if ('connection' in navigator) {
        const conn = navigator.connection;
        return `
            <div class="info-item">
                <strong>Tipo de conexão:</strong> ${conn.effectiveType || 'unknown'}
            </div>
            <div class="info-item">
                <strong>Downlink:</strong> ${conn.downlink ? conn.downlink + ' Mbps' : '-'}
            </div>
            <div class="info-item">
                <strong>RTT:</strong> ${conn.rtt ? conn.rtt + ' ms' : '-'}
            </div>
            <div class="info-item">
                <strong>Data Saver:</strong> ${conn.saveData ? '✅ Ativo' : '❌ Desativado'}
            </div>
        `;
    }
    
    return '<p>❌ Network Information API não disponível</p>';
}

function renderResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    
    // Agrupar por tipo
    const grouped = resources.reduce((acc, resource) => {
        const type = getResourceType(resource.name);
        if (!acc[type]) acc[type] = [];
        acc[type].push(resource);
        return acc;
    }, {});
    
    let html = '<table class="resources-table-inner">';
    html += '<thead><tr><th>Tipo</th><th>Quantidade</th><th>Tamanho Total</th><th>Tempo Médio</th></tr></thead>';
    html += '<tbody>';
    
    for (const [type, items] of Object.entries(grouped)) {
        const totalSize = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const avgTime = items.reduce((sum, r) => sum + r.duration, 0) / items.length;
        
        html += `
            <tr>
                <td>${type}</td>
                <td>${items.length}</td>
                <td>${formatBytes(totalSize)}</td>
                <td>${avgTime.toFixed(2)}ms</td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    
    return html;
}

function getResourceType(url) {
    if (url.includes('.css')) return 'CSS';
    if (url.includes('.js')) return 'JavaScript';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)/)) return 'Imagens';
    if (url.includes('/api/')) return 'API';
    return 'Outros';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function getScoreClass(score) {
    if (score >= 90) return 'score-good';
    if (score >= 50) return 'score-medium';
    return 'score-poor';
}

function getScoreLabel(score) {
    if (score >= 90) return '🎉 Excelente!';
    if (score >= 70) return '👍 Bom';
    if (score >= 50) return '⚠️ Precisa Melhorar';
    return '❌ Ruim';
}

function getScoreDescription(score) {
    if (score >= 90) return 'Seu site está com performance excepcional!';
    if (score >= 70) return 'Performance boa, mas pode ser melhorada.';
    if (score >= 50) return 'Performance regular, otimizações necessárias.';
    return 'Performance ruim, otimizações críticas necessárias.';
}

function getRatingEmoji(rating) {
    switch (rating) {
        case 'good': return '✅';
        case 'needs-improvement': return '⚠️';
        case 'poor': return '❌';
        default: return '❓';
    }
}

function setupDashboardActions() {
    const btnRefresh = $('#refreshMetrics');
    const btnClearCache = $('#clearCache');
    const btnExport = $('#exportMetrics');
    
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    if (btnClearCache) {
        btnClearCache.addEventListener('click', async () => {
            if (confirm('Limpar todo o cache?')) {
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                }
                
                localStorage.clear();
                sessionStorage.clear();
                
                alert('Cache limpo! Recarregando...');
                window.location.reload();
            }
        });
    }
    
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const data = {
                timestamp: new Date().toISOString(),
                metrics: metrics.getAllMetrics(),
                score: metrics.getScore(),
                userAgent: navigator.userAgent,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                } : null
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-metrics-${Date.now()}.json`;
            a.click();
        });
    }
}

export default initPerformanceDashboard;


