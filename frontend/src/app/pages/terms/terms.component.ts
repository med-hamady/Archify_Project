import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">Conditions d'utilisation</h1>
          <p class="text-gray-600">Dernière mise à jour : {{ currentDate }}</p>
        </div>

        <!-- Content -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="prose prose-lg max-w-none">
            
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">1. Acceptation des conditions</h2>
            <p class="text-gray-700 mb-6">
              En utilisant la plateforme Archify, vous acceptez d'être lié par ces conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">2. Description du service</h2>
            <p class="text-gray-700 mb-6">
              Archify est une plateforme éducative qui propose des cours, vidéos, documents PDF et archives d'examens 
              pour les étudiants. Notre service inclut des fonctionnalités de protection du contenu pour préserver 
              la propriété intellectuelle.
            </p>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">3. Compte utilisateur</h2>
            <div class="text-gray-700 mb-6 space-y-4">
              <p>• Vous devez fournir des informations exactes et à jour lors de la création de votre compte</p>
              <p>• Vous êtes responsable de la sécurité de votre compte et de votre mot de passe</p>
              <p>• Vous devez nous notifier immédiatement de toute utilisation non autorisée de votre compte</p>
              <p>• Un seul compte par personne est autorisé</p>
            </div>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">4. Utilisation du contenu</h2>
            <div class="text-gray-700 mb-6 space-y-4">
              <p>• Le contenu est protégé par des droits d'auteur et ne peut être reproduit sans autorisation</p>
              <p>• Il est interdit de capturer, enregistrer ou partager le contenu vidéo</p>
              <p>• L'utilisation est strictement personnelle et non commerciale</p>
              <p>• Toute violation des droits d'auteur peut entraîner la suspension du compte</p>
            </div>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">5. Protection du contenu</h2>
            <div class="text-gray-700 mb-6 space-y-4">
              <p>• Des mesures techniques sont en place pour empêcher la capture d'écran et l'enregistrement</p>
              <p>• Le contournement de ces protections est strictement interdit</p>
              <p>• Toute tentative de piratage sera signalée aux autorités compétentes</p>
            </div>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">6. Abonnements et paiements</h2>
            <div class="text-gray-700 mb-6 space-y-4">
              <p>• Les abonnements sont facturés selon les tarifs en vigueur</p>
              <p>• Les paiements sont non remboursables sauf cas exceptionnels</p>
              <p>• Nous nous réservons le droit de modifier les tarifs avec un préavis de 30 jours</p>
              <p>• L'accès peut être suspendu en cas de non-paiement</p>
            </div>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">7. Confidentialité</h2>
            <p class="text-gray-700 mb-6">
              Nous respectons votre vie privée et protégeons vos données personnelles conformément à notre 
              politique de confidentialité. Vos données ne sont jamais partagées avec des tiers sans votre consentement.
            </p>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">8. Limitation de responsabilité</h2>
            <p class="text-gray-700 mb-6">
              Archify ne peut être tenu responsable des dommages indirects, des pertes de données ou des 
              interruptions de service. Notre responsabilité est limitée au montant payé pour le service.
            </p>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">9. Modification des conditions</h2>
            <p class="text-gray-700 mb-6">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications 
              importantes seront communiquées par email ou via la plateforme.
            </p>

            <h2 class="text-2xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p class="text-gray-700 mb-6">
              Pour toute question concernant ces conditions, contactez-nous à : 
              <a href="mailto:support@archify.ma" class="text-blue-600 hover:text-blue-800">support@archify.ma</a>
            </p>

          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button (click)="goBack()" 
                  class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Retour
          </button>
          <button (click)="acceptTerms()" 
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            J'accepte les conditions
          </button>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent {
  currentDate = new Date().toLocaleDateString('fr-FR');

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/auth']);
  }

  acceptTerms() {
    // Store acceptance in localStorage
    localStorage.setItem('termsAccepted', 'true');
    localStorage.setItem('termsAcceptedDate', new Date().toISOString());
    
    // Navigate back to registration
    this.router.navigate(['/auth']);
  }
}
