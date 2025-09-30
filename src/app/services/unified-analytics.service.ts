import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { PrometheusMetricsService } from './prometheus-metrics.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface AnalyticsEvent {
  type: 'pageview' | 'click' | 'scroll' | 'time_on_page' | 'custom';
  data: {
    url?: string;
    title?: string;
    referrer?: string;
    element?: string;
    element_id?: string | null;
    element_class?: string | null;
    element_text?: string | null;
    element_type?: string | null;
    coordinates?: { x: number; y: number };
    click_x?: number;
    click_y?: number;
    text?: string;
    scroll_depth?: number;
    time_on_page?: number;
    duration?: number;
    viewport_width?: number;
    viewport_height?: number;
    custom_event?: string;
    custom_data?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

export interface SessionData {
  session_id: string;
  uuid: string; // Changed from user_id to uuid to match API
  entry_page: string;
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
  
  private apiBaseUrl = 'https://blog.sudharsana.dev/api/analytics'; // Your existing API URL
  private sessionId: string = '';
  private userId: string = '';
  private sessionStartTime: Date = new Date();
  private eventBuffer: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: any;
  private inactivityTimer: any;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  private sessionSubject = new BehaviorSubject<SessionData | null>(null);
  public session$ = this.sessionSubject.asObservable();

  private router = inject(Router);
  
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if analytics consent is accepted
      const consent = localStorage.getItem('analytics_consent');
      console.log('🔧 Analytics consent status:', consent);
      
      if (consent === 'accepted') {
        console.log('✅ Analytics consent accepted, initializing...');
        this.initializeAnalytics();
      } else {
        console.log('⚠️ Analytics consent not accepted, skipping initialization');
      }
    }
  }

  async initialize() {
    try {
      if (!isPlatformBrowser(this.platformId)) return;

      console.log('🔧 UnifiedAnalyticsService: Initializing analytics tracking...');
      console.log('🔧 API Base URL:', this.apiBaseUrl);

      await this.initializeAnalytics();
      
      // Initialize Prometheus metrics via backend API
      this.prometheusMetrics.initialize({
        endpoint: this.apiBaseUrl, // Use backend API instead of direct Prometheus
        job: 'blog-frontend',
        instance: window.location.hostname
      });
      this.prometheusMetrics.trackAnalyticsConsent(true);
      
      console.log('🔧 Prometheus metrics will be sent via backend API');
      
      console.log('🔧 UnifiedAnalyticsService: Analytics tracking initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing UnifiedAnalyticsService:', error);
      console.log('⚠️ Analytics will be disabled due to initialization failure');
      // Disable analytics completely if initialization fails
      this.disableAnalytics();
    }
  }

  private disableAnalytics() {
    console.log('🔧 Disabling analytics due to initialization failure');
    // Set a flag to prevent further analytics calls
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('analytics_disabled', 'true');
    }
  }

  private async initializeAnalytics() {
    try {
      console.log('🔧 initializeAnalytics called');
      this.userId = this.getOrCreateUserId();
      this.sessionId = this.getOrCreateSessionId();
      await this.startSession();
      this.startBatchProcessing();
      this.trackPageView();
      this.setupEventListeners();
      this.setupInactivityDetection();
    } catch (error) {
      console.error('❌ Error initializing analytics:', error);
      // Continue without analytics if initialization fails
    }
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('blog_user_id');
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem('blog_user_id', userId);
    }
    return userId;
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('blog_session_id');
    let sessionStartTime = localStorage.getItem('blog_session_start_time');
    
    // Check if session exists and is still valid (within 30 minutes)
    if (sessionId && sessionStartTime) {
      const startTime = parseInt(sessionStartTime);
      const currentTime = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      if (currentTime - startTime < thirtyMinutes) {
        // Session is still valid, return existing session ID
        return sessionId;
      } else {
        // Session expired, end the old session and create new one
        this.endSession(sessionId);
        localStorage.removeItem('blog_session_id');
        localStorage.removeItem('blog_session_start_time');
      }
    }
    
    // Create new session
    sessionId = this.generateUUID();
    const startTime = Date.now();
    
    localStorage.setItem('blog_session_id', sessionId);
    localStorage.setItem('blog_session_start_time', startTime.toString());
    
    return sessionId;
  }

  private async endSession(sessionId: string) {
    try {
      const endTime = Date.now();
      const sessionData = {
        session_id: sessionId,
        uuid: this.userId,
        end_time: endTime
      };
      
      console.log('🔧 Ending session:', sessionData);
      await this.http.post(`${this.apiBaseUrl}/session/end`, sessionData).toPromise();
      console.log('✅ Session ended successfully');
      
      // Clear localStorage to allow new session creation
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('analytics_session_data');
      }
    } catch (error) {
      console.error('❌ Failed to end session:', error);
    }
  }

  private setupInactivityDetection() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Reset inactivity timer on user activity
    const resetInactivityTimer = () => {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
      }
      
      this.inactivityTimer = setTimeout(() => {
        console.log('🔧 User inactive for 30 minutes, ending session');
        this.endSession(this.sessionId);
        localStorage.removeItem('blog_session_id');
        localStorage.removeItem('blog_session_start_time');
      }, this.INACTIVITY_TIMEOUT);
    };
    
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Initialize timer
    resetInactivityTimer();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.endSession(this.sessionId);
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async startSession() {
    // Check if this session already exists in localStorage
    const existingSession = localStorage.getItem('analytics_session_data');
    const currentSessionId = this.sessionId;
    
    if (existingSession) {
      const parsedSession = JSON.parse(existingSession);
      if (parsedSession.session_id === currentSessionId) {
        console.log('🔧 Session already exists, skipping creation:', currentSessionId);
        this.sessionSubject.next(parsedSession);
        return;
      }
    }
    
    const sessionData = {
      session_id: this.sessionId,
      uuid: this.userId, // Changed from user_id to uuid to match API
      entry_page: window.location.pathname,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS()
    };

    try {
      console.log('🔧 Creating new session:', `${this.apiBaseUrl}/session`);
      console.log('🔧 Session data:', sessionData);
      
      const response = await this.http.post(`${this.apiBaseUrl}/session`, sessionData).toPromise();
      console.log('✅ Session created successfully:', response);
      
      this.sessionSubject.next(sessionData);
      
      // Store session data locally to prevent duplicate creation
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('analytics_session_data', JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('❌ Failed to start analytics session:', error);
      console.error('❌ Error details:', error);
      
      // Fallback: Store session data locally for now
      console.log('🔄 Storing session data locally as fallback');
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('analytics_session_data', JSON.stringify(sessionData));
      }
      
      this.sessionSubject.next(sessionData);
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

    // Track scroll depth - only fire when user reaches 100% scroll
    let hasReached100Percent = false;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      // Only fire scroll beacon when user reaches 100% scroll depth
      if (scrollDepth >= 100 && !hasReached100Percent) {
        hasReached100Percent = true;
        this.trackScrollDepth(100);
        console.log('🔧 User reached 100% scroll depth - firing scroll beacon');
      }
    });

    // Track time on page only on page unload/navigation
    // No continuous tracking - only when leaving the page

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession(this.sessionId);
      }
    });

    // Track time on page before leaving
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000);
      this.trackTimeOnPage(timeOnPage);
      this.endSession(this.sessionId);
    });
    
    // Track time on page when navigating to other pages (SPA navigation)
    window.addEventListener('popstate', () => {
      const timeOnPage = Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000);
      this.trackTimeOnPage(timeOnPage);
    });
    
    // Track time on page for Angular router navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const timeOnPage = Math.round((Date.now() - this.sessionStartTime.getTime()) / 1000);
        this.trackTimeOnPage(timeOnPage);
        // Reset session start time for new page
        this.sessionStartTime = new Date();
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
      
      // Transform events to match your API format
      console.log('🔧 Current userId:', this.userId);
      console.log('🔧 Current sessionId:', this.sessionId);
      console.log('🔧 Events to send:', events);
      
      const apiEvents = events.map(event => ({
        uuid: this.userId,
        session_id: this.sessionId,
        event_type: event.type,
        page_url: event.data.url || window.location.href,
        page_title: event.data.title || document.title,
        element_id: event.data.element_id || null,
        element_class: event.data.element_class || null,
        element_text: event.data.element_text || null,
        element_type: event.data.element_type || null,
        click_x: event.data.click_x || null,
        click_y: event.data.click_y || null,
        viewport_width: event.data.viewport_width || window.innerWidth,
        viewport_height: event.data.viewport_height || window.innerHeight,
        scroll_depth: event.data.scroll_depth || null,
        time_on_page: event.data.time_on_page || null,
        referrer: event.data.referrer || document.referrer,
        user_agent: navigator.userAgent,
        metadata: JSON.stringify(event.data.metadata || {})
      }));
      
      console.log('🔧 Sending analytics events to API:', apiEvents);
      console.log('🔧 API URL:', `${this.apiBaseUrl}/track`);
      
      // Send events one by one instead of as an array
      for (const event of apiEvents) {
        try {
          console.log('🔧 Sending individual event:', event);
          const response = await this.http.post(`${this.apiBaseUrl}/track`, event).toPromise();
          console.log('✅ Event sent successfully:', response);
        } catch (error) {
          console.error('❌ Failed to send individual event:', error);
          console.error('❌ Event data:', event);
        }
      }
      console.log('✅ All analytics events processed');
      
      // Send metrics to Prometheus via backend API
      events.forEach(event => {
        switch (event.type) {
          case 'pageview':
            this.prometheusMetrics.trackPageLoad(event.data.url);
            break;
          case 'click':
            this.prometheusMetrics.trackClick(event.data.element_type || 'unknown', event.data.url);
            break;
          case 'scroll':
            this.prometheusMetrics.trackScroll(event.data.scroll_depth || 0, event.data.url);
            break;
          case 'time_on_page':
            this.prometheusMetrics.trackTimeOnPage(event.data.time_on_page || 0, event.data.url);
            break;
        }
      });
    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      console.error('❌ Error details:', error);
      
      // Fallback: Store events locally for now
      console.log('🔄 Storing analytics events locally as fallback');
      if (isPlatformBrowser(this.platformId)) {
        const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        const updatedEvents = [...existingEvents, ...events];
        localStorage.setItem('analytics_events', JSON.stringify(updatedEvents));
      }
      
      // Don't re-add to buffer since we're storing locally
    }
  }

  // Public tracking methods
  trackPageView(url?: string, title?: string) {
    const currentUrl = url || window.location.href;
    const currentTitle = title || document.title;
    
    console.log('🔧 trackPageView called for:', currentUrl);
    console.log('🔧 Page title:', currentTitle);
    
    const event: AnalyticsEvent = {
      type: 'pageview',
      data: {
        url: currentUrl,
        title: currentTitle,
        referrer: document.referrer
      }
    };
    
    this.eventBuffer.push(event);
    console.log('✅ Pageview event added to buffer');
    this.prometheusMetrics.trackPageLoad(currentUrl);
  }

  trackClick(element: HTMLElement, customData?: Record<string, any>) {
    const rect = element.getBoundingClientRect();
    const event: AnalyticsEvent = {
      type: 'click',
      data: {
        url: window.location.href,
        title: document.title,
        element_id: element.id || null,
        element_class: element.className || null,
        element_text: element.textContent?.substring(0, 100) || null,
        element_type: element.tagName.toLowerCase(),
        click_x: Math.round(rect.left),
        click_y: Math.round(rect.top),
        viewport_width: Math.round(window.innerWidth),
        viewport_height: Math.round(window.innerHeight),
        referrer: document.referrer,
        metadata: customData
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackClick(
      event.data.element_type || 'unknown',
      window.location.pathname
    );
  }

  trackScrollDepth(depth: number) {
    const event: AnalyticsEvent = {
      type: 'scroll',
      data: {
        url: window.location.href,
        title: document.title,
        scroll_depth: Math.round(depth),
        viewport_width: Math.round(window.innerWidth),
        viewport_height: Math.round(window.innerHeight),
        referrer: document.referrer
      }
    };
    
    this.eventBuffer.push(event);
    this.prometheusMetrics.trackScroll(depth, window.location.pathname);
  }

  trackTimeOnPage(duration: number) {
    const event: AnalyticsEvent = {
      type: 'time_on_page',
      data: {
        url: window.location.href,
        title: document.title,
        time_on_page: Math.round(duration),
        viewport_width: Math.round(window.innerWidth),
        viewport_height: Math.round(window.innerHeight),
        referrer: document.referrer
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

  // Debug method to check stored analytics data
  getStoredAnalyticsData() {
    if (!isPlatformBrowser(this.platformId)) return null;
    
    const sessionData = localStorage.getItem('analytics_session_data');
    const eventsData = localStorage.getItem('analytics_events');
    
    return {
      session: sessionData ? JSON.parse(sessionData) : null,
      events: eventsData ? JSON.parse(eventsData) : null,
      eventsCount: eventsData ? JSON.parse(eventsData).length : 0
    };
  }
}
