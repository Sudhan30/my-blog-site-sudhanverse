// Reading aids on a post page: progress bar, code copy buttons, table scroll
// hint, "On this page" list and image zoom. Plain DOM code.

const content = document.getElementById('article-content');

// Reading progress
const bar = document.getElementById('reading-progress');
if (bar) {
  const update = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${h > 0 ? (window.scrollY / h) * 100 : 0}%`;
  };
  update();
  window.addEventListener('scroll', update, {passive: true});
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

// "On this page", built from the H2s (only when there are three or more)
const toc = document.getElementById('toc');
const list = document.getElementById('toc-list');
if (content && toc && list) {
  const heads = Array.from(content.querySelectorAll<HTMLElement>('h2')).filter(h => h.id);
  if (heads.length >= 3) {
    heads.forEach(h => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    toc.hidden = false;
    const links = Array.from(list.querySelectorAll('a'));
    const setCurrent = (id: string) => links.forEach(l => l.classList.toggle('current', l.getAttribute('href') === `#${id}`));
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        const first = heads.find(h => visible.has(h.id));
        if (first) return setCurrent(first.id);
        const above = heads.filter(h => h.getBoundingClientRect().top < 120);
        if (above.length) setCurrent(above[above.length - 1].id);
      },
      {rootMargin: '-80px 0px -65% 0px'},
    );
    heads.forEach(h => io.observe(h));
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
