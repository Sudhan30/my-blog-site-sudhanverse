import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { UnifiedAnalyticsService, DashboardData } from '../services/unified-analytics.service';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  template: `
    <div class="analytics-dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-title">
          <mat-icon>analytics</mat-icon>
          Blog Analytics Dashboard
        </h2>
        <button 
          mat-button 
          color="primary"
          (click)="refreshData()"
          [disabled]="isLoading">
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading analytics data...</p>
      </div>

      <div *ngIf="!isLoading && dashboardData" class="dashboard-content">
        <!-- Key Metrics Row -->
        <div class="metrics-row">
          <div class="metric-card">
            <div class="metric-icon">
              <mat-icon>visibility</mat-icon>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ dashboardData.total_page_views | number }}</h3>
              <p class="metric-label">Total Page Views</p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ dashboardData.total_sessions | number }}</h3>
              <p class="metric-label">Total Sessions</p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ dashboardData.bounce_rate | percent:'1.1-1' }}</h3>
              <p class="metric-label">Bounce Rate</p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="metric-content">
              <h3 class="metric-value">{{ formatDuration(dashboardData.average_session_duration) }}</h3>
              <p class="metric-label">Avg Session Duration</p>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Top Pages -->
          <div class="chart-card">
            <h3 class="chart-title">
              <mat-icon>web</mat-icon>
              Top Pages
            </h3>
            <div class="chart-content">
              <div *ngFor="let page of dashboardData.top_pages" class="page-item">
                <div class="page-info">
                  <span class="page-url">{{ page.page }}</span>
                  <span class="page-views">{{ page.views | number }} views</span>
                </div>
                <div class="page-bar">
                  <div 
                    class="page-bar-fill" 
                    [style.width.%]="getPageBarWidth(page.views)">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Device Breakdown -->
          <div class="chart-card">
            <h3 class="chart-title">
              <mat-icon>devices</mat-icon>
              Device Breakdown
            </h3>
            <div class="chart-content">
              <div *ngFor="let device of getDeviceBreakdown()" class="device-item">
                <div class="device-info">
                  <span class="device-type">{{ device.type }}</span>
                  <span class="device-count">{{ device.count | number }} ({{ device.percentage | percent:'1.1-1' }})</span>
                </div>
                <div class="device-bar">
                  <div 
                    class="device-bar-fill" 
                    [style.width.%]="device.percentage * 100">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly Traffic -->
        <div class="traffic-card">
          <h3 class="chart-title">
            <mat-icon>timeline</mat-icon>
            Hourly Traffic (Last 24 Hours)
          </h3>
          <div class="traffic-chart">
            <div *ngFor="let hour of dashboardData.hourly_traffic" class="traffic-bar-container">
              <div 
                class="traffic-bar" 
                [style.height.%]="getTrafficBarHeight(hour.views)">
                <span class="traffic-value">{{ hour.views }}</span>
              </div>
              <span class="traffic-hour">{{ hour.hour }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !dashboardData" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Unable to load analytics data</h3>
        <p>Please check your API connection and try again.</p>
        <button mat-raised-button color="primary" (click)="refreshData()">
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 24px;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #161616;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .dashboard-title mat-icon {
      color: #3b82f6;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .loading-container p {
      margin-top: 16px;
      color: #6b7280;
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 12px;
      color: white;
    }

    .metric-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .metric-content {
      flex: 1;
    }

    .metric-value {
      margin: 0 0 4px 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: #161616;
    }

    .metric-label {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chart-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 20px 24px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      color: #161616;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .chart-title mat-icon {
      color: #3b82f6;
    }

    .chart-content {
      padding: 24px;
    }

    .page-item, .device-item {
      margin-bottom: 16px;
    }

    .page-item:last-child, .device-item:last-child {
      margin-bottom: 0;
    }

    .page-info, .device-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .page-url, .device-type {
      font-weight: 500;
      color: #161616;
    }

    .page-views, .device-count {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .page-bar, .device-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .page-bar-fill, .device-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .traffic-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .traffic-chart {
      display: flex;
      align-items: end;
      gap: 4px;
      padding: 24px;
      height: 200px;
    }

    .traffic-bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .traffic-bar {
      width: 100%;
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s ease;
      min-height: 20px;
    }

    .traffic-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .traffic-hour {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #dc2626;
      margin-bottom: 16px;
    }

    .error-container h3 {
      margin: 0 0 8px 0;
      color: #161616;
    }

    .error-container p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .analytics-dashboard {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .metrics-row {
        grid-template-columns: 1fr;
      }

      .charts-row {
        grid-template-columns: 1fr;
      }

      .traffic-chart {
        height: 150px;
        padding: 16px;
      }

      .traffic-value {
        font-size: 0.625rem;
      }
    }
  `]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  dashboardData: DashboardData | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private unifiedAnalytics: UnifiedAnalyticsService) {}

  ngOnInit() {
    this.loadDashboardData();
    
    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadDashboardData() {
    this.isLoading = true;
    try {
      this.dashboardData = await this.unifiedAnalytics.getDashboardData();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.dashboardData = null;
    } finally {
      this.isLoading = false;
    }
  }

  refreshData() {
    this.loadDashboardData();
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  getPageBarWidth(views: number): number {
    if (!this.dashboardData || this.dashboardData.top_pages.length === 0) return 0;
    const maxViews = Math.max(...this.dashboardData.top_pages.map(p => p.views));
    return (views / maxViews) * 100;
  }

  getDeviceBreakdown(): Array<{ type: string; count: number; percentage: number }> {
    if (!this.dashboardData) return [];
    
    const total = Object.values(this.dashboardData.device_breakdown).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Object.entries(this.dashboardData.device_breakdown).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: count / total
    }));
  }

  getTrafficBarHeight(views: number): number {
    if (!this.dashboardData || this.dashboardData.hourly_traffic.length === 0) return 20;
    const maxViews = Math.max(...this.dashboardData.hourly_traffic.map(h => h.views));
    if (maxViews === 0) return 20;
    return Math.max((views / maxViews) * 100, 20);
  }
}
