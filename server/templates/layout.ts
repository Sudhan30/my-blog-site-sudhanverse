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
  const { title, description, url, content, ogType = "website", ogImage } = options;
  const fullTitle = title === "Home" ? `Resolving Dependencies, One Idea at a Time. | ${SITE_NAME}` : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url.startsWith("http") ? url : `${SITE_URL}${url}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>

  <!-- Theme Script (runs immediately to prevent flash) -->
  <script>
    (function() {
      const savedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = savedTheme || (systemDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/styles/main.css?v=2026020604">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Resolving Dependencies, One Idea at a Time.",
    "description": "${description}",
    "url": "${SITE_URL}",
    "author": {
      "@type": "Person",
      "name": "Sudharsana"
    }
  }
  </script>
</head>
<body>
  <!-- Reading Progress Bar -->
  <div class="reading-progress" id="reading-progress"></div>
  
  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="logo">
        <span class="logo-initials">SR</span>
        <span class="logo-text">Sudharsana</span>
      </a>
      
      <nav class="main-nav" id="main-nav">
        <a href="/" class="nav-link">Home</a>
        <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="nav-link">Portfolio</a>
        <a href="https://github.com/sudhan30" target="_blank" rel="noopener" class="nav-link">GitHub</a>
        <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" class="nav-link">LinkedIn</a>
      </nav>
      
      <div class="header-actions">
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
          <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="main-content">
    ${content}
  </main>
  
  <!-- Feedback Button -->
  <button class="feedback-btn" id="feedback-btn" aria-label="Send Feedback">
    <i class="fas fa-comment-dots"></i>
  </button>
  
  <!-- Feedback Modal -->
  <div class="feedback-modal" id="feedback-modal">
    <div class="feedback-content">
      <button class="feedback-close" id="feedback-close">&times;</button>
      <h3>Send Feedback</h3>
      <p>Have a suggestion or found an issue? Let me know!</p>
      <form class="feedback-form" id="feedback-form">
        <input type="text" name="name" placeholder="Your name (optional)" class="feedback-input">
        <textarea name="message" placeholder="Your feedback..." required class="feedback-textarea"></textarea>
        <button type="submit" class="feedback-submit">Send Feedback</button>
      </form>
      <div id="feedback-message" class="feedback-message"></div>
    </div>
  </div>
  
  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-container">
      <p>&copy; ${new Date().getFullYear()} Sudharsana Rajasekaran. All rights reserved.</p>
    </div>
  </footer>

  <!-- Cookie Consent Banner -->
  <div id="cookie-consent" style="display: none; position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #e2e8f0; padding: 1.5rem; box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3); z-index: 10000; border-top: 2px solid #3b82f6;">
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="flex: 1; min-width: 300px;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: #60a5fa;">🍪 Cookie Consent</h3>
        <p style="margin: 0; font-size: 0.9375rem; line-height: 1.5; color: #cbd5e1;">
          I use Google Analytics to understand how readers engage with my blog. Your data helps me create better content. You can accept or decline analytics tracking.
        </p>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-shrink: 0;">
        <button onclick="acceptCookies()" style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">
          Accept
        </button>
        <button onclick="declineCookies()" style="padding: 0.75rem 1.5rem; background: #475569; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: background 0.2s;">
          Decline
        </button>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script>
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      html.setAttribute('data-theme', savedTheme);
    } else if (systemDark) {
      html.setAttribute('data-theme', 'dark');
    }
    
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
      mobileBtn.classList.toggle('active');
      mainNav.classList.toggle('open');
    });
    
    // Reading Progress
    const progressBar = document.getElementById('reading-progress');
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = progress + '%';
    });
    
    // Feedback Modal
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackForm = document.getElementById('feedback-form');
    
    feedbackBtn.addEventListener('click', () => {
      feedbackModal.classList.add('open');
    });
    
    feedbackClose.addEventListener('click', () => {
      feedbackModal.classList.remove('open');
    });
    
    feedbackModal.addEventListener('click', (e) => {
      if (e.target === feedbackModal) feedbackModal.classList.remove('open');
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
