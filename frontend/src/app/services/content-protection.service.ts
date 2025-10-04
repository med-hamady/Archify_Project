import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContentProtectionService {
  private isProtectionActive = false;
  private watermarkInterval: any;

  constructor() {}

  enableProtection() {
    if (this.isProtectionActive) return;
    
    this.isProtectionActive = true;
    this.setupGlobalProtection();
    this.startWatermarkRotation();
  }

  disableProtection() {
    this.isProtectionActive = false;
    this.removeGlobalProtection();
    if (this.watermarkInterval) {
      clearInterval(this.watermarkInterval);
    }
  }

  private setupGlobalProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', this.preventDefault, { passive: false });
    
    // Disable developer tools and shortcuts
    document.addEventListener('keydown', this.handleKeyDown, { passive: false });
    
    // Disable text selection on protected elements
    document.addEventListener('selectstart', this.handleSelectStart, { passive: false });
    
    // Disable drag and drop
    document.addEventListener('dragstart', this.preventDefault, { passive: false });
    document.addEventListener('drop', this.preventDefault, { passive: false });
    
    // Disable print screen
    document.addEventListener('keyup', this.handleKeyUp, { passive: false });
    
    // Mobile-specific protections
    document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    
    // Disable zoom on mobile
    document.addEventListener('gesturestart', this.preventDefault, { passive: false });
    document.addEventListener('gesturechange', this.preventDefault, { passive: false });
    document.addEventListener('gestureend', this.preventDefault, { passive: false });
    
    // Disable screenshot detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Disable console access (basic protection)
    this.disableConsole();
  }

  private removeGlobalProtection() {
    document.removeEventListener('contextmenu', this.preventDefault);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('selectstart', this.handleSelectStart);
    document.removeEventListener('dragstart', this.preventDefault);
    document.removeEventListener('drop', this.preventDefault);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('gesturestart', this.preventDefault);
    document.removeEventListener('gesturechange', this.preventDefault);
    document.removeEventListener('gestureend', this.preventDefault);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private preventDefault = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const blockedKeys = [
      'F12', 'F11', 'F10', 'F9', 'F8', 'F7', 'F6', 'F5', 'F4', 'F3', 'F2', 'F1'
    ];
    
    const blockedCombinations = [
      { ctrl: true, shift: true, key: 'I' }, // Dev tools
      { ctrl: true, shift: true, key: 'C' }, // Dev tools
      { ctrl: true, shift: true, key: 'J' }, // Console
      { ctrl: true, key: 'u' }, // View source
      { ctrl: true, key: 's' }, // Save
      { ctrl: true, key: 'a' }, // Select all
      { ctrl: true, key: 'c' }, // Copy
      { ctrl: true, key: 'v' }, // Paste
      { ctrl: true, key: 'x' }, // Cut
      { ctrl: true, key: 'p' }, // Print
      { ctrl: true, key: 'f' }, // Find
      { ctrl: true, key: 'g' }, // Find next
      { ctrl: true, key: 'h' }, // Find and replace
      { ctrl: true, key: 'r' }, // Reload
      { ctrl: true, key: 't' }, // New tab
      { ctrl: true, key: 'w' }, // Close tab
      { ctrl: true, key: 'n' }, // New window
      { ctrl: true, key: 'shift', key2: 'N' }, // New incognito
      { alt: true, key: 'F4' }, // Close window
      { ctrl: true, shift: true, key: 'Delete' }, // Clear browsing data
    ];

    // Check single keys
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check key combinations
    for (const combo of blockedCombinations) {
      if (combo.ctrl && !e.ctrlKey) continue;
      if (combo.shift && !e.shiftKey) continue;
      if (combo.alt && !e.altKey) continue;
      if (combo.key && e.key !== combo.key) continue;
      if (combo.key2 && e.key !== combo.key2) continue;
      
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      // Clear clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText('');
      }
    }
  };

  private handleSelectStart = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (target.closest('.protected-content') || 
        target.closest('.bg-black') || 
        target.closest('.video-container') ||
        target.closest('.pdf-container')) {
      e.preventDefault();
      return;
    }
  };

  private handleTouchStart = (e: TouchEvent): void => {
    // Disable multi-touch (pinch to zoom)
    if (e.touches.length > 1) {
      e.preventDefault();
      return;
    }

    // Disable long press on protected content
    const target = e.target as HTMLElement;
    if (target.closest('.protected-content') || 
        target.closest('.bg-black') || 
        target.closest('.video-container') ||
        target.closest('.pdf-container')) {
      e.preventDefault();
      return;
    }
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      // Clear sensitive content when tab is hidden
      console.clear();
      // Clear any cached sensitive data
      this.clearSensitiveData();
    }
  };

  private clearSensitiveData() {
    // Clear any cached video frames or sensitive content
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
  }

  private disableConsole() {
    // Basic console protection (can be bypassed by advanced users)
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'profile', 'profileEnd', 'count', 'clear', 'assert', 'markTimeline', 'timeline', 'timelineEnd'];
    
    methods.forEach(method => {
      if (console && (console as any)[method]) {
        (console as any)[method] = noop;
      }
    });
  }

  private startWatermarkRotation() {
    // Update watermarks every second
    this.watermarkInterval = setInterval(() => {
      this.updateWatermarks();
    }, 1000);
  }

  private updateWatermarks() {
    const watermarks = document.querySelectorAll('.dynamic-watermark');
    const currentTime = new Date().toLocaleTimeString('fr-FR');
    const userEmail = 'user@archify.com'; // This would come from auth service
    
    watermarks.forEach(watermark => {
      watermark.textContent = `Archify - ${userEmail} - ${currentTime}`;
    });
  }

  // Method to add protection to specific elements
  protectElement(element: HTMLElement) {
    element.classList.add('protected-content');
    
    // Add watermark
    const watermark = document.createElement('div');
    watermark.className = 'dynamic-watermark absolute top-2 right-2 text-xs opacity-50 pointer-events-none select-none text-white';
    watermark.textContent = `Archify - user@archify.com - ${new Date().toLocaleTimeString('fr-FR')}`;
    element.appendChild(watermark);
    
    // Disable context menu on this element
    element.addEventListener('contextmenu', this.preventDefault, { passive: false });
    
    // Disable text selection on this element
    element.addEventListener('selectstart', this.preventDefault, { passive: false });
  }

  // Method to create a secure video container
  createSecureVideoContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'video-container bg-black rounded-lg overflow-hidden aspect-video relative protected-content';
    
    // Add security overlay
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 flex items-center justify-center bg-black bg-opacity-50';
    overlay.innerHTML = `
      <div class="text-center text-white">
        <div class="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 5v6l4 2 4-2V5l-4-2-4 2z"/>
          </svg>
        </div>
        <p class="text-lg font-medium">Vidéo protégée</p>
        <p class="text-sm opacity-75">Connectez-vous pour accéder au contenu</p>
      </div>
    `;
    container.appendChild(overlay);
    
    // Add watermark
    const watermark = document.createElement('div');
    watermark.className = 'dynamic-watermark absolute top-4 right-4 text-white text-xs opacity-50 pointer-events-none select-none';
    watermark.textContent = `Archify - user@archify.com - ${new Date().toLocaleTimeString('fr-FR')}`;
    container.appendChild(watermark);
    
    // Add security notice
    const notice = document.createElement('div');
    notice.className = 'absolute bottom-4 left-4 text-white text-xs opacity-75';
    notice.textContent = '⚠️ Enregistrement interdit - Contenu protégé';
    container.appendChild(notice);
    
    this.protectElement(container);
    return container;
  }
}
