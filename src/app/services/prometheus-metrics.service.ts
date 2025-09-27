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

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSession();
    }
  }

  initialize(config: PrometheusConfig) {
    this.config = config;
    this.userId = this.getOrCreateUserId();
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
    
    // Send immediately for counters
    this.sendMetric(name, 'counter', current + 1, labels);
  }

  private setGauge(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.createMetricKey(name, labels);
    this.metricsBuffer.set(key, value);
    
    // Send immediately for gauges
    this.sendMetric(name, 'gauge', value, labels);
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

    const payload = this.formatPrometheusMetric(metricData);
    
    const response = await fetch(`${this.config.endpoint}/metrics/job/${this.config.job}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: payload
    });

    if (!response.ok) {
      throw new Error(`Prometheus push failed: ${response.status}`);
    }
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

  // Batch send all buffered metrics
  async flushMetrics() {
    if (this.metricsBuffer.size === 0) return;

    const metrics = Array.from(this.metricsBuffer.entries()).map(([key, value]) => {
      // Parse the key back to name and labels
      const [name, labelsString] = key.includes('{') ? key.split('{') : [key, ''];
      const labels = this.parseLabels(labelsString);
      return { name, value, labels };
    });

    try {
      await Promise.all(
        metrics.map(metric => 
          this.sendMetric(metric.name, 'gauge', metric.value, metric.labels)
        )
      );
      this.metricsBuffer.clear();
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
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
}
