// Reading aids on a post page: progress bar, code copy buttons, heading anchor copy,
// table scroll hint, "On this page" scrollspy, image zoom, and lazy video player.

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

// Copy buttons on Shiki code blocks (mounted in .code-block-head) or standalone <pre>
content?.querySelectorAll('figure.code-block, pre').forEach(node => {
  if (node.tagName === 'PRE' && node.closest('figure.code-block')) return;
  const pre = node.tagName === 'PRE' ? node : node.querySelector('pre');
  if (!pre) return;
  const host = node.querySelector('.code-block-head') || pre;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'code-copy-btn';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    try {
      await navigator.clipboard.writeText(code ? code.innerText : pre.innerText);
      btn.textContent = 'Copied';
      btn.dataset.copied = 'true';
      setTimeout(() => {
        btn.textContent = 'Copy';
        delete btn.dataset.copied;
      }, 1800);
    } catch {
      /* clipboard unavailable */
    }
  });
  host.appendChild(btn);
});

// Clickable heading anchor copy feedback
content?.querySelectorAll<HTMLAnchorElement>('.heading-anchor').forEach(anchor => {
  anchor.addEventListener('click', async () => {
    const url = new URL(anchor.href, window.location.href).toString();
    try {
      await navigator.clipboard.writeText(url);
      anchor.dataset.copied = 'true';
      setTimeout(() => delete anchor.dataset.copied, 1400);
    } catch {
      /* clipboard unavailable */
    }
  });
});

// Fade the right edge of tables that scroll sideways
document.querySelectorAll<HTMLElement>('.table-wrap').forEach(w => {
  const update = () => w.classList.toggle('is-scrollable', w.scrollWidth - w.clientWidth - w.scrollLeft > 4);
  update();
  w.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
});

// Links and section IDs arrive with the HTML. Enhance the wide-screen rail starting at 1160px.
const contents = document.querySelector<HTMLDetailsElement>('#article-contents');
if (contents && content) {
  const wide = matchMedia('(min-width: 1160px)');
  const setLayout = () => { contents.open = wide.matches; };
  setLayout();
  wide.addEventListener('change', setLayout);
  const links = Array.from(contents.querySelectorAll<HTMLAnchorElement>('ol a'));
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  const currentSection = () => {
    let current = -1;
    for (const [index, heading] of sections.entries()) {
      if (heading && heading.getBoundingClientRect().top <= 128) current = index;
    }
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  currentSection();
  window.addEventListener('scroll', currentSection, {passive: true});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(currentSection, {rootMargin: '-100px 0px -60% 0px'});
    sections.forEach(heading => { if (heading) observer.observe(heading); });
  }
}

// Click an image to see it larger
const zoom = document.getElementById('image-zoom') as HTMLDialogElement | null;
const zoomImg = zoom?.querySelector('img');
if (content && zoom && zoomImg) {
  let trigger: HTMLButtonElement | undefined;
  content.querySelectorAll<HTMLImageElement>('img').forEach(image => {
    if (image.closest('a, button')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zoom-trigger';
    button.setAttribute('aria-label', image.alt ? 'Enlarge ' + image.alt : 'Enlarge image');
    image.replaceWith(button);
    button.append(image);
    button.addEventListener('click', () => {
      trigger = button;
      zoomImg.src = image.currentSrc || image.src;
      zoomImg.alt = image.alt;
      zoom.showModal();
    });
  });
  zoom.addEventListener('close', () => trigger?.focus({preventScroll: true}));
  zoom.addEventListener('click', () => zoom.close());
}

// Lazy-loaded video player: zero video bytes transferred before Play
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
