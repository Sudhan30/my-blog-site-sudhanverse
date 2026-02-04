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
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullTitle}</title>
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="${description}">
  <meta name="author" content="Sudharsana">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${fullTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="${SITE_NAME}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ""}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${fullTitle}">
  <meta name="twitter:description" content="${description}">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  
  <!-- Styles -->
  <link rel="stylesheet" href="/styles/main.css?v=2026020417">
  
  <!-- Favicon -->
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
        <a href="https://github.com/sudharsanarajasekaran" target="_blank" rel="noopener" class="nav-link">GitHub</a>
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
  </script>
</body>
</html>`;
}
