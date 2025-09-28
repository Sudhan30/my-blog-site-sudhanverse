import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface PrometheusConfig {
  endpoint: string; // Your Prometheus Pushgateway URL
  job: string; // Job name for your blog
  instance?: string; // Instance identifier
}

@Injectable({
  providedIn: 'root'
})
export class PrometheusMetricsService {
  private platformId = inject(PLATFORM_ID);
  private config: PrometheusConfig | null = null;
  private metricsBuffer: Map<string, number> = new Map();
  private sessionId: string = '';
  private userId: string = '';
  private batchTimer: any;
  private readonly BATCH_INTERVAL = 60000; // 1 minute

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSession();
    }
  }

  initialize(config: PrometheusConfig) {
    this.config = config;
    this.userId = this.getOrCreateUserId();
    this.startBatchProcessing();
    this.setupPageUnloadHandler();
  }

  private setupPageUnloadHandler() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Flush metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  private startBatchProcessing() {
    // Send batched metrics every minute
    this.batchTimer = setInterval(() => {
      this.flushMetrics();
    }, this.BATCH_INTERVAL);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.size === 0) return;

    const metrics = Array.from(this.metricsBuffer.entries()).map(([name, value]) => ({
      name,
      type: 'counter',
      value,
      labels: {
        job: this.config?.job || 'blog-frontend',
        instance: this.config?.instance || window.location.hostname,
        session_id: this.sessionId,
        user_id: this.userId
      }
    }));

    try {
      console.log('🔧 Sending batched Prometheus metrics:', metrics.length);
      await this.sendToPrometheus(metrics);
      this.metricsBuffer.clear();
      console.log('✅ Prometheus metrics sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Prometheus metrics:', error);
    }
  }

  private initializeSession() {
    this.sessionId = this.generateSessionId();
    
    // Track session start
    this.incrementCounter('blog_sessions_total');
    
    // Track page load
    this.trackPageLoad();
    
    // Track user engagement - initialize basic engagement metrics
    this.incrementCounter('blog_user_engagement_total');
  }

  private getOrCreateUserId(): string {
    if (isPlatformBrowser(this.platformId)) {
      let userId = localStorage.getItem('blog_user_id');
      if (!userId) {
        userId = this.generateUserId();
        localStorage.setItem('blog_user_id', userId);
      }
      return userId;
    }
    return 'anonymous';
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Page tracking
  trackPageLoad(page: string = window.location.pathname) {
    this.incrementCounter('blog_page_views_total', { page });
    this.setGauge('blog_page_load_time_seconds', this.getPageLoadTime(), { page });
  }

  private getPageLoadTime(): number {
    if (isPlatformBrowser(this.platformId) && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
    }
    return 0;
  }

  // User interaction tracking
  trackClick(element: string, page?: string) {
    this.incrementCounter('blog_clicks_total', { element, page: page || window.location.pathname });
  }

  trackScroll(depth: number, page?: string) {
    this.setGauge('blog_scroll_depth_percent', depth, { page: page || window.location.pathname });
  }

  trackTimeOnPage(timeInSeconds: number, page?: string) {
    this.setGauge('blog_time_on_page_seconds', timeInSeconds, { page: page || window.location.pathname });
  }

  // Form interactions
  trackFormSubmission(formName: string, success: boolean) {
    this.incrementCounter('blog_form_submissions_total', { 
      form: formName, 
      status: success ? 'success' : 'error' 
    });
  }

  trackFormFieldInteraction(formName: string, fieldName: string) {
    this.incrementCounter('blog_form_interactions_total', { form: formName, field: fieldName });
  }

  // Content engagement
  trackContentInteraction(contentType: string, action: string, contentId?: string) {
    this.incrementCounter('blog_content_interactions_total', { 
      type: contentType, 
      action,
      content_id: contentId || 'unknown'
    });
  }

  trackReadingProgress(progress: number, postId?: string) {
    this.setGauge('blog_reading_progress_percent', progress, { post_id: postId || 'unknown' });
  }

  // Performance metrics
  trackPerformanceMetric(metricName: string, value: number, labels?: Record<string, string>) {
    this.setGauge(`blog_performance_${metricName}`, value, labels);
  }

  trackError(errorType: string, errorMessage: string, page?: string) {
    this.incrementCounter('blog_errors_total', { 
      type: errorType, 
      page: page || window.location.pathname 
    });
    console.error(`Blog Error [${errorType}]:`, errorMessage);
  }

  // Analytics consent tracking
  trackAnalyticsConsent(accepted: boolean) {
    this.incrementCounter('blog_analytics_consent_total', { 
      status: accepted ? 'accepted' : 'declined' 
    });
  }

  // Feedback tracking
  trackFeedbackSubmission(rating: number, hasText: boolean) {
    this.incrementCounter('blog_feedback_submissions_total', { 
      rating: rating.toString(),
      has_text: hasText ? 'true' : 'false'
    });
  }

  // Comment tracking
  trackCommentSubmission(success: boolean) {
    this.incrementCounter('blog_comment_submissions_total', { 
      status: success ? 'success' : 'error' 
    });
  }

  // Core metric methods
  private incrementCounter(name: string, labels: Record<string, string> = {}) {
    const key = this.createMetricKey(name, labels);
    const current = this.metricsBuffer.get(key) || 0;
    this.metricsBuffer.set(key, current + 1);
    
    // Don't send immediately - let batch processing handle it
    console.log('🔧 Buffered metric:', name, 'value:', current + 1);
  }

  private setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.createMetricKey(name, labels);
    this.metricsBuffer.set(key, value);
    
    // Don't send immediately - let batch processing handle it
    console.log('🔧 Buffered gauge:', name, 'value:', value);
  }

  private createMetricKey(name: string, labels: Record<string, string>): string {
    const labelString = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelString ? `${name}{${labelString}}` : name;
  }

  private async sendMetric(
    name: string, 
    type: 'counter' | 'gauge', 
    value: number, 
    labels: Record<string, string> = {}
  ) {
    if (!this.config || !isPlatformBrowser(this.platformId)) return;

    try {
      const metricData = {
        name,
        type,
        value,
        labels: {
          ...labels,
          instance: this.config.instance || window.location.hostname,
          session_id: this.sessionId,
          user_id: this.userId,
          timestamp: Date.now()
        }
      };

      // Send to your Prometheus Pushgateway
      await this.sendToPrometheus(metricData);
    } catch (error) {
      console.error('Failed to send metric to Prometheus:', error);
    }
  }

  private async sendToPrometheus(metricData: any) {
    if (!this.config) return;

    // Send metrics to backend API instead of direct Prometheus
    const backendUrl = `${this.config.endpoint}/prometheus`;
    console.log('🔧 Sending metrics to backend API:', backendUrl);
    console.log('🔧 Metric data:', metricData);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job: this.config.job,
        instance: this.config.instance,
        metrics: [metricData]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend metrics API failed:', response.status, response.statusText);
      console.error('❌ Error response:', errorText);
      
      // Don't throw error, just log and continue
      console.log('⚠️ Prometheus metrics disabled - continuing with analytics only');
      return;
    }
    
    console.log('✅ Metrics sent to backend API successfully');
  }

  private formatPrometheusMetric(data: any): string {
    const { name, type, value, labels } = data;
    
    const labelString = Object.entries(labels)
      .map(([k, v]) => `${k}="${String(v)}"`)
      .join(',');
    
    const labelsFormatted = labelString ? `{${labelString}}` : '';
    const timestamp = Date.now();
    
    return `${name}${labelsFormatted} ${value} ${timestamp}`;
  }


  private parseLabels(labelsString: string): Record<string, string> {
    if (!labelsString) return {};
    
    const labels: Record<string, string> = {};
    const regex = /(\w+)="([^"]+)"/g;
    let match;
    
    while ((match = regex.exec(labelsString)) !== null) {
      labels[match[1]] = match[2];
    }
    
    return labels;
  }

  // Get current metrics for debugging
  getCurrentMetrics() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      bufferedMetrics: Object.fromEntries(this.metricsBuffer)
    };
  }

  // Test Pushgateway connection
  async testPushgatewayConnection() {
    if (!this.config) {
      console.error('❌ Prometheus config not initialized');
      return false;
    }

    try {
      const testUrl = `${this.config.endpoint}/prometheus`;
      console.log('🔧 Testing backend metrics API connection to:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job: this.config.job,
          instance: this.config.instance,
          metrics: [{
            name: 'blog_test_connection',
            type: 'counter',
            value: 1,
            labels: { test: 'connection' }
          }]
        })
      });

      if (response.ok) {
        console.log('✅ Backend metrics API connection successful');
        return true;
      } else {
        console.error('❌ Backend metrics API connection failed:', response.status, response.statusText);
        if (response.status === 503) {
          console.log('⚠️ Prometheus endpoint not available - metrics will be disabled');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Backend metrics API connection error:', error);
      return false;
    }
  }
}
