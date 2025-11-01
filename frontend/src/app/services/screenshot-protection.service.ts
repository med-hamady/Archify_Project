import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenshotProtectionService {
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private contextmenuListener: ((e: Event) => void) | null = null;
  private visibilityChangeListener: (() => void) | null = null;

  /**
   * Active la protection anti-capture d'écran
   */
  enableProtection(): void {
    this.blockScreenshotShortcuts();
    this.blockRightClick();
    this.detectScreenRecording();
    this.addCSSProtection();
    this.enableMobileScreenshotProtection();
  }

  /**
   * Désactive la protection anti-capture d'écran
   */
  disableProtection(): void {
    this.removeEventListeners();
    this.removeCSSProtection();
  }

  /**
   * Bloque les raccourcis clavier de capture d'écran
   */
  private blockScreenshotShortcuts(): void {
    this.keydownListener = (e: KeyboardEvent) => {
      // Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        this.showWarning('Les captures d\'écran sont désactivées pour protéger le contenu.');
        return false;
      }

      // Windows: Win + Shift + S (Snipping Tool)
      if (e.key === 's' && e.shiftKey && e.metaKey) {
        e.preventDefault();
        this.showWarning('Les captures d\'écran sont désactivées pour protéger le contenu.');
        return false;
      }

      // Mac: Cmd + Shift + 3/4/5
      if ((e.key === '3' || e.key === '4' || e.key === '5') && e.shiftKey && e.metaKey) {
        e.preventDefault();
        this.showWarning('Les captures d\'écran sont désactivées pour protéger le contenu.');
        return false;
      }

      // F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (DevTools)
      if (e.key === 'I' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Console)
      if (e.key === 'J' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C (Inspect Element)
      if (e.key === 'C' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.key === 'U' && e.ctrlKey) {
        e.preventDefault();
        return false;
      }

      return true;
    };

    document.addEventListener('keydown', this.keydownListener);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        this.showWarning('Les captures d\'écran sont désactivées.');
      }
    });
  }

  /**
   * Bloque le clic droit (menu contextuel)
   */
  private blockRightClick(): void {
    this.contextmenuListener = (e: Event) => {
      e.preventDefault();
      this.showWarning('Le clic droit est désactivé sur cette page.');
      return false;
    };
    document.addEventListener('contextmenu', this.contextmenuListener);
  }

  /**
   * Détecte l'enregistrement d'écran et les changements de visibilité
   */
  private detectScreenRecording(): void {
    this.visibilityChangeListener = () => {
      if (document.hidden) {
        // Vider le clipboard quand l'utilisateur change d'onglet
        navigator.clipboard.writeText('');
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeListener);
  }

  /**
   * Ajoute des protections CSS
   */
  private addCSSProtection(): void {
    const style = document.createElement('style');
    style.id = 'screenshot-protection-style';
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }

      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }

      body {
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Retire les protections CSS
   */
  private removeCSSProtection(): void {
    const style = document.getElementById('screenshot-protection-style');
    if (style) {
      style.remove();
    }
  }

  /**
   * Retire tous les event listeners
   */
  private removeEventListeners(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    if (this.contextmenuListener) {
      document.removeEventListener('contextmenu', this.contextmenuListener);
      this.contextmenuListener = null;
    }
    if (this.visibilityChangeListener) {
      document.removeEventListener('visibilitychange', this.visibilityChangeListener);
      this.visibilityChangeListener = null;
    }
  }

  /**
   * Affiche un message d'avertissement
   */
  private showWarning(message: string): void {
    // Créer une notification toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(220, 38, 38, 0.3);
      z-index: 10000;
      font-weight: 600;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    // Ajouter l'icône d'avertissement
    const icon = document.createElement('span');
    icon.textContent = '⚠️ ';
    toast.insertBefore(icon, toast.firstChild);

    document.body.appendChild(toast);

    // Retirer après 3 secondes
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Crée un watermark avec l'email de l'utilisateur
   */
  createWatermark(userEmail: string): HTMLElement {
    const watermark = document.createElement('div');
    watermark.id = 'content-watermark';
    watermark.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;

    // Créer plusieurs lignes de watermark
    const now = new Date().toLocaleString('fr-FR');
    const watermarkText = `${userEmail} • ${now}`;

    for (let i = 0; i < 15; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        width: 200%;
        text-align: center;
        opacity: 0.08;
        color: #000;
        font-size: 14px;
        font-weight: 600;
        transform: rotate(-45deg);
        white-space: nowrap;
        font-family: monospace;
        letter-spacing: 2px;
        top: ${i * 8}%;
        left: -50%;
      `;
      line.textContent = watermarkText.repeat(10);
      watermark.appendChild(line);
    }

    return watermark;
  }

  /**
   * Retire le watermark
   */
  removeWatermark(): void {
    const watermark = document.getElementById('content-watermark');
    if (watermark) {
      watermark.remove();
    }
  }

  /**
   * Active la protection native contre les captures d'écran sur mobile
   */
  private enableMobileScreenshotProtection(): void {
    // Bloquer les boutons de volume pour empêcher Power + Volume (screenshot)
    this.blockVolumeButtons();

    // Ajouter l'attribut secure pour Android (via meta tag)
    const secureMeta = document.createElement('meta');
    secureMeta.name = 'secure-content';
    secureMeta.content = 'true';
    document.head.appendChild(secureMeta);

    // Bloquer les captures d'écran via CSS flag-secure (Android)
    const secureStyle = document.createElement('style');
    secureStyle.id = 'mobile-screenshot-protection';
    secureStyle.textContent = `
      html {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }

      /* Bloquer les captures via FLAG_SECURE Android */
      body {
        -webkit-user-select: none !important;
        pointer-events: auto !important;
      }

      /* Protection iOS */
      @media only screen and (max-width: 768px) {
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
        }
      }
    `;
    document.head.appendChild(secureStyle);

    // Ajouter un event listener pour détecter les screenshots sur Android
    if ('onscreenshot' in window) {
      (window as any).addEventListener('screenshot', () => {
        console.warn('Screenshot attempt detected!');
        this.showWarning('Les captures d\'écran sont bloquées sur cette page.');
      });
    }

    // Bloquer les longpress sur mobile (iOS/Android)
    document.addEventListener('touchstart', this.preventLongPress, { passive: false });
    document.addEventListener('contextmenu', (e) => {
      if (this.isMobileDevice()) {
        e.preventDefault();
        this.showWarning('Cette action n\'est pas autorisée.');
      }
    });

    // Ajouter FLAG_SECURE pour Android via cordova/capacitor si disponible
    if ((window as any).cordova) {
      try {
        (window as any).cordova.plugins.SecureScreen?.enable();
      } catch (e) {
        console.log('Cordova SecureScreen plugin not available');
      }
    }

    // Pour Capacitor
    if ((window as any).Capacitor) {
      try {
        const { ScreenProtection } = (window as any).Capacitor.Plugins;
        if (ScreenProtection) {
          ScreenProtection.enable();
        }
      } catch (e) {
        console.log('Capacitor ScreenProtection plugin not available');
      }
    }
  }

  /**
   * Empêche le long press sur mobile
   */
  private preventLongPress = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  /**
   * Détecte si l'appareil est un mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Bloque les boutons de volume pour empêcher les screenshots (Power + Volume)
   */
  private blockVolumeButtons(): void {
    // Bloquer les événements de volume sur Android/iOS
    document.addEventListener('volumeupbutton', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showWarning('Les boutons de volume sont désactivés pendant le quiz.');
      return false;
    }, false);

    document.addEventListener('volumedownbutton', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showWarning('Les boutons de volume sont désactivés pendant le quiz.');
      return false;
    }, false);

    // Bloquer via Media Session API (navigateurs modernes)
    if ('mediaSession' in navigator) {
      try {
        (navigator as any).mediaSession.setActionHandler('seekbackward', () => {
          this.showWarning('Cette action est désactivée pendant le quiz.');
        });
        (navigator as any).mediaSession.setActionHandler('seekforward', () => {
          this.showWarning('Cette action est désactivée pendant le quiz.');
        });
      } catch (e) {
        console.log('Media Session API not fully supported');
      }
    }

    // Bloquer les événements clavier liés au volume (certains navigateurs)
    const volumeKeys = ['VolumeUp', 'VolumeDown', 'VolumeMute', 'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute'];

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (volumeKeys.includes(e.key) || volumeKeys.includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
        this.showWarning('Les contrôles de volume sont désactivés pendant le quiz.');
      }
    }, true);

    // Pour les appareils Android avec Cordova
    if ((window as any).cordova) {
      document.addEventListener('volumeupbutton', (e) => {
        e.preventDefault();
        this.showWarning('Bouton de volume désactivé.');
      }, false);

      document.addEventListener('volumedownbutton', (e) => {
        e.preventDefault();
        this.showWarning('Bouton de volume désactivé.');
      }, false);
    }

    console.log('✅ Boutons de volume bloqués pour la protection anti-screenshot');
  }
}
