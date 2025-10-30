/* ====================================
   SETTINGS VIEW
   ==================================== */

import { getSettings, updateSettings, getTheme, setTheme } from '../storage.js';
import { $, showToast } from '../utils/dom.js';

function getVisualizerEnabled() {
    const settings = localStorage.getItem('visualizerSettings');
    if (settings) {
        return JSON.parse(settings).enabled;
    }
    // Default: ON desktop, OFF mobile
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    return !isMobile;
}

export function initSettingsView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    const settings = getSettings();
    const theme = getTheme();
    
    container.innerHTML = `
        <div class="settings-view">
            <h1 class="settings-title">Configurações</h1>
            
            <div class="settings-section">
                <h2 class="settings-section-title">Aparência</h2>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Tema</div>
                        <div class="settings-item-description">Escolha entre claro, escuro ou automático</div>
                    </div>
                    <div class="settings-item-control">
                        <select class="settings-select" id="themeSelect">
                            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Escuro</option>
                            <option value="light" ${theme === 'light' ? 'selected' : ''}>Claro</option>
                            <option value="auto" ${theme === 'auto' ? 'selected' : ''}>Automático</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h2 class="settings-section-title">Reprodução</h2>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Qualidade de áudio</div>
                        <div class="settings-item-description">Maior qualidade usa mais dados</div>
                    </div>
                    <div class="settings-item-control">
                        <select class="settings-select" id="audioQualitySelect">
                            <option value="low" ${settings.audioQuality === 'low' ? 'selected' : ''}>Baixa (96 kbps)</option>
                            <option value="normal" ${settings.audioQuality === 'normal' ? 'selected' : ''}>Normal (128 kbps)</option>
                            <option value="high" ${settings.audioQuality === 'high' ? 'selected' : ''}>Alta (320 kbps)</option>
                            <option value="lossless" ${settings.audioQuality === 'lossless' ? 'selected' : ''}>Lossless</option>
                        </select>
                    </div>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Crossfade</div>
                        <div class="settings-item-description">Transição suave entre músicas</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${settings.crossfade ? 'active' : ''}" id="crossfadeToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Reprodução sem intervalos</div>
                        <div class="settings-item-description">Elimina silêncio entre faixas</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${settings.gaplessPlayback ? 'active' : ''}" id="gaplessToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Normalizar volume</div>
                        <div class="settings-item-description">Mantém volume consistente</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${settings.normalizeVolume ? 'active' : ''}" id="normalizeToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Reprodução automática</div>
                        <div class="settings-item-description">Continua tocando músicas similares</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${settings.autoplay ? 'active' : ''}" id="autoplayToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h2 class="settings-section-title">Visualizador de Áudio</h2>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Visualizador</div>
                        <div class="settings-item-description">Animação de barras de áudio (Recomendado desligar no mobile para economizar bateria)</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${getVisualizerEnabled() ? 'active' : ''}" id="visualizerToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
                <div class="settings-info-box">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                    <span>Auto-desliga se performance baixa (FPS < 50) ou bateria abaixo de 20%</span>
                </div>
            </div>
            
            <div class="settings-section">
                <h2 class="settings-section-title">Notificações</h2>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Notificações</div>
                        <div class="settings-item-description">Receba avisos sobre novos lançamentos</div>
                    </div>
                    <div class="settings-item-control">
                        <div class="toggle-switch ${settings.notifications ? 'active' : ''}" id="notificationsToggle">
                            <div class="toggle-switch-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h2 class="settings-section-title">Idioma</h2>
                <div class="settings-item">
                    <div class="settings-item-info">
                        <div class="settings-item-label">Idioma da interface</div>
                        <div class="settings-item-description">Escolha o idioma do aplicativo</div>
                    </div>
                    <div class="settings-item-control">
                        <select class="settings-select" id="languageSelect">
                            <option value="pt-BR" ${settings.language === 'pt-BR' ? 'selected' : ''}>Português (Brasil)</option>
                            <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English (US)</option>
                            <option value="es-ES" ${settings.language === 'es-ES' ? 'selected' : ''}>Español</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupEventHandlers();
}

function setupEventHandlers() {
    // Theme
    $('#themeSelect')?.addEventListener('change', (e) => {
        setTheme(e.target.value);
        showToast('Tema alterado com sucesso', 'success');
    });
    
    // Audio Quality
    $('#audioQualitySelect')?.addEventListener('change', (e) => {
        updateSettings({ audioQuality: e.target.value });
        showToast('Qualidade de áudio alterada', 'success');
    });
    
    // Language
    $('#languageSelect')?.addEventListener('change', (e) => {
        updateSettings({ language: e.target.value });
        showToast('Idioma alterado', 'success');
    });
    
    // Toggles
    setupToggle('crossfadeToggle', 'crossfade', 'Crossfade');
    setupToggle('gaplessToggle', 'gaplessPlayback', 'Reprodução sem intervalos');
    setupToggle('normalizeToggle', 'normalizeVolume', 'Normalizar volume');
    setupToggle('autoplayToggle', 'autoplay', 'Reprodução automática');
    setupToggle('notificationsToggle', 'notifications', 'Notificações');
    
    // Visualizer toggle (special handling)
    const visualizerToggle = $('#visualizerToggle');
    if (visualizerToggle) {
        visualizerToggle.addEventListener('click', () => {
            // Get player instance
            import('../player.js').then(module => {
                const player = module.default;
                if (player && player.visualizer) {
                    player.visualizer.toggle();
                    visualizerToggle.classList.toggle('active');
                    const isActive = visualizerToggle.classList.contains('active');
                    showToast(`Visualizador ${isActive ? 'ativado' : 'desativado'}`, 'success');
                }
            });
        });
    }
}

function setupToggle(elementId, settingKey, label) {
    const toggle = $(`#${elementId}`);
    if (!toggle) return;
    
    toggle.addEventListener('click', () => {
        const isActive = toggle.classList.toggle('active');
        updateSettings({ [settingKey]: isActive });
        showToast(`${label} ${isActive ? 'ativado' : 'desativado'}`, 'success');
    });
}

