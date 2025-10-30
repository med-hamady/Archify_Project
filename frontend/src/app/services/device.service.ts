import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor() {}

  /**
   * Génère l'ID unique de l'appareil physique
   * Basé sur les caractéristiques matérielles qui sont identiques
   * peu importe le navigateur utilisé sur le même appareil
   */
  getDeviceId(): string {
    return this.generateHardwareFingerprint();
  }

  /**
   * Génère une empreinte basée sur le matériel de l'appareil
   * Ces informations sont les mêmes sur tous les navigateurs du même appareil
   */
  private generateHardwareFingerprint(): string {
    const components = [
      // Résolution d'écran (caractéristique matérielle)
      screen.width.toString(),
      screen.height.toString(),
      screen.availWidth.toString(),
      screen.availHeight.toString(),

      // Profondeur de couleur (caractéristique GPU)
      screen.colorDepth.toString(),
      screen.pixelDepth.toString(),

      // Fuseau horaire (spécifique à la localisation/configuration système)
      new Date().getTimezoneOffset().toString(),

      // Nombre de processeurs (caractéristique CPU)
      (navigator.hardwareConcurrency || 0).toString(),

      // Langue système (configuration OS)
      navigator.language,

      // Informations plateforme
      navigator.platform,

      // Mémoire de l'appareil (si disponible)
      (navigator as any).deviceMemory?.toString() || 'unknown'
    ];

    // Créer une empreinte unique
    const fingerprint = components.join('|');

    // Hasher pour créer un ID compact et constant
    return this.createHash(fingerprint);
  }

  /**
   * Crée un hash stable de l'empreinte matérielle
   */
  private createHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convertir en base36 pour un ID court et lisible
    const hashStr = Math.abs(hash).toString(36);

    // Ajouter un préfixe pour indiquer que c'est un device ID
    return `device_${hashStr}`;
  }
}
