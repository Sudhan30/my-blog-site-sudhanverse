import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AnalyticsConfig {
  provider: 'umami' | 'google-analytics' | 'plausible' | 'matomo';
  websiteId?: string;
  measurementId?: string;
  domain?: string;
  endpoint?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private isLoaded = false;
  private config: AnalyticsConfig | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkConsentAndLoad();
    }
  }

  private checkConsentAndLoad() {
    const consent = localStorage.getItem('analytics_consent');
    if (consent === 'accepted') {
      this.loadAnalytics();
    }
  }

  initialize(config: AnalyticsConfig) {
    this.config = config;
    if (isPlatformBrowser(this.platformId)) {
      const consent = localStorage.getItem('analytics_consent');
      if (consent === 'accepted') {
        this.loadAnalytics();
      }
    }
  }

  private loadAnalytics() {
    if (this.isLoaded || !this.config) return;

    switch (this.config.provider) {
      case 'umami':
        this.loadUmami();
        break;
      case 'google-analytics':
        this.loadGoogleAnalytics();
        break;
      case 'plausible':
        this.loadPlausible();
        break;
      case 'matomo':
        this.loadMatomo();
        break;
    }

    this.isLoaded = true;
    console.log(`📊 Analytics loaded: ${this.config.provider}`);
  }

  private loadUmami() {
    if (!this.config?.websiteId || !this.config?.endpoint) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `${this.config.endpoint}/script.js`;
    script.setAttribute('data-website-id', this.config.websiteId);
    document.head.appendChild(script);
  }

  private loadGoogleAnalytics() {
    if (!this.config?.measurementId) return;

    // Load gtag script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${this.config.measurementId}', {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
      });
    `;
    document.head.appendChild(script2);
  }

  private loadPlausible() {
    if (!this.config?.domain) return;

    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://plausible.io/js/script.js';
    script.setAttribute('data-domain', this.config.domain);
    document.head.appendChild(script);
  }

  private loadMatomo() {
    if (!this.config?.endpoint || !this.config?.websiteId) return;

    const script = document.createElement('script');
    script.async = true;
    script.innerHTML = `
      var _paq = window._paq = window._paq || [];
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="${this.config.endpoint}/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', '${this.config.websiteId}']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
    `;
    document.head.appendChild(script);
  }

  // Event tracking methods
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.isLoaded || !isPlatformBrowser(this.platformId)) return;

    switch (this.config?.provider) {
      case 'umami':
        this.trackUmamiEvent(eventName, properties);
        break;
      case 'google-analytics':
        this.trackGAEvent(eventName, properties);
        break;
      case 'plausible':
        this.trackPlausibleEvent(eventName, properties);
        break;
      case 'matomo':
        this.trackMatomoEvent(eventName, properties);
        break;
    }
  }

  private trackUmamiEvent(eventName: string, properties?: Record<string, any>) {
    // Umami tracks events via their script automatically
    // For custom events, you'd need to use their event tracking API
    console.log(`📊 Umami event: ${eventName}`, properties);
  }

  private trackGAEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
  }

  private trackPlausibleEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof plausible !== 'undefined') {
      plausible(eventName, { props: properties });
    }
  }

  private trackMatomoEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof _paq !== 'undefined') {
      _paq.push(['trackEvent', eventName, JSON.stringify(properties)]);
    }
  }

  trackPageView(pageName?: string) {
    if (!this.isLoaded || !isPlatformBrowser(this.platformId)) return;

    switch (this.config?.provider) {
      case 'google-analytics':
        if (typeof gtag !== 'undefined') {
          gtag('config', this.config.measurementId!, {
            page_title: pageName || document.title,
            page_location: window.location.href
          });
        }
        break;
      case 'matomo':
        if (typeof _paq !== 'undefined') {
          _paq.push(['setDocumentTitle', pageName || document.title]);
          _paq.push(['trackPageView']);
        }
        break;
    }
  }
}

// Global type declarations for analytics scripts
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, any> }) => void;
    _paq?: any[];
  }
}
