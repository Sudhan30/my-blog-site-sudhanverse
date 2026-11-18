// Small behaviours every page needs. Plain DOM code, no framework.

const root = document.documentElement;

// Theme toggle: an explicit choice is remembered; otherwise the system setting wins.
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  (window as {__blogTheme?: string}).__blogTheme = next;
  window.dispatchEvent(new Event('blog-theme'));
  try {
    localStorage.setItem('blog-theme-manual', next);
  } catch {
    /* private mode */
  }
});

// Mobile menu
const menuBtn = document.getElementById('mobile-menu-btn');
const nav = document.getElementById('main-nav');
if (menuBtn && nav) {
  const setOpen = (open: boolean) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', e => {
    const t = e.target as Node;
    if (nav.classList.contains('open') && !nav.contains(t) && !menuBtn.contains(t)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      menuBtn.focus();
    }
  });
}

// Header hairline once the page scrolls
const header = document.getElementById('site-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, {passive: true});
}

// Live like and comment counts on listing cards, so cached HTML stays fresh
const cards = document.querySelectorAll<HTMLElement>('[data-engagement-slug]');
if (cards.length) {
  fetch('/api/posts/stats')
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      const stats = data?.stats || {};
      cards.forEach(el => {
        const s = stats[el.dataset.engagementSlug || ''];
        if (!s) return;
        const likes = el.querySelector('.eng-likes');
        const comments = el.querySelector('.eng-comments');
        if (likes) likes.textContent = String(s.likes);
        if (comments) comments.textContent = String(s.comments);
      });
    })
    .catch(() => {});
}

// Home page: filter the three sections by pillar
const filters = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
if (filters.length) {
  const sections = document.querySelectorAll<HTMLElement>('[data-pillar-section]');
  const apply = (value: string) => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
    sections.forEach(s => {
      s.hidden = !(value === 'all' || s.dataset.pillarSection === value);
    });
  };
  filters.forEach(b => b.addEventListener('click', () => apply(b.dataset.filter || 'all')));
  const initial = new URLSearchParams(location.search).get('category');
  if (initial && Array.from(filters).some(button => button.dataset.filter === initial)) apply(initial);
}
