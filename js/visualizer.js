/* ====================================
   AUDIO VISUALIZER - Visualizador de áudio leve
   ==================================== */

import { $ } from './utils/dom.js';

class AudioVisualizer {
    constructor(player) {
        this.player = player;
        this.canvas = null;
        this.ctx = null;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.rafId = null;
        this.enabled = false;
        this.paused = false;
        this.isSetup = false;
        
        // Performance monitoring
        this.fps = 60;
        this.fpsCounter = 0;
        this.lowFpsCount = 0;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.lastFpsTime = performance.now();
        
        // Visual config
        this.barCount = 32;
        this.bars = new Array(this.barCount).fill(0);
        this.dominantColor = 'rgba(30, 215, 96, 0.8)'; // Fallback color
        this.gradientColor1 = null;
        this.gradientColor2 = null;
        
        // Device detection
        this.isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        this.isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
        
        // Settings from localStorage
        this.loadSettings();
        
        // Initialize
        this.init();
    }
    
    loadSettings() {
        const settings = localStorage.getItem('visualizerSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.enabled = parsed.enabled !== undefined ? parsed.enabled : !this.isMobile;
        } else {
            // Default: ON desktop, OFF mobile
            this.enabled = !this.isMobile;
        }
    }
    
    saveSettings() {
        localStorage.setItem('visualizerSettings', JSON.stringify({
            enabled: this.enabled
        }));
    }
    
    init() {
        this.canvas = $('#visualizerCanvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Page Visibility API - pause when tab inactive
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.enabled && this.player.isPlaying) {
                this.resume();
            }
        });
        
        // Battery API - auto-disable if low
        this.checkBattery();
        
        // Mobile: lighter config
        if (this.isMobile || this.isLowEnd) {
            this.barCount = 24; // Fewer bars
        }
        
        // Update container visibility
        this.updateVisibility();
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Set display size (CSS)
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set actual size (canvas buffer)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context
        this.ctx.scale(dpr, dpr);
    }
    
    async checkBattery() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                // Check now
                if (battery.level < 0.2 && !battery.charging && this.enabled) {
                    this.disable('battery');
                    this.showToast('Visualizador desligado (bateria baixa)');
                }
                
                // Monitor changes
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.2 && !battery.charging && this.enabled) {
                        this.disable('battery');
                        this.showToast('Visualizador desligado (bateria baixa)');
                    }
                });
            } catch (e) {
                // Battery API not supported, ignore
            }
        }
    }
    
    setupAudioContext() {
        if (this.isSetup) return;
        
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isMobile ? 64 : 128; // Smaller FFT for mobile
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.85 : 0.8;
            
            // Note: Visualizer disabled for YouTube Player
            // YouTube IFrame API doesn't provide direct audio access
            // This would require Web Audio API integration with YouTube
            console.log('⚠️ Visualizer disabled - YouTube Player doesn\'t support direct audio access');
            this.isSetup = true;
            return;
            
            // Create data array
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.isSetup = true;
        } catch (e) {
            console.error('Failed to setup audio context:', e);
            this.disable('error');
        }
    }
    
    start() {
        if (!this.enabled || this.paused === false) return;
        
        this.setupAudioContext();
        this.paused = false;
        this.animate();
    }
    
    pause() {
        this.paused = true;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
    
    resume() {
        if (!this.enabled) return;
        this.start();
    }
    
    animate() {
        if (this.paused || !this.enabled) return;
        
        this.rafId = requestAnimationFrame(() => this.animate());
        
        // Check performance
        this.checkPerformance();
        
        // Draw visualization
        this.draw();
    }
    
    checkPerformance() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;
        
        // Calculate FPS
        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
        }
        
        // Check if FPS is too low
        const currentFps = 1000 / delta;
        if (currentFps < 50) {
            this.lowFpsCount++;
            
            // If 30 consecutive frames below 50fps, disable
            if (this.lowFpsCount > 30) {
                this.disable('performance');
                this.showToast('Visualizador desligado (performance baixa)');
            }
        } else {
            this.lowFpsCount = 0; // Reset counter
        }
    }
    
    draw() {
        if (!this.ctx || !this.analyser) return;
        
        // Get audio data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.ctx.clearRect(0, 0, width, height);
        
        // Calculate bar width
        const barWidth = width / this.barCount;
        const gap = 2;
        
        // Draw bars
        for (let i = 0; i < this.barCount; i++) {
            // Get frequency data (spread across available data)
            const dataIndex = Math.floor((i / this.barCount) * this.dataArray.length);
            const value = this.dataArray[dataIndex];
            
            // Normalize to 0-1
            const normalizedValue = value / 255;
            
            // Target height
            const targetHeight = normalizedValue * height * 0.8; // Max 80% of height
            
            // Smooth transition (lerp)
            this.bars[i] += (targetHeight - this.bars[i]) * 0.3;
            this.bars[i] = Math.max(2, this.bars[i]); // Minimum 2px
            
            // Bar position
            const x = i * barWidth;
            const barHeight = this.bars[i];
            const y = height - barHeight;
            
            // Create gradient
            const gradient = this.ctx.createLinearGradient(0, height, 0, y);
            gradient.addColorStop(0, this.gradientColor1 || this.dominantColor);
            gradient.addColorStop(1, this.gradientColor2 || 'rgba(30, 215, 96, 1)');
            
            // Draw bar
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                x + gap / 2,
                y,
                barWidth - gap,
                barHeight
            );
        }
    }
    
    extractColorFromImage(imageUrl) {
        if (!imageUrl) return;
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Sample multiple points
                const samples = [
                    { x: img.width * 0.3, y: img.height * 0.3 },
                    { x: img.width * 0.5, y: img.height * 0.5 },
                    { x: img.width * 0.7, y: img.height * 0.7 }
                ];
                
                let totalR = 0, totalG = 0, totalB = 0;
                
                samples.forEach(sample => {
                    const imageData = ctx.getImageData(sample.x, sample.y, 1, 1);
                    const pixel = imageData.data;
                    totalR += pixel[0];
                    totalG += pixel[1];
                    totalB += pixel[2];
                });
                
                // Average
                const avgR = Math.floor(totalR / samples.length);
                const avgG = Math.floor(totalG / samples.length);
                const avgB = Math.floor(totalB / samples.length);
                
                // Create gradient colors
                this.gradientColor1 = `rgba(${avgR}, ${avgG}, ${avgB}, 0.6)`;
                this.gradientColor2 = `rgba(${Math.min(255, avgR + 40)}, ${Math.min(255, avgG + 40)}, ${Math.min(255, avgB + 40)}, 0.9)`;
                
            } catch (e) {
                // CORS error or other issue - use fallback
                this.resetColors();
            }
        };
        
        img.onerror = () => {
            this.resetColors();
        };
    }
    
    resetColors() {
        this.gradientColor1 = 'rgba(30, 215, 96, 0.6)';
        this.gradientColor2 = 'rgba(30, 215, 96, 0.9)';
    }
    
    enable() {
        this.enabled = true;
        this.saveSettings();
        this.updateVisibility();
        
        if (this.player.isPlaying) {
            this.start();
        }
    }
    
    disable(reason) {
        this.enabled = false;
        this.saveSettings();
        this.pause();
        this.updateVisibility();
    }
    
    toggle() {
        if (this.enabled) {
            this.disable('user');
        } else {
            this.enable();
        }
    }
    
    updateVisibility() {
        const container = $('#visualizerContainer');
        if (container) {
            if (this.enabled) {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }
    }
    
    showToast(message) {
        // Use existing toast system
        if (window.showToast) {
            window.showToast(message, 'info');
        }
    }
    
    destroy() {
        this.pause();
        
        if (this.source) {
            this.source.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

export default AudioVisualizer;

