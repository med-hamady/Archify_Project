import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly DEVICE_ID_KEY = 'archify_device_id';

  constructor() {}

  /**
   * Génère ou récupère l'ID unique de l'appareil
   * Cet ID est stocké dans le localStorage pour persister entre les sessions
   */
  getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);

    if (!deviceId) {
      // Générer un nouveau device ID unique basé sur:
      // - Timestamp
      // - Nombre aléatoire
      // - Informations du navigateur (userAgent)
      deviceId = this.generateDeviceId();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  }

  /**
   * Génère un ID unique pour l'appareil
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const navigatorInfo = this.getNavigatorFingerprint();

    return `${timestamp}-${randomPart}-${navigatorInfo}`;
  }

  /**
   * Crée une empreinte basée sur les informations du navigateur
   * Cela aide à identifier de manière unique l'appareil/navigateur
   */
  private getNavigatorFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Créer une empreinte simple basée sur les capacités du navigateur
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ].join('|');

    // Hasher l'empreinte pour la rendre plus courte
    return this.simpleHash(fingerprint).toString(36);
  }

  /**
   * Hash simple pour créer un identifiant court
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Efface le device ID (pour les tests uniquement)
   */
  clearDeviceId(): void {
    localStorage.removeItem(this.DEVICE_ID_KEY);
  }
}
