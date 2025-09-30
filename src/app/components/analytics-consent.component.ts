import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { UnifiedAnalyticsService } from '../services/unified-analytics.service';

@Component({
  selector: 'app-analytics-consent',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div *ngIf="showBanner" class="analytics-banner">
      <div class="banner-content">
        <div class="banner-icon">
          <mat-icon>analytics</mat-icon>
        </div>
        
        <div class="banner-text">
          <h3 class="banner-title">Privacy & Analytics</h3>
          <p class="banner-description">
            We use analytics to improve your experience. We collect anonymous usage data to understand how visitors interact with our portfolio. This helps us improve the user experience and identify areas for enhancement.
          </p>
        </div>
        
        <div class="banner-actions">
          <button 
            class="decline-button"
            (click)="declineAnalytics()"
            mat-button>
            Decline
          </button>
          <button 
            class="accept-button"
            (click)="acceptAnalytics()"
            mat-raised-button
            color="primary">
            Accept Analytics
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 10000;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-top: 3px solid #ff0000; /* Temporary red border for debugging */
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
      padding: 20px;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .banner-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .banner-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 12px;
      color: white;
    }

    .banner-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .banner-text {
      flex: 1;
      min-width: 0;
    }

    .banner-title {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #111827;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .banner-description {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #6b7280;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .banner-actions {
      flex-shrink: 0;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .accept-button {
      min-width: 140px;
      font-weight: 500;
    }

    .decline-button {
      color: #6b7280;
      font-weight: 500;
    }

    .decline-button:hover {
      color: #374151;
      background-color: #f3f4f6;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .analytics-banner {
        padding: 16px;
      }

      .banner-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .banner-actions {
        width: 100%;
        justify-content: center;
      }

      .accept-button, .decline-button {
        flex: 1;
        max-width: 140px;
      }

      .banner-icon {
        width: 40px;
        height: 40px;
      }

      .banner-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .banner-title {
        font-size: 1rem;
      }

      .banner-description {
        font-size: 0.85rem;
      }
    }

    @media (max-width: 480px) {
      .analytics-banner {
        padding: 12px;
      }

      .banner-content {
        gap: 12px;
      }

      .banner-actions {
        flex-direction: column;
        gap: 8px;
      }

      .accept-button, .decline-button {
        width: 100%;
        max-width: none;
      }
    }
  `]
})
export class AnalyticsConsentComponent implements OnInit, OnDestroy {
  showBanner = false;
  private platformId = inject(PLATFORM_ID);
  private unifiedAnalytics = inject(UnifiedAnalyticsService);

  ngOnInit() {
    console.log('AnalyticsConsentComponent initialized');
    if (isPlatformBrowser(this.platformId)) {
      this.checkAnalyticsConsent();
    }
  }

  private checkAnalyticsConsent() {
    const consent = localStorage.getItem('analytics_consent');
    console.log('Analytics consent check:', consent);
    if (consent === null) {
      // No decision made yet, show banner
      console.log('No consent found, showing banner');
      this.showBanner = true;
    } else {
      // Decision already made, load analytics if accepted
      console.log('Consent found:', consent);
      if (consent === 'accepted') {
        this.loadAnalytics();
      }
    }
  }

  async acceptAnalytics() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('analytics_consent', 'accepted');
      this.showBanner = false;
      
      console.log('Analytics consent accepted, initializing tracking...');
      
      try {
        // The UnifiedAnalyticsService will automatically initialize when consent is accepted
        // It handles both the backend API calls and Prometheus metrics
        await this.unifiedAnalytics.initialize();
      } catch (error) {
        console.error('Error initializing analytics after consent:', error);
        // Continue without analytics if initialization fails
      }
    }
  }

  declineAnalytics() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('analytics_consent', 'declined');
      this.showBanner = false;
    }
  }

  private async loadAnalytics() {
    console.log('Loading analytics for existing consent...');
    try {
      // The UnifiedAnalyticsService will automatically initialize when consent is accepted
      // It handles both the backend API calls and Prometheus metrics
      await this.unifiedAnalytics.initialize();
    } catch (error) {
      console.error('Error initializing analytics:', error);
      // Continue without analytics if initialization fails
    }
  }

  ngOnDestroy() {
    // Component cleanup if needed
  }

  private initializePrometheus() {
    // This method is now handled by UnifiedAnalyticsService
    // It automatically initializes both backend API tracking and Prometheus metrics
  }
}
