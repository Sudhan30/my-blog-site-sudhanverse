import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PrometheusMetricsService } from './prometheus-metrics.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AnalyticsEvent {
  type: 'pageview' | 'click' | 'scroll' | 'time_on_page' | 'custom';
  data: {
    url?: string;
    title?: string;
    referrer?: string;
    element?: string;
    coordinates?: { x: number; y: number };
    text?: string;
    scroll_depth?: number;
    duration?: number;
    custom_event?: string;
    custom_data?: Record<string, any>;
  };
}

export interface SessionData {
  session_id: string;
  user_id: string;
  entry_page: string;
  entry_time: Date;
  last_activity: Date;
  page_views: number;
  events_count: number;
  device_type: string;
  browser: string;
  os: string;
}

export interface DashboardData {
  total_page_views: number;
  total_sessions: number;
  bounce_rate: number;
  average_session_duration: number;
  top_pages: Array<{ page: string; views: number }>;
  device_breakdown: Record<string, number>;
  hourly_traffic: Array<{ hour: string; views: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedAnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private prometheusMetrics = inject(PrometheusMetricsService);
  
  private apiBaseUrl = 'https://api.sudharsana.dev/api/analytics'; // Your existing API URL
  private sessionId: string = '';
  private userId: string = '';
  private sessionStartTime: Date = new Date();
  private eventBuffer: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: any;
  
  private sessionSubject = new BehaviorSubject<SessionData | null>(null);
  public session$ = this.sessionSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if analytics consent is accepted
      const consent = localStorage.getItem('analytics_consent');
      if (consent === 'accepted') {
        this.initializeAnalytics();
      }
    }
  }

  initialize() {
    if (!isPlatformBrowser(this.platformId)) return;

    console.log('🔧 UnifiedAnalyticsService: Initializing analytics tracking...');
    console.log('🔧 API Base URL:', this.apiBaseUrl);

    this.initializeAnalytics();
    
    // Initialize Prometheus metrics as well
    this.prometheusMetrics.initialize({
      endpoint: 'https://prometheus.sudharsana.dev',
      job: 'blog-frontend',
      instance: window.location.hostname
    });
    this.prometheusMetrics.trackAnalyticsConsent(true);
    
    console.log('🔧 UnifiedAnalyticsService: Analytics tracking initialized successfully');
  }

  private initializeAnalytics() {
    this.userId = this.getOrCreateUserId();
    this.sessionId = this.generateSessionId();
    this.startSession();
    this.startBatchProcessing();
    this.trackPageView();
    this.setupEventListeners();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('blog_user_id');
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem('blog_user_id', userId);
    }
    return userId;
  }

  private generateSessionId(): string {
    return this.generateUUID();
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async startSession() {
    const sessionData: SessionData = {
      session_id: this.sessionId,
      user_id: this.userId,
      entry_page: window.location.pathname,
      entry_time: this.sessionStartTime,
      last_activity: new Date(),
      page_views: 1,
      events_count: 0,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS()
    };

    try {
      console.log('🔧 Sending session data to:', `${this.apiBaseUrl}/session`);
      console.log('🔧 Session data:', sessionData);
      
      const response = await this.http.post(`${this.apiBaseUrl}/session`, sessionData).toPromise();
      console.log('✅ Session created successfully:', response);
      
      this.sessionSubject.next(sessionData);
    } catch (error) {
      console.error('❌ Failed to start analytics session:', error);
      console.error('❌ Error details:', error);
    }
  }

  private setupEventListeners() {
    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.trackClick(target);
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.trackScrollDepth(scrollDepth);
      }
    });

    // Track time on page
    setInterval(() => {
      const timeOnPage = Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000);
      this.trackTimeOnPage(timeOnPage);
    }, 30000); // Every 30 seconds

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession();
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  private startBatchProcessing() {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private async flushEvents() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      console.log('🔧 Sending analytics events to:', `${this.apiBaseUrl}/track`);
      console.log('🔧 Events being sent:', events);
      
      const response = await this.http.post(`${this.apiBaseUrl}/track`, { events }).toPromise();
      console.log('✅ Analytics events sent successfully:', response);
      
      // Also send to Prometheus for each event
      events.forEach(event => {
        switch (event.type) {
          case 'pageview':
            this.prometheusMetrics.trackPageLoad(event.data.url);
            break;
          case 'click':
            this.prometheusMetrics.trackClick(event.data.element || 'unknown', event.data.url);
            break;
          case 'scroll':
            this.prometheusMetrics.trackScroll(event.data.scroll_depth || 0, event.data.url);
            break;
          case 'time_on_page':
            this.prometheusMetrics.trackTimeOnPage(event.data.duration || 0, event.data.url);
            break;
        }
      });
    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      console.error('❌ Error details:', error);
      // Re-add events to buffer if failed
      this.eventBuffer.unshift(...events);
    }
  }

  // Public tracking methods
  trackPageView(url?: string, title?: string) {
    const event: AnalyticsEvent = {
      type: 'pageview',
      data: {
        url: url || window.location.href,
        title: title || document.title,
        referrer: document.referrer
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackPageLoad(url);
  }

  trackClick(element: HTMLElement, customData?: Record<string, any>) {
    const rect = element.getBoundingClientRect();
    const event: AnalyticsEvent = {
      type: 'click',
      data: {
        element: element.tagName.toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''),
        coordinates: { x: rect.left, y: rect.top },
        text: element.textContent?.substring(0, 100) || '',
        custom_data: customData
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackClick(
      event.data.element || 'unknown',
      window.location.pathname
    );
  }

  trackScrollDepth(depth: number) {
    const event: AnalyticsEvent = {
      type: 'scroll',
      data: {
        scroll_depth: depth
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackScroll(depth, window.location.pathname);
  }

  trackTimeOnPage(duration: number) {
    const event: AnalyticsEvent = {
      type: 'time_on_page',
      data: {
        duration
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackTimeOnPage(duration, window.location.pathname);
  }

  trackCustomEvent(eventName: string, data?: Record<string, any>) {
    const event: AnalyticsEvent = {
      type: 'custom',
      data: {
        custom_event: eventName,
        custom_data: data
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackContentInteraction('custom', eventName);
  }

  // Business-specific tracking methods
  trackFeedbackSubmission(rating: number, hasText: boolean) {
    this.trackCustomEvent('feedback_submission', { rating, has_text: hasText });
    this.prometheusMetrics.trackFeedbackSubmission(rating, hasText);
  }

  trackCommentSubmission(success: boolean) {
    this.trackCustomEvent('comment_submission', { success });
    this.prometheusMetrics.trackCommentSubmission(success);
  }

  trackNewsletterSignup(source?: string) {
    this.trackCustomEvent('newsletter_signup', { source: source || 'unknown' });
    this.prometheusMetrics.trackContentInteraction('newsletter', 'signup', source);
  }

  trackReadingProgress(progress: number, postId?: string) {
    this.trackCustomEvent('reading_progress', { progress, post_id: postId });
    this.prometheusMetrics.trackReadingProgress(progress, postId);
  }

  // Session management
  async updateSession() {
    try {
      await this.http.post(`${this.apiBaseUrl}/session`, {
        session_id: this.sessionId,
        last_activity: new Date(),
        page_views: this.eventBuffer.filter(e => e.type === 'pageview').length + 1,
        events_count: this.eventBuffer.length
      }).toPromise();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  async endSession() {
    try {
      await this.http.post(`${this.apiBaseUrl}/session/end`, {
        session_id: this.sessionId,
        exit_page: window.location.pathname,
        duration: Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000)
      }).toPromise();
      
      // Flush remaining events
      await this.flushEvents();
      
      // Clear timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Dashboard data
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await this.http.get<DashboardData>(`${this.apiBaseUrl}/dashboard`).toPromise();
      return response || this.getDefaultDashboardData();
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return this.getDefaultDashboardData();
    }
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      total_page_views: 0,
      total_sessions: 0,
      bounce_rate: 0,
      average_session_duration: 0,
      top_pages: [],
      device_breakdown: {},
      hourly_traffic: []
    };
  }

  // Utility methods
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }

  // Public getters
  getCurrentSession(): SessionData | null {
    return this.sessionSubject.value;
  }

  getUserId(): string {
    return this.userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Force flush for immediate sending
  async forceFlush() {
    await this.flushEvents();
  }
}
