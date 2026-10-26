import { icon } from "./icons";
import { esc } from "../lib/escape";

export interface LayoutOptions {
  title: string;
  description: string;
  url: string;
  content: string;
  ogType?: string;
  ogImage?: string;
}

const SITE_NAME = "Sudharsana's Tech Blog";
const SITE_URL = "https://blog.sudharsana.dev";

export function layout(options: LayoutOptions): string {
  const { content } = options;
  const title = esc(options.title);
  const description = esc(options.description);
  const ogType = esc(options.ogType ?? "website");
  const ogImage = options.ogImage ? esc(options.ogImage) : undefined;
  const fullTitle = options.title === "Home" ? `Resolving Dependencies, One Idea at a Time. | ${SITE_NAME}` : `${title} | ${SITE_NAME}`;
  const canonicalUrl = esc(options.url.startsWith("http") ? options.url : `${SITE_URL}${options.url}`);

  // JSON.stringify is not enough in a <script>: "<" would let "</script>" end the block
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Resolving Dependencies, One Idea at a Time.",
    description: options.description,
    url: SITE_URL,
    author: { "@type": "Person", name: "Sudharsana" }
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0B0B0C" media="(prefers-color-scheme: dark)">
  <title>${fullTitle}</title>

  <!-- Theme Script (runs immediately to prevent flash) -->
  <script>
    (function() {
      function applyTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (systemDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      }

      // Apply theme immediately
      applyTheme();

      // Reapply theme when page is restored from bfcache (back/forward navigation)
      window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
          applyTheme();
        }
      });
    })();
  </script>
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="${description}">
  <meta name="author" content="Sudharsana Rajasekaran">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- AI Citation Meta Tags (Generative Engine Optimization) -->
  <meta name="citation_author" content="Sudharsana Rajasekaran">
  <meta name="citation_title" content="${fullTitle}">
  <meta name="citation_journal_title" content="${SITE_NAME}">
  <meta name="DC.creator" content="Sudharsana Rajasekaran">
  <meta name="DC.title" content="${fullTitle}">
  <meta name="DC.publisher" content="${SITE_NAME}">
  <meta name="DC.identifier" content="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${description}">
  ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ""}
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/styles/main.css?v=2026102701">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Structured Data -->
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  <!-- Header -->
  <header class="site-header" id="site-header">
    <div class="header-container">
      <a href="/" class="logo" aria-label="Home">Sudharsana Rajasekaran</a>

      <nav class="main-nav" id="main-nav" aria-label="Primary">
        <a href="/" class="nav-link">Writing</a>
        <a href="/tag/hackathon" class="nav-link">Hackathons</a>
        <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="nav-link">Portfolio</a>
        <a href="https://github.com/sudhan30" target="_blank" rel="noopener" class="nav-link">GitHub</a>
        <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" class="nav-link">LinkedIn</a>
      </nav>

      <div class="header-actions">
        <a href="/rss.xml" class="icon-btn" aria-label="RSS feed" title="RSS feed">${icon("rss")}</a>
        <button class="theme-toggle icon-btn" id="theme-toggle" aria-label="Toggle theme">
          ${icon("sun", { cls: "icon sun-icon" })}
          ${icon("moon", { cls: "icon moon-icon" })}
        </button>
        <button class="mobile-menu-btn icon-btn" id="mobile-menu-btn" aria-label="Toggle menu" aria-expanded="false" aria-controls="main-nav">
          ${icon("menu", { cls: "icon menu-open" })}
          ${icon("x", { cls: "icon menu-close" })}
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content" id="main">
    ${content}
  </main>

  <!-- Feedback Modal -->
  <div class="feedback-modal" id="feedback-modal">
    <div class="feedback-content" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <button class="feedback-close icon-btn" id="feedback-close" aria-label="Close">${icon("x")}</button>
      <h3 id="feedback-title">Send feedback</h3>
      <p>Have a suggestion or found an issue? Let me know.</p>
      <form class="feedback-form" id="feedback-form">
        <input type="text" name="name" placeholder="Your name (optional)" class="feedback-input" aria-label="Your name (optional)">
        <textarea name="message" placeholder="Your feedback..." required class="feedback-textarea" aria-label="Your feedback"></textarea>
        <button type="submit" class="feedback-submit">Send feedback</button>
      </form>
      <div id="feedback-message" class="feedback-message" role="status"></div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-container">
      <p class="footer-copy">&copy; ${new Date().getFullYear()} Sudharsana Rajasekaran</p>
      <nav class="footer-links" aria-label="Footer">
        <a href="/rss.xml">RSS</a>
        <a href="https://github.com/sudhan30" target="_blank" rel="noopener">GitHub</a>
        <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://sudharsana.dev" target="_blank" rel="noopener">Portfolio</a>
        <button type="button" class="link-btn" id="feedback-btn">Send feedback</button>
      </nav>
    </div>
  </footer>

  <!-- Cookie Consent -->
  <div id="cookie-consent" class="cookie-consent" role="region" aria-label="Cookie consent" style="display: none;">
    <p>I use Google Analytics to understand how readers engage with the blog. You can accept or decline analytics tracking.</p>
    <div class="cookie-actions">
      <button onclick="acceptCookies()" class="btn btn-primary">Accept</button>
      <button onclick="declineCookies()" class="btn btn-ghost">Decline</button>
    </div>
  </div>

  <!-- Scripts -->
  <script>
    // Theme Toggle (theme is already applied by inline script in head)
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
    
    // Mobile Menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    mobileBtn.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      mobileBtn.classList.toggle('active', open);
      mobileBtn.setAttribute('aria-expanded', String(open));
    });
    
    // Mark the current nav link
    document.querySelectorAll('.main-nav a[href^="/"]').forEach((a) => {
      const href = a.getAttribute('href');
      const path = window.location.pathname;
      if (href === '/' ? (path === '/' || path.startsWith('/post/')) : path === href) a.setAttribute('aria-current', 'page');
    });

    // Header state on scroll
    const siteHeader = document.getElementById('site-header');
    const onHeaderScroll = () => siteHeader.classList.toggle('scrolled', window.scrollY > 8);
    onHeaderScroll();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });

    // Reading Progress
    const progressBar = document.getElementById('reading-progress');
    
    if (progressBar) {
      const updateProgress = () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
      };
      updateProgress();
      window.addEventListener('scroll', updateProgress, { passive: true });
    }
    
    // Feedback Modal
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackForm = document.getElementById('feedback-form');
    
    feedbackBtn.addEventListener('click', () => {
      feedbackModal.classList.add('open');
      const field = feedbackForm.querySelector('textarea');
      if (field) field.focus();
    });

    const closeFeedback = () => {
      feedbackModal.classList.remove('open');
      feedbackBtn.focus();
    };

    feedbackClose.addEventListener('click', closeFeedback);

    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) closeFeedback();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && feedbackModal.classList.contains('open')) closeFeedback();
    });
    
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('feedback-message');
      const formData = new FormData(feedbackForm);
      
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('name'),
            message: formData.get('message')
          })
        });
        msg.textContent = res.ok ? 'Thanks for your feedback!' : 'Error sending feedback';
        msg.className = 'feedback-message ' + (res.ok ? 'success' : 'error');
        if (res.ok) feedbackForm.reset();
      } catch {
        msg.textContent = 'Error sending feedback';
        msg.className = 'feedback-message error';
      }
    });

    // Cookie Consent & Analytics
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (cookieConsent === null) {
      document.getElementById('cookie-consent').style.display = 'block';
    } else if (cookieConsent === 'accepted') {
      loadGoogleAnalytics();
      initTelemetry();
    }

    function acceptCookies() {
      localStorage.setItem('cookieConsent', 'accepted');
      document.getElementById('cookie-consent').style.display = 'none';
      loadGoogleAnalytics();
      initTelemetry();
    }

    function declineCookies() {
      localStorage.setItem('cookieConsent', 'declined');
      document.getElementById('cookie-consent').style.display = 'none';
    }

    function loadGoogleAnalytics() {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-F2C1BRDZDW';
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-F2C1BRDZDW', {
        'anonymize_ip': true
      });

      console.log('✅ Google Analytics loaded with user consent');
    }

    // In-House Telemetry Service for Blog
    function initTelemetry() {
      const telemetry = {
        userId: localStorage.getItem('blog_user_id') || generateId(),
        sessionId: sessionStorage.getItem('blog_session_id') || generateId(),
        events: [],
        pageLoadTime: Date.now(),

        init() {
          localStorage.setItem('blog_user_id', this.userId);
          sessionStorage.setItem('blog_session_id', this.sessionId);

          // Track page view
          this.trackPageView();

          // Track scroll depth
          let maxScroll = 0;
          window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > maxScroll) {
              maxScroll = Math.round(scrollPercent / 25) * 25;
            }
          });

          // Track time on page and scroll depth on unload
          window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
            this.trackEvent('page_exit', {
              timeOnPage,
              maxScroll,
              url: window.location.pathname
            });
            this.flush();
          });

          // Track link clicks
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
              this.trackEvent('link_click', {
                url: link.href,
                text: link.textContent.trim().substring(0, 50)
              });
            }
          });

          console.log('✅ In-house telemetry initialized with user consent');
        },

        trackPageView() {
          this.trackEvent('page_view', {
            url: window.location.pathname,
            title: document.title,
            referrer: document.referrer
          });
        },

        trackEvent(eventName, data) {
          this.events.push({
            name: eventName,
            timestamp: new Date().toISOString(),
            data: {
              ...data,
              userAgent: navigator.userAgent,
              viewport: { width: window.innerWidth, height: window.innerHeight }
            }
          });

          // Auto-flush if we have 5+ events
          if (this.events.length >= 5) {
            this.flush();
          }
        },

        flush() {
          if (this.events.length === 0) return;

          const data = {
            sessionId: this.sessionId,
            userId: this.userId,
            userAgent: navigator.userAgent,
            viewport: { width: window.innerWidth, height: window.innerHeight },
            events: [...this.events]
          };
          this.events = [];

          // Send to our in-house API endpoint
          const url = '/api/telemetry';

          // Use sendBeacon for reliability on page unload
          if (navigator.sendBeacon) {
            navigator.sendBeacon(url, JSON.stringify(data));
          } else {
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              keepalive: true
            }).catch(err => console.error('Telemetry error:', err));
          }
        }
      };

      telemetry.init();
      window.telemetry = telemetry;
    }

    function generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
  </script>
</body>
</html>`;
}
