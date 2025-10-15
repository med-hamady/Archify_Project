import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PaymentWithDetails {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  provider: string;
  providerRef: string;
  phoneNumber: string;
  amountCents: number;
  currency: string;
  screenshotUrl?: string;
  adminNotes?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-payments-container">
      <div class="admin-header">
        <button (click)="goBack()" class="back-button">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Retour au tableau de bord
        </button>
        <h1>Gestion des Paiements</h1>
        <p class="subtitle">Validez ou rejetez les paiements manuels soumis par les utilisateurs</p>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-group">
          <label for="statusFilter">Filtrer par statut:</label>
          <select id="statusFilter" [(ngModel)]="statusFilter" (change)="onFilterChange()">
            <option value="">Tous les paiements</option>
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Validés</option>
            <option value="FAILED">Rejetés</option>
          </select>
        </div>

        <div class="stats-summary">
          <div class="stat-item">
            <span class="stat-label">En attente:</span>
            <span class="stat-value pending">{{ getStatusCount('PENDING') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Validés:</span>
            <span class="stat-value completed">{{ getStatusCount('COMPLETED') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Rejetés:</span>
            <span class="stat-value failed">{{ getStatusCount('FAILED') }}</span>
          </div>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner-large"></div>
          <p>Chargement des paiements...</p>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3>Erreur</h3>
          <p>{{ error() }}</p>
          <button (click)="loadPayments()" class="btn-retry">Réessayer</button>
        </div>
      } @else if (payments().length === 0) {
        <div class="empty-state">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3>Aucun paiement trouvé</h3>
          <p>{{ statusFilter ? 'Aucun paiement ne correspond à votre filtre' : 'Aucun paiement n\'a été soumis pour le moment' }}</p>
        </div>
      } @else {
        <div class="payments-table-container">
          <table class="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Plan</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Transaction</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of payments(); track payment.id) {
                <tr [class.highlight-pending]="payment.status === 'PENDING'">
                  <td class="date-cell">{{ formatDate(payment.createdAt) }}</td>
                  <td class="user-cell">
                    <div class="user-info">
                      <strong>{{ payment.user.name }}</strong>
                      <span>{{ payment.user.email }}</span>
                    </div>
                  </td>
                  <td>{{ payment.plan?.name || 'N/A' }}</td>
                  <td class="amount-cell">{{ payment.amountCents / 100 }} {{ payment.currency }}</td>
                  <td>
                    <span class="provider-badge">{{ payment.provider }}</span>
                  </td>
                  <td class="ref-cell">{{ payment.providerRef }}</td>
                  <td>
                    @switch (payment.status) {
                      @case ('PENDING') {
                        <span class="status-badge status-pending">En attente</span>
                      }
                      @case ('COMPLETED') {
                        <span class="status-badge status-completed">Validé</span>
                      }
                      @case ('FAILED') {
                        <span class="status-badge status-failed">Rejeté</span>
                      }
                    }
                  </td>
                  <td class="actions-cell">
                    <button (click)="viewDetails(payment)" class="btn-view" title="Voir les détails">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    @if (payment.status === 'PENDING') {
                      <button (click)="validatePayment(payment)" class="btn-validate" title="Valider">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                      </button>
                      <button (click)="rejectPayment(payment)" class="btn-reject" title="Rejeter">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination() && pagination()!.pages > 1) {
          <div class="pagination">
            <button
              (click)="changePage(pagination()!.page - 1)"
              [disabled]="pagination()!.page === 1"
              class="btn-page">
              Précédent
            </button>
            <span class="page-info">
              Page {{ pagination()!.page }} sur {{ pagination()!.pages }}
            </span>
            <button
              (click)="changePage(pagination()!.page + 1)"
              [disabled]="pagination()!.page === pagination()!.pages"
              class="btn-page">
              Suivant
            </button>
          </div>
        }
      }

      <!-- Payment Details Modal -->
      @if (selectedPayment()) {
        <div class="modal-overlay" (click)="closeDetails()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Détails du Paiement</h2>
              <button (click)="closeDetails()" class="btn-close">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="detail-section">
                <h3>Informations Utilisateur</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Nom:</span>
                    <span class="detail-value">{{ selectedPayment()!.user.name }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{ selectedPayment()!.user.email }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Téléphone:</span>
                    <span class="detail-value">{{ selectedPayment()!.phoneNumber }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Informations Paiement</h3>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">Plan:</span>
                    <span class="detail-value">{{ selectedPayment()!.plan?.name || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Montant:</span>
                    <span class="detail-value">{{ selectedPayment()!.amountCents / 100 }} {{ selectedPayment()!.currency }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Méthode:</span>
                    <span class="detail-value">{{ selectedPayment()!.provider }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">N° Transaction:</span>
                    <span class="detail-value">{{ selectedPayment()!.providerRef }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">{{ formatDate(selectedPayment()!.createdAt) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Statut:</span>
                    <span class="detail-value">{{ selectedPayment()!.status }}</span>
                  </div>
                </div>
              </div>

              @if (selectedPayment()!.screenshotUrl) {
                <div class="detail-section">
                  <h3>Capture d'écran du paiement</h3>
                  @if (isLoadingScreenshot()) {
                    <div class="screenshot-loading">
                      <div class="spinner-large"></div>
                      <p>Chargement de la capture d'écran...</p>
                    </div>
                  } @else if (screenshotBlobUrl()) {
                    <div class="screenshot-container">
                      <img [src]="screenshotBlobUrl()!"
                           alt="Capture d'écran du paiement"
                           class="screenshot-img"
                           (click)="openScreenshotFullscreen(selectedPayment()!.screenshotUrl!)"
                           loading="lazy">
                      <p class="screenshot-hint">Cliquez sur l'image pour l'agrandir</p>
                    </div>
                  } @else {
                    <div class="screenshot-error">
                      <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p>Impossible de charger la capture d'écran</p>
                      <button (click)="loadScreenshotAsBlob(selectedPayment()!.screenshotUrl!)" class="btn-retry-small">Réessayer</button>
                    </div>
                  }
                  <p class="screenshot-url-debug">URL: {{ getFullScreenshotUrl(selectedPayment()!.screenshotUrl!) }}</p>
                </div>
              }

              @if (selectedPayment()!.status === 'PENDING') {
                <div class="detail-section">
                  <h3>Action à effectuer</h3>
                  <div class="admin-notes-input">
                    <label for="adminNotes">Notes administrateur (optionnel):</label>
                    <textarea
                      id="adminNotes"
                      [(ngModel)]="adminNotes"
                      rows="3"
                      placeholder="Ajoutez des notes sur ce paiement..."></textarea>
                  </div>
                  <div class="modal-actions">
                    <button (click)="confirmValidation()" class="btn-modal-validate">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                      Valider le paiement
                    </button>
                    <button (click)="confirmRejection()" class="btn-modal-reject">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                      </svg>
                      Rejeter le paiement
                    </button>
                  </div>
                </div>
              }

              @if (selectedPayment()!.adminNotes) {
                <div class="detail-section">
                  <h3>Notes de l'administrateur</h3>
                  <p class="admin-notes-display">{{ selectedPayment()!.adminNotes }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Fullscreen Screenshot Modal -->
      @if (fullscreenScreenshot() && screenshotBlobUrl()) {
        <div class="fullscreen-modal" (click)="closeFullscreenScreenshot()">
          <button (click)="closeFullscreenScreenshot()" class="btn-close-fullscreen">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          <img [src]="screenshotBlobUrl()!" alt="Screenshot" class="fullscreen-img">
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-payments-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .admin-header {
      max-width: 1400px;
      margin: 0 auto 2rem;
    }

    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: background 0.3s;
      margin-bottom: 1rem;
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .admin-header h1 {
      font-size: 2.5rem;
      color: white;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.1rem;
      margin: 0;
    }

    .filters-card {
      max-width: 1400px;
      margin: 0 auto 2rem;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .filter-group label {
      font-weight: 600;
      color: #374151;
    }

    .filter-group select {
      padding: 0.5rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
    }

    .stats-summary {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .stat-value.pending {
      color: #f59e0b;
    }

    .stat-value.completed {
      color: #10b981;
    }

    .stat-value.failed {
      color: #ef4444;
    }

    .loading,
    .error-card,
    .empty-state {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .spinner-large {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(102, 126, 234, 0.3);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .payments-table-container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow-x: auto;
    }

    .payments-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payments-table thead {
      background: #f9fafb;
    }

    .payments-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    .payments-table td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }

    .payments-table tr:hover {
      background: #f9fafb;
    }

    .highlight-pending {
      background: #fef3c7 !important;
    }

    .date-cell {
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-info strong {
      color: #1f2937;
    }

    .user-info span {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .amount-cell {
      font-weight: 600;
      color: #667eea;
    }

    .provider-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .ref-cell {
      font-family: monospace;
      font-size: 0.875rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }

    .status-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .btn-view,
    .btn-validate,
    .btn-reject {
      padding: 0.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-view {
      background: #e0e7ff;
      color: #4338ca;
    }

    .btn-view:hover {
      background: #c7d2fe;
    }

    .btn-validate {
      background: #d1fae5;
      color: #065f46;
    }

    .btn-validate:hover {
      background: #a7f3d0;
    }

    .btn-reject {
      background: #fee2e2;
      color: #991b1b;
    }

    .btn-reject:hover {
      background: #fecaca;
    }

    .pagination {
      max-width: 1400px;
      margin: 1rem auto 0;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn-page {
      padding: 0.5rem 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }

    .btn-page:hover:not(:disabled) {
      background: #5568d3;
    }

    .btn-page:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    .page-info {
      color: #374151;
      font-weight: 600;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      color: #1f2937;
    }

    .btn-close {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: background 0.3s;
    }

    .btn-close:hover {
      background: #f3f4f6;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .detail-section {
      margin-bottom: 2rem;
    }

    .detail-section h3 {
      color: #374151;
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .detail-value {
      color: #1f2937;
      font-weight: 600;
    }

    .screenshot-img {
      width: 100%;
      max-width: 600px;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .screenshot-img:hover {
      transform: scale(1.02);
    }

    .screenshot-hint {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .screenshot-container {
      position: relative;
    }

    .screenshot-url-debug {
      font-size: 0.75rem;
      color: #9ca3af;
      font-family: monospace;
      margin-top: 0.5rem;
      word-break: break-all;
      padding: 0.5rem;
      background: #f9fafb;
      border-radius: 4px;
    }

    .screenshot-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .screenshot-loading p {
      margin-top: 1rem;
      color: #6b7280;
    }

    .screenshot-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: #fef2f2;
      border-radius: 8px;
      border: 1px solid #fecaca;
    }

    .screenshot-error svg {
      color: #ef4444;
      margin-bottom: 1rem;
    }

    .screenshot-error p {
      color: #991b1b;
      margin-bottom: 1rem;
    }

    .btn-retry-small {
      padding: 0.5rem 1rem;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-retry-small:hover {
      background: #dc2626;
    }

    .admin-notes-input {
      margin-bottom: 1rem;
    }

    .admin-notes-input label {
      display: block;
      color: #374151;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .admin-notes-input textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-modal-validate,
    .btn-modal-reject {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s;
    }

    .btn-modal-validate {
      background: #10b981;
      color: white;
    }

    .btn-modal-validate:hover {
      background: #059669;
    }

    .btn-modal-reject {
      background: #ef4444;
      color: white;
    }

    .btn-modal-reject:hover {
      background: #dc2626;
    }

    .admin-notes-display {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid #667eea;
      color: #374151;
      margin: 0;
    }

    .fullscreen-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 2rem;
    }

    .btn-close-fullscreen {
      position: absolute;
      top: 2rem;
      right: 2rem;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-close-fullscreen:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .fullscreen-img {
      max-width: 90%;
      max-height: 90vh;
      border-radius: 8px;
    }

    .btn-retry {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .btn-retry:hover {
      background: #5568d3;
    }

    @media (max-width: 768px) {
      .admin-payments-container {
        padding: 1rem;
      }

      .admin-header h1 {
        font-size: 1.8rem;
      }

      .filters-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-summary {
        width: 100%;
        justify-content: space-around;
      }

      .payments-table {
        font-size: 0.875rem;
      }

      .payments-table th,
      .payments-table td {
        padding: 0.75rem 0.5rem;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AdminPaymentsComponent implements OnInit {
  private API_URL = environment.apiUrl;

  payments = signal<PaymentWithDetails[]>([]);
  allPayments = signal<PaymentWithDetails[]>([]); // Store all for counting
  isLoading = signal(true);
  error = signal<string | null>(null);
  selectedPayment = signal<PaymentWithDetails | null>(null);
  fullscreenScreenshot = signal<string | null>(null);
  pagination = signal<PaginationInfo | null>(null);
  screenshotBlobUrl = signal<string | null>(null); // Store blob URL for screenshot
  isLoadingScreenshot = signal(false); // Loading state for screenshot

  statusFilter = '';
  currentPage = 1;
  adminNotes = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage,
      limit: 20
    };

    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.http.get<{ payments: PaymentWithDetails[], pagination: PaginationInfo }>(
      `${this.API_URL}/manual-payments`,
      { params }
    ).subscribe({
      next: (response) => {
        this.payments.set(response.payments);
        this.pagination.set(response.pagination);
        this.isLoading.set(false);

        // Load all payments for counting (without pagination)
        this.loadAllPaymentsForStats();
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        this.isLoading.set(false);

        if (err.status === 403) {
          this.error.set('Accès refusé. Vous devez être administrateur.');
        } else {
          this.error.set('Erreur lors du chargement des paiements');
        }
      }
    });
  }

  loadAllPaymentsForStats() {
    this.http.get<{ payments: PaymentWithDetails[] }>(
      `${this.API_URL}/manual-payments`,
      { params: { page: 1, limit: 1000 } }
    ).subscribe({
      next: (response) => {
        this.allPayments.set(response.payments);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  getStatusCount(status: string): number {
    return this.allPayments().filter(p => p.status === status).length;
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadPayments();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadPayments();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewDetails(payment: PaymentWithDetails) {
    this.selectedPayment.set(payment);
    this.adminNotes = payment.adminNotes || '';

    // Load screenshot as blob with credentials
    if (payment.screenshotUrl) {
      this.loadScreenshotAsBlob(payment.screenshotUrl);
    }
  }

  loadScreenshotAsBlob(url: string) {
    // Cleanup previous blob URL if exists
    if (this.screenshotBlobUrl()) {
      URL.revokeObjectURL(this.screenshotBlobUrl()!);
      this.screenshotBlobUrl.set(null);
    }

    this.isLoadingScreenshot.set(true);
    const fullUrl = this.getFullScreenshotUrl(url);

    console.log('📸 Loading screenshot as blob:', fullUrl);

    this.http.get(fullUrl, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob) => {
        console.log('✅ Screenshot blob loaded successfully');
        const blobUrl = URL.createObjectURL(blob);
        this.screenshotBlobUrl.set(blobUrl);
        this.isLoadingScreenshot.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load screenshot blob:', err);
        this.isLoadingScreenshot.set(false);
        this.screenshotBlobUrl.set(null);
      }
    });
  }

  closeDetails() {
    // Cleanup blob URL
    if (this.screenshotBlobUrl()) {
      URL.revokeObjectURL(this.screenshotBlobUrl()!);
      this.screenshotBlobUrl.set(null);
    }
    this.selectedPayment.set(null);
    this.adminNotes = '';
  }

  validatePayment(payment: PaymentWithDetails) {
    this.selectedPayment.set(payment);
    this.adminNotes = '';
  }

  rejectPayment(payment: PaymentWithDetails) {
    this.selectedPayment.set(payment);
    this.adminNotes = '';
  }

  confirmValidation() {
    if (!this.selectedPayment()) return;

    const confirmed = confirm('Voulez-vous vraiment valider ce paiement et activer l\'abonnement ?');
    if (!confirmed) return;

    this.http.put(
      `${this.API_URL}/manual-payments/${this.selectedPayment()!.id}/validate`,
      { adminNotes: this.adminNotes }
    ).subscribe({
      next: (response) => {
        alert('Paiement validé avec succès! L\'abonnement a été activé.');
        this.closeDetails();
        this.loadPayments();
      },
      error: (err) => {
        console.error('Error validating payment:', err);
        alert('Erreur lors de la validation du paiement');
      }
    });
  }

  confirmRejection() {
    if (!this.selectedPayment()) return;

    const confirmed = confirm('Voulez-vous vraiment rejeter ce paiement ?');
    if (!confirmed) return;

    if (!this.adminNotes.trim()) {
      alert('Veuillez ajouter une note expliquant le rejet');
      return;
    }

    this.http.put(
      `${this.API_URL}/manual-payments/${this.selectedPayment()!.id}/reject`,
      { adminNotes: this.adminNotes }
    ).subscribe({
      next: (response) => {
        alert('Paiement rejeté.');
        this.closeDetails();
        this.loadPayments();
      },
      error: (err) => {
        console.error('Error rejecting payment:', err);
        alert('Erreur lors du rejet du paiement');
      }
    });
  }

  openScreenshotFullscreen(url: string) {
    this.fullscreenScreenshot.set(url);
  }

  closeFullscreenScreenshot() {
    this.fullscreenScreenshot.set(null);
  }

  getFullScreenshotUrl(url: string): string {
    // Si l'URL commence par /uploads, c'est déjà une URL relative valide
    if (url.startsWith('/uploads')) {
      // Construire l'URL complète : http://localhost:3000/uploads/...
      const baseUrl = this.API_URL.replace('/api', ''); // http://localhost:3000
      return `${baseUrl}${url}`;
    }
    // Si l'URL commence par /api, retirer /api
    if (url.startsWith('/api')) {
      const cleanUrl = url.substring(4);
      return `${this.API_URL.replace('/api', '')}${cleanUrl}`;
    }
    // Sinon, retourner l'URL telle quelle
    return url;
  }

  goBack() {
    this.router.navigate(['/admin']);
  }
}
