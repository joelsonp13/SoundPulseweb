/* ====================================
   PREMIUM VIEW
   ==================================== */

import { $, createElement } from '../utils/dom.js';

export function initPremiumView() {
    const container = $('#viewContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="premium-view">
            <div class="premium-hero">
                <h1 class="premium-hero-title">Assine o Premium</h1>
                <p class="premium-hero-subtitle">Ouça sem limites com qualidade superior</p>
            </div>
            
            <div class="premium-plans">
                <div class="premium-plan">
                    <h3 class="premium-plan-name">Individual</h3>
                    <div class="premium-plan-price">R$ 19,90</div>
                    <div class="premium-plan-period">por mês</div>
                    <ul class="premium-plan-features">
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>1 conta Premium</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Sem anúncios</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Ouça em qualquer lugar, até offline</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Pule músicas ilimitadamente</span>
                        </li>
                    </ul>
                    <button class="btn btn-primary" style="width: 100%;">Começar</button>
                </div>
                
                <div class="premium-plan recommended">
                    <h3 class="premium-plan-name">Duo</h3>
                    <div class="premium-plan-price">R$ 24,90</div>
                    <div class="premium-plan-period">por mês</div>
                    <ul class="premium-plan-features">
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>2 contas Premium</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Para casais que moram juntos</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Sem anúncios</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Ouça offline</span>
                        </li>
                    </ul>
                    <button class="btn btn-primary" style="width: 100%;">Começar</button>
                </div>
                
                <div class="premium-plan">
                    <h3 class="premium-plan-name">Família</h3>
                    <div class="premium-plan-price">R$ 34,90</div>
                    <div class="premium-plan-period">por mês</div>
                    <ul class="premium-plan-features">
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Até 6 contas Premium</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Para família que mora junto</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Sem anúncios</span>
                        </li>
                        <li class="premium-plan-feature">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            <span>Ouça offline</span>
                        </li>
                    </ul>
                    <button class="btn btn-primary" style="width: 100%;">Começar</button>
                </div>
            </div>
            
            <section class="premium-features">
                <h2 class="premium-features-title">Por que assinar Premium?</h2>
                <div class="premium-features-grid">
                    <div class="premium-feature-card">
                        <svg class="premium-feature-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
                        </svg>
                        <h3 class="premium-feature-title">Ouça sem anúncios</h3>
                        <p class="premium-feature-description">Desfrute de música ininterrupta</p>
                    </div>
                    <div class="premium-feature-card">
                        <svg class="premium-feature-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                        </svg>
                        <h3 class="premium-feature-title">Modo offline</h3>
                        <p class="premium-feature-description">Baixe até 10.000 músicas em até 5 dispositivos</p>
                    </div>
                    <div class="premium-feature-card">
                        <svg class="premium-feature-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <h3 class="premium-feature-title">Qualidade superior</h3>
                        <p class="premium-feature-description">Ouça em qualidade de áudio lossless</p>
                    </div>
                    <div class="premium-feature-card">
                        <svg class="premium-feature-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                        <h3 class="premium-feature-title">Pule à vontade</h3>
                        <p class="premium-feature-description">Pule quantas músicas quiser</p>
                    </div>
                </div>
            </section>
            
            <div class="premium-faq">
                <h2 class="premium-faq-title">Perguntas frequentes</h2>
                <div class="premium-faq-item">
                    <div class="premium-faq-question">Como funciona o teste gratuito?</div>
                    <div class="premium-faq-answer">Você pode experimentar o Premium gratuitamente por 30 dias. Cancele quando quiser.</div>
                </div>
                <div class="premium-faq-item">
                    <div class="premium-faq-question">Posso cancelar a qualquer momento?</div>
                    <div class="premium-faq-answer">Sim! Você pode cancelar sua assinatura a qualquer momento sem custo adicional.</div>
                </div>
                <div class="premium-faq-item">
                    <div class="premium-faq-question">Como funciona o plano Família?</div>
                    <div class="premium-faq-answer">O plano Família oferece até 6 contas Premium para familiares que moram no mesmo endereço.</div>
                </div>
            </div>
        </div>
    `;
}

