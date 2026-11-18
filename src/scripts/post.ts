// Reading aids on a post page: progress bar, code copy buttons, table scroll
// hint, "On this page" list and image zoom. Plain DOM code.

const content = document.getElementById('article-content');

// Measure progress through the article text. Discussion length varies independently.
const bar = document.getElementById('reading-progress');
if (bar && content) {
  const update = () => {
    const {top, height} = content.getBoundingClientRect();
    const header = document.getElementById('site-header')?.offsetHeight || 0;
    const viewport = Math.max(1, innerHeight - header);
    const distance = Math.max(0, header - top);
    const progress = top > header ? 0 : Math.min(1, distance / Math.max(1, height - viewport));
    bar.style.transform = `scaleX(${progress})`;
  };
  update();
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(content);
}

// Copy buttons on code blocks
content?.querySelectorAll('pre').forEach(pre => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'code-copy-btn';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    try {
      await navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 1800);
    } catch {
      /* clipboard unavailable */
    }
  });
  pre.appendChild(btn);
});

// Fade the right edge of tables that scroll sideways
document.querySelectorAll<HTMLElement>('.table-wrap').forEach(w => {
  const update = () => w.classList.toggle('is-scrollable', w.scrollWidth - w.clientWidth - w.scrollLeft > 4);
  update();
  w.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
});

// Links and section IDs arrive with the HTML. Enhance the wide-screen rail.
const contents = document.querySelector<HTMLDetailsElement>('#article-contents');
if (contents && content) {
  const wide = matchMedia('(min-width: 1380px)');
  const setLayout = () => { contents.open = wide.matches; };
  setLayout();
  wide.addEventListener('change', setLayout);
  const links = Array.from(contents.querySelectorAll<HTMLAnchorElement>('ol a'));
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  const currentSection = () => {
    let current = -1;
    for (const [index, heading] of sections.entries()) {
      if (heading && heading.getBoundingClientRect().top <= 120) current = index;
    }
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  currentSection();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(currentSection, {rootMargin: '-100px 0px 0px'});
    sections.forEach(heading => { if (heading) observer.observe(heading); });
  }
}

// Click an image to see it larger
const zoom = document.getElementById('image-zoom') as HTMLDialogElement | null;
const zoomImg = zoom?.querySelector('img');
if (content && zoom && zoomImg) {
  content.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t instanceof HTMLImageElement) {
      zoomImg.src = t.src;
      zoomImg.alt = t.alt;
      zoom.showModal();
    }
  });
  zoom.addEventListener('click', () => zoom.close());
}

const recording = document.querySelector<HTMLAnchorElement>('[data-play-recording]');
recording?.addEventListener('click', event => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const player = document.createElement('video');
  player.controls = true;
  player.playsInline = true;
  player.src = recording.href;
  if (recording.dataset.captions) {
    const captions = document.createElement('track');
    captions.kind = 'captions';
    captions.label = 'English';
    captions.srclang = 'en';
    captions.src = recording.dataset.captions;
    captions.default = true;
    player.append(captions);
  }
  const fallback = document.createElement('a');
  fallback.href = recording.href;
  fallback.textContent = 'Open video file';
  recording.replaceWith(player, fallback);
  player.focus();
  void player.play().catch(() => player.focus());
});
