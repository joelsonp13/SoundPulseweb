/* ====================================
   LOADING - Loading states e error handling
   ==================================== */

/**
 * Mostrar skeleton loader em um container
 */
export function showLoading(container, type = 'grid') {
    if (!container) return;

    const skeletons = {
        grid: `
            <div class="loading-skeleton">
                ${Array(6).fill(0).map(() => `
                    <div class="skeleton-card">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                `).join('')}
            </div>
        `,
        list: `
            <div class="loading-skeleton">
                ${Array(8).fill(0).map(() => `
                    <div class="skeleton-list-item">
                        <div class="skeleton-image small"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-text"></div>
                            <div class="skeleton-text short"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `,
        single: `
            <div class="loading-skeleton">
                <div class="skeleton-single">
                    <div class="skeleton-image large"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-text title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-text short"></div>
                    </div>
                </div>
            </div>
        `
    };

    container.innerHTML = skeletons[type] || skeletons.grid;
}

/**
 * Mostrar mensagem de erro
 */
export function showError(container, message = 'Erro ao carregar conteúdo', details = null) {
    if (!container) return;

    container.innerHTML = `
        <div class="error-state">
            <svg viewBox="0 0 24 24" fill="none" width="64" height="64">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" 
                      fill="currentColor" opacity="0.5"/>
            </svg>
            <h3 class="error-title">${message}</h3>
            ${details ? `<p class="error-details">${details}</p>` : ''}
            <button class="btn-primary" onclick="location.reload()">
                Tentar Novamente
            </button>
        </div>
    `;
}

/**
 * Mostrar mensagem de "nenhum resultado"
 */
export function showEmpty(container, message = 'Nenhum resultado encontrado', icon = '🔍') {
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <h3 class="empty-title">${message}</h3>
            <p class="empty-subtitle">Tente buscar por algo diferente</p>
        </div>
    `;
}

/**
 * Mostrar erro de backend offline
 */
export function showBackendOffline(container) {
    showError(
        container,
        'Backend Offline',
        'O servidor não está respondendo. Certifique-se de que o backend está rodando em http://localhost:5000'
    );
}

/**
 * Criar toast notification
 */
export function showToast(message, type = 'info') {
    // Remove toast anterior se existir
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Adicionar estilos de loading ao documento
 */
export function injectLoadingStyles() {
    if (document.getElementById('loading-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
        .loading-skeleton {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: var(--spacing-md);
            padding: var(--spacing-lg);
        }

        .skeleton-card {
            background: var(--color-bg-tertiary);
            border-radius: var(--border-radius-md);
            padding: var(--spacing-md);
            animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton-image {
            width: 100%;
            height: 180px;
            background: var(--color-bg-secondary);
            border-radius: var(--border-radius-sm);
            margin-bottom: var(--spacing-sm);
        }

        .skeleton-image.small {
            width: 48px;
            height: 48px;
        }

        .skeleton-image.large {
            width: 200px;
            height: 200px;
        }

        .skeleton-text {
            height: 16px;
            background: var(--color-bg-secondary);
            border-radius: 4px;
            margin-bottom: var(--spacing-xs);
        }

        .skeleton-text.short {
            width: 60%;
        }

        .skeleton-text.title {
            height: 24px;
            margin-bottom: var(--spacing-sm);
        }

        .skeleton-list-item {
            display: flex;
            gap: var(--spacing-md);
            padding: var(--spacing-sm);
            background: var(--color-bg-tertiary);
            border-radius: var(--border-radius-sm);
            margin-bottom: var(--spacing-xs);
        }

        .skeleton-content {
            flex: 1;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .error-state, .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xxl);
            text-align: center;
            min-height: 400px;
        }

        .error-state svg {
            color: var(--color-error);
            margin-bottom: var(--spacing-lg);
        }

        .error-title, .empty-title {
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            margin-bottom: var(--spacing-sm);
            color: var(--color-text-primary);
        }

        .error-details, .empty-subtitle {
            font-size: var(--font-size-md);
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-lg);
            max-width: 500px;
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: var(--spacing-lg);
            opacity: 0.5;
        }

        .toast-notification {
            position: fixed;
            bottom: var(--spacing-xl);
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius-lg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            transition: transform 0.3s ease;
        }

        .toast-notification.show {
            transform: translateX(-50%) translateY(0);
        }

        .toast-success {
            background: var(--color-success);
        }

        .toast-error {
            background: var(--color-error);
        }

        @media (max-width: 768px) {
            .loading-skeleton {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: var(--spacing-sm);
                padding: var(--spacing-md);
            }

            .skeleton-image.large {
                width: 150px;
                height: 150px;
            }
        }
    `;

    document.head.appendChild(style);
}

// Injetar estilos ao carregar o módulo
injectLoadingStyles();

