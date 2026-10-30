import { layout } from "../templates/layout";
import { getPostBySlug, CATEGORY_META } from "../lib/posts";
import { renderMarkdown } from "../lib/markdown";
import { secureHtml } from "../middleware/security";
import { icon } from "../templates/icons";
import { esc, renderCategoryBadge } from "../templates/post-list";
import { renderPostInteractiveBanner, renderPostInteractiveWidget } from "../templates/interactive-widgets";

export async function postRoute(slug: string): Promise<Response> {
  const post = await getPostBySlug(slug);

  if (!post) {
    return secureHtml(layout({
      title: "Post Not Found",
      description: "The requested blog post could not be found.",
      url: `/post/${slug}`,
      content: `<div class="container"><div class="no-posts" style="padding: 64px 0;"><h2>Post not found</h2><p>The article you're looking for doesn't exist or may have moved.</p><a href="/" class="text-link">Back to home ${icon("arrow-right")}</a></div></div>`
    }), 404);
  }

  const date = new Date(post.date).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const htmlContent = renderMarkdown(post.content);

  const tags = post.tags.map(t =>
    `<a href="/tag/${encodeURIComponent(t)}" class="article-tag-chip">#${esc(t)}</a>`
  ).join("");

  const readTime = post.readTime || Math.max(1, Math.ceil(post.content.split(/\s+/).length / 220));
  const categoryInfo = CATEGORY_META[post.category];

  // Video takes the hero slot; otherwise the cover image if there is one (skip if cover is already embedded in markdown body)
  const coverAlreadyInBody = post.cover && post.content.includes(post.cover);
  const coverSrc = post.cover ? (post.cover.endsWith(".svg") ? `${post.cover}?v=2026103005` : post.cover) : "";
  const heroMedia = post.video ? `
        <figure class="article-hero-media video-embed">
          <video controls playsinline preload="metadata"${post.poster || post.cover ? ` poster="${post.poster || coverSrc}"` : ""}>
            <source src="${post.video}" type="video/mp4">
            Your browser can't play this video. <a href="${post.video}">Download it</a> instead.
          </video>
        </figure>
  ` : (post.cover && !coverAlreadyInBody) ? `
        <figure class="article-hero-media">
          <img src="${coverSrc}" alt="${esc(post.title)}">
        </figure>
  ` : "";

  const eventLine = post.event
    ? `<span class="article-event-pill">${icon("award", { size: 14 })} ${esc(post.event)}</span>`
    : "";

  const interactiveBanner = renderPostInteractiveBanner(post);
  const interactiveWidget = renderPostInteractiveWidget(post.slug);

  const articleHeader = `
        <header class="article-header">
          <div class="article-breadcrumb-row">
            <a href="/" class="back-link">${icon("arrow-left")} All writing</a>
            <span class="breadcrumb-sep">/</span>
            <a href="/category/${categoryInfo.slug}" class="back-link category-crumb">${esc(categoryInfo.label)}</a>
          </div>
          <div class="article-badges-row">
            ${renderCategoryBadge(post.category, post.badge)}
            ${eventLine}
          </div>
          <h1 class="article-title">${esc(post.title)}</h1>
          <p class="article-dek">${esc(post.excerpt)}</p>
          <div class="article-meta-bar">
            <div class="article-meta">
              <img src="/assets/images/author-potrait-small.png" alt="" class="article-meta-avatar" width="36" height="36">
              <div class="article-meta-text">
                <span class="article-meta-name">Sudharsana Rajasekaran</span>
                <span class="article-meta-sub"><time datetime="${post.date}">${date}</time> · ${readTime} min read</span>
              </div>
            </div>
            <div class="article-quick-actions">
              <button class="like-btn like-btn-trigger" id="like-btn-top" data-slug="${post.slug}" aria-label="Like this post" title="Like this post">
                <span class="like-icon">${icon("thumbs-up")}</span>
                <span class="like-count-display" id="like-count-top">0</span>
              </button>
              <a href="#comments-section" class="quick-action-btn" id="comment-jump-btn" title="Jump to comments">
                ${icon("message-square", { size: 15 })}
                <span id="comment-count-top">0</span>
              </a>
              <button class="quick-action-btn" id="share-btn-top" type="button" title="Copy article link" aria-label="Copy article link">
                ${icon("share-2", { size: 15 })}
                <span id="share-btn-label">Share</span>
              </button>
            </div>
          </div>
        </header>
        ${interactiveBanner}
        ${heroMedia}
        ${interactiveWidget ? `<div class="article-interactive-slot">${interactiveWidget}</div>` : ""}
  `;

  const content = `
    <div class="reading-progress" id="reading-progress"></div>
    <article class="article-page" data-category="${post.category}">
      <div class="container article-container">
        ${articleHeader}

        <div class="article-body">
          <div class="article-content" id="article-content">
            ${htmlContent}
          </div>
          <aside class="toc" id="toc" aria-label="On this page" hidden>
            <div class="toc-inner">
              <p class="toc-title">On this page</p>
              <ul class="toc-list" id="toc-list"></ul>
            </div>
          </aside>
        </div>

        ${tags ? `<div class="article-tags"><span class="article-tags-label">Topics</span><div class="article-tags-list">${tags}</div></div>` : ""}

        <!-- Author Section with Like Button -->
        <section class="author-section">
          <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="author-avatar" width="52" height="52" loading="lazy">
          <div class="author-info">
            <h3>Sudharsana Rajasekaran</h3>
            <p>AI &amp; Data Engineer building local-first apps, autonomous agents, and self-hosted systems.</p>
            <div class="author-links">
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" title="Portfolio" aria-label="Portfolio">${icon("globe")}</a>
              <a href="https://github.com/sudhan30" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub">${icon("github")}</a>
              <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn">${icon("linkedin")}</a>
            </div>
          </div>
          <div class="author-cta-box">
            <span class="author-cta-label">Enjoyed this write-up?</span>
            <button class="like-btn like-btn-large like-btn-trigger" id="like-btn" data-slug="${post.slug}" aria-label="Like this post">
              <span class="like-icon">${icon("thumbs-up")}</span>
              <span class="like-btn-text">Applause</span>
              <span class="like-count-display" id="like-count">0</span>
            </button>
          </div>
        </section>

        <!-- Comments Section -->
        <section class="comments-section" id="comments-section">
          <div class="comments-header">
            <h2>Discussion <span id="comment-count">(0)</span></h2>
            <select id="comment-sort" class="comment-sort" aria-label="Sort comments">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="most_liked">Most Liked</option>
            </select>
          </div>

          <!-- AI-Generated Comment Summary (hidden if no summary) -->
          <div id="comment-summary" class="comment-summary" style="display: none;">
            <div class="summary-header">
              ${icon("sparkles")}
              <span>AI Reader Pulse (Local Gemma)</span>
            </div>
            <p id="summary-text"></p>
            <div class="summary-meta">
              <span id="summary-comment-count"></span>
              <span id="summary-date"></span>
            </div>
          </div>

          <form class="comment-form" id="comment-form">
            <input type="hidden" name="postSlug" value="${post.slug}">
            <div class="name-input-wrapper">
              <input type="text" name="name" placeholder="Your name (or keep your AI alias)" class="comment-input" id="comment-name" aria-label="Your name">
              <div class="name-error" id="name-error" style="display: none;" role="alert">
                ${icon("alert-circle")}
                <span id="name-error-text"></span>
              </div>
            </div>
            <textarea name="comment" placeholder="Share a question, architectural critique, or feedback..." required class="comment-textarea" maxlength="2000" aria-label="Comment"></textarea>
            <button type="submit" class="comment-submit" id="comment-submit-btn">Post comment</button>
          </form>

          <div id="comments-list" class="comments-list">
            <!-- Comments loaded dynamically -->
          </div>
          <div id="comments-pagination" class="comments-pagination">
            <!-- Pagination controls loaded dynamically -->
          </div>
        </section>
      </div>
    </article>

    <script>
      const slug = "${post.slug}";
      const ICONS = ${JSON.stringify({
        thumbs: icon("thumbs-up"),
        thumbsFilled: icon("thumbs-up", { filled: true }),
        heart: icon("heart"),
        heartFilled: icon("heart", { filled: true }),
        user: icon("user"),
        arrowLeft: icon("arrow-left"),
        arrowRight: icon("arrow-right"),
        copy: icon("copy", { size: 14 }),
        check: icon("check", { size: 14 }),
        x: icon("x", { size: 20 })
      })};

      // Client ID management
      function getClientId() {
        let id = localStorage.getItem('blog-client-id');
        if (!id) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = crypto.randomUUID();
          } else {
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }
          localStorage.setItem('blog-client-id', id);
        }
        return id;
      }

      function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function timeAgo(dateStr) {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return seconds <= 5 ? 'just now' : seconds + ' seconds ago';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours === 1 ? '1 hour ago' : hours + ' hours ago';
        const days = Math.floor(hours / 24);
        if (days < 7) return days === 1 ? '1 day ago' : days + ' days ago';
        if (days < 30) { const w = Math.floor(days / 7); return w === 1 ? '1 week ago' : w + ' weeks ago'; }
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      async function generateDisplayName() {
        let name = localStorage.getItem('blog-display-name');
        if (name) {
          return name;
        }

        try {
          const response = await fetch('/api/generate-name', {
            method: 'GET',
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.name) {
              name = data.name;
              localStorage.setItem('blog-display-name', name);
              trackAutoGeneratedName(name);
              return name;
            }
          }
        } catch (error) {
          // Fallback to local random generator
        }

        const adjectives = ['Swift','Clever','Brave','Silent','Noble','Wild','Cosmic',
          'Ancient','Mystic','Golden','Silver','Crystal','Thunder','Shadow','Lunar',
          'Solar','Arctic','Tropical','Desert','Ocean','Forest','Mountain','Storm',
          'Blazing','Frozen','Radiant','Nimble','Fierce','Gentle','Majestic'];

        const animals = ['Fox','Owl','Bear','Wolf','Hawk','Lynx','Deer','Seal','Puma','Crow',
          'Orca','Ibis','Wren','Dove','Hare','Newt','Frog','Moth','Pike','Swan',
          'Koala','Panda','Otter','Eagle','Raven','Bison','Cobra','Finch','Crane','Viper',
          'Tiger','Lion','Leopard','Cheetah','Jaguar','Panther','Falcon','Sparrow','Robin',
          'Dolphin','Whale','Shark','Penguin','Albatross','Pelican','Heron','Stork',
          'Phoenix','Dragon','Griffin','Pegasus'];

        const randomIndex = (max) => {
          const array = new Uint32Array(1);
          crypto.getRandomValues(array);
          return array[0] % max;
        };

        const adjective = adjectives[randomIndex(adjectives.length)];
        const animal = animals[randomIndex(animals.length)];
        const number = String(randomIndex(100000)).padStart(5, '0');

        name = adjective + '-' + animal + '-' + number;
        localStorage.setItem('blog-display-name', name);
        trackAutoGeneratedName(name);
        return name;
      }

      function trackAutoGeneratedName(name) {
        const previousNames = JSON.parse(localStorage.getItem('blog-previous-names') || '[]');
        if (!previousNames.includes(name)) {
          previousNames.push(name);
          localStorage.setItem('blog-previous-names', JSON.stringify(previousNames));
        }
      }

      const clientId = getClientId();
      let displayName = localStorage.getItem('blog-display-name') || 'Anonymous';

      (async () => {
        displayName = await generateDisplayName();
        const nameInput = document.getElementById('comment-name');
        if (nameInput && displayName !== 'Anonymous') {
          nameInput.placeholder = displayName;
          nameInput.value = displayName;

          const existingBadge = document.querySelector('.name-badge');
          if (!existingBadge) {
            const badge = document.createElement('div');
            badge.className = 'name-badge';
            badge.innerHTML = ICONS.user + ' Posting as: <strong>' + escapeHtml(displayName) + '</strong> <span class="name-badge-hint">(editable above)</span>';
            nameInput.parentElement.appendChild(badge);
          }
        }
      })();

      // Synchronized Top + Bottom Like buttons
      let hasLiked = localStorage.getItem('liked-' + slug) === 'true';
      let currentLikesCount = 0;
      let isLikePending = false;
      const likeButtons = document.querySelectorAll('.like-btn-trigger');
      const likeCountDisplays = document.querySelectorAll('.like-count-display');

      function updateLikeButtonsUI(animate) {
        likeCountDisplays.forEach(el => {
          el.textContent = String(currentLikesCount);
        });
        likeButtons.forEach(btn => {
          const iconEl = btn.querySelector('.like-icon');
          if (hasLiked) {
            btn.classList.add('liked');
            if (iconEl) iconEl.innerHTML = ICONS.thumbsFilled;
          } else {
            btn.classList.remove('liked');
            if (iconEl) iconEl.innerHTML = ICONS.thumbs;
          }
          if (animate) {
            btn.classList.remove('like-burst');
            void btn.offsetWidth;
            btn.classList.add('like-burst');
          }
        });
      }

      async function loadLikes() {
        try {
          const res = await fetch('/api/posts/' + encodeURIComponent(slug) + '/likes?clientId=' + encodeURIComponent(clientId));
          if (!res.ok) return;
          const data = await res.json();
          currentLikesCount = typeof data.count === 'number' ? data.count : 0;
          if (typeof data.liked === 'boolean') {
            hasLiked = data.liked;
            localStorage.setItem('liked-' + slug, String(hasLiked));
          }
          updateLikeButtonsUI(false);
        } catch (err) {
          console.error('Error loading likes:', err);
        }
      }

      likeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          if (isLikePending) return;
          isLikePending = true;

          const previousLiked = hasLiked;
          const previousCount = currentLikesCount;
          const method = previousLiked ? 'DELETE' : 'POST';

          // Optimistic UI update
          hasLiked = !previousLiked;
          currentLikesCount = Math.max(0, previousCount + (hasLiked ? 1 : -1));
          localStorage.setItem('liked-' + slug, String(hasLiked));
          updateLikeButtonsUI(true);

          try {
            const res = await fetch('/api/posts/' + encodeURIComponent(slug) + '/likes', {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId })
            });
            const data = await res.json();
            if (res.ok && !data.error) {
              if (typeof data.count === 'number') {
                currentLikesCount = data.count;
              }
              if (typeof data.liked === 'boolean') {
                hasLiked = data.liked;
                localStorage.setItem('liked-' + slug, String(hasLiked));
              }
              updateLikeButtonsUI(false);
            } else {
              // Rollback on server error
              hasLiked = previousLiked;
              currentLikesCount = previousCount;
              localStorage.setItem('liked-' + slug, String(hasLiked));
              updateLikeButtonsUI(false);
            }
          } catch (err) {
            hasLiked = previousLiked;
            currentLikesCount = previousCount;
            localStorage.setItem('liked-' + slug, String(hasLiked));
            updateLikeButtonsUI(false);
          } finally {
            isLikePending = false;
          }
        });
      });

      loadLikes();

      // Share button
      const shareBtn = document.getElementById('share-btn-top');
      const shareBtnLabel = document.getElementById('share-btn-label');
      if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
          const shareUrl = window.location.href;
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(shareUrl);
              if (shareBtnLabel) shareBtnLabel.textContent = 'Copied!';
              shareBtn.classList.add('copied');
              setTimeout(() => {
                if (shareBtnLabel) shareBtnLabel.textContent = 'Share';
                shareBtn.classList.remove('copied');
              }, 2000);
            }
          } catch (e) {}
        });
      }

      // Comments functionality
      const commentForm = document.getElementById('comment-form');
      const commentsList = document.getElementById('comments-list');
      const commentCount = document.getElementById('comment-count');
      const commentCountTop = document.getElementById('comment-count-top');
      const commentSort = document.getElementById('comment-sort');
      let currentPage = 1;
      let currentSort = 'recent';
      const commentsPerPage = 10;

      async function loadComments(page = 1, sort = currentSort) {
        try {
          const res = await fetch(\`/api/posts/\${encodeURIComponent(slug)}/comments?page=\${page}&limit=\${commentsPerPage}&sort=\${sort}&clientId=\${encodeURIComponent(clientId)}&_t=\${Date.now()}\`);
          const data = await res.json();
          const { comments, pagination } = data;
          const total = pagination?.total || 0;
          currentPage = page;
          currentSort = sort;

          if (commentCount) commentCount.textContent = '(' + total + ')';
          if (commentCountTop) commentCountTop.textContent = String(total);

          if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Start the technical discussion below!</p>';
            renderPagination(pagination);
            return;
          }

          const previousNames = JSON.parse(localStorage.getItem('blog-previous-names') || '[]');
          const currentName = localStorage.getItem('blog-display-name');

          const html = comments.map((c) => {
            let authorName = c.display_name || 'Anonymous';
            if (currentName && previousNames.includes(c.display_name)) {
              authorName = currentName;
            }

            const likeCount = c.like_count || 0;
            const userLiked = c.user_liked || false;
            const likeIcon = userLiked ? ICONS.heartFilled : ICONS.heart;
            const likedClass = userLiked ? 'liked' : '';
            const escapedContent = escapeHtml(c.content || '');
            const initials = authorName.slice(0, 2).toUpperCase();

            return \`
              <div class="comment">
                <div class="comment-header">
                  <div class="comment-author-info">
                    <span class="comment-avatar-mini" aria-hidden="true">\${escapeHtml(initials)}</span>
                    <span class="comment-author">\${escapeHtml(authorName)}</span>
                    <span class="comment-date">\${timeAgo(c.created_at)}</span>
                  </div>
                  <button class="comment-like-btn \${likedClass}" data-comment-id="\${c.id}" data-liked="\${userLiked}" aria-label="Like comment">
                    <span class="like-icon">\${likeIcon}</span>
                    <span class="like-count">\${likeCount > 0 ? likeCount : ''}</span>
                  </button>
                </div>
                <p class="comment-text">\${escapedContent}</p>
              </div>
            \`;
          }).join('');

          commentsList.innerHTML = html;

          document.querySelectorAll('.comment-like-btn').forEach(btn => {
            btn.addEventListener('click', handleCommentLike);
          });

          renderPagination(pagination);
        } catch (error) {
          console.error('Error loading comments:', error);
        }
      }

      async function handleCommentLike(e) {
        const btn = e.currentTarget;
        const commentId = btn.dataset.commentId;
        const isLiked = btn.dataset.liked === 'true';
        const method = isLiked ? 'DELETE' : 'POST';

        try {
          const res = await fetch('/api/comments/' + commentId + '/likes', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
          });

          if (res.ok) {
            const data = await res.json();
            const likeCountSpan = btn.querySelector('.like-count');
            const icon = btn.querySelector('.like-icon');

            likeCountSpan.textContent = data.count > 0 ? data.count : '';
            btn.dataset.liked = data.liked;

            if (data.liked) {
              btn.classList.add('liked');
              icon.innerHTML = ICONS.heartFilled;
            } else {
              btn.classList.remove('liked');
              icon.innerHTML = ICONS.heart;
            }
          }
        } catch (error) {
          console.error('Failed to toggle comment like:', error);
        }
      }

      commentSort.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        loadComments(currentPage, currentSort);
      });

      function renderPagination(pagination) {
        const paginationContainer = document.getElementById('comments-pagination');
        if (!paginationContainer) return;

        if (!pagination || pagination.totalPages <= 1) {
          paginationContainer.innerHTML = '';
          return;
        }

        const { page, totalPages } = pagination;
        let html = '<div class="pagination">';

        if (page > 1) {
          html += \`<button class="page-btn" data-page="\${page - 1}">\${ICONS.arrowLeft} Previous</button>\`;
        }

        html += '<span class="page-info">Page ' + page + ' of ' + totalPages + '</span>';

        if (page < totalPages) {
          html += \`<button class="page-btn" data-page="\${page + 1}">Next \${ICONS.arrowRight}</button>\`;
        }

        html += '</div>';
        paginationContainer.innerHTML = html;

        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page, 10);
            loadComments(newPage, currentSort);
            document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      }

      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('comment-submit-btn');
        const formData = new FormData(commentForm);
        const customName = formData.get('name')?.trim();
        const finalName = customName || displayName;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Posting...';
        }

        try {
          const res = await fetch('/api/posts/' + encodeURIComponent(slug) + '/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: finalName,
              comment: formData.get('comment'),
              clientId: clientId
            })
          });

          if (res.ok) {
            if (customName && customName !== displayName) {
              trackAutoGeneratedName(displayName);
              localStorage.setItem('blog-display-name', customName);
              displayName = customName;

              try {
                await fetch('/api/update-display-name', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    clientId: clientId,
                    newDisplayName: customName
                  })
                });
              } catch (error) {
                console.error('Failed to update comments in database:', error);
              }

              const nameInput = document.getElementById('comment-name');
              if (nameInput) {
                nameInput.placeholder = customName;
                nameInput.value = customName;
              }

              const badge = document.querySelector('.name-badge');
              if (badge) {
                badge.innerHTML = ICONS.user + ' Posting as: <strong>' + escapeHtml(customName) + '</strong>';
              }
            }

            commentForm.reset();
            const nameInput = document.getElementById('comment-name');
            if (nameInput) {
              nameInput.value = displayName;
            }
            await loadComments();
            loadSummary();
          } else {
            const errorData = await res.json();
            const errorMessage = errorData.error || 'Failed to post comment';

            const nameError = document.getElementById('name-error');
            const nameErrorText = document.getElementById('name-error-text');
            const nameInput = document.getElementById('comment-name');

            if (nameError && nameErrorText && nameInput) {
              nameErrorText.textContent = errorMessage;
              nameError.style.display = 'flex';
              nameInput.classList.add('input-error');
              nameInput.focus();

              setTimeout(() => {
                nameError.style.display = 'none';
                nameInput.classList.remove('input-error');
              }, 5000);
            }
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post comment';
          }
        }
      });

      const summarySection = document.getElementById('comment-summary');
      const summaryText = document.getElementById('summary-text');
      const summaryCommentCount = document.getElementById('summary-comment-count');
      const summaryDate = document.getElementById('summary-date');

      async function loadSummary() {
        try {
          const res = await fetch('/api/posts/' + encodeURIComponent(slug) + '/summary');
          const data = await res.json();

          if (data.summary) {
            summaryText.textContent = data.summary;
            summaryCommentCount.textContent = 'Synthesized from ' + data.commentCount + ' reader comments';
            summaryDate.textContent = 'Updated ' + new Date(data.updatedAt).toLocaleDateString();
            summarySection.style.display = 'block';
          } else {
            summarySection.style.display = 'none';
          }
        } catch (err) {
          summarySection.style.display = 'none';
        }
      }

      loadComments();
      loadSummary();

      // Add 1-click Copy button to all code blocks in article content
      (function() {
        document.querySelectorAll('.article-content pre').forEach(function(pre) {
          if (pre.querySelector('.code-copy-btn')) return;
          pre.style.position = 'relative';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'code-copy-btn';
          btn.setAttribute('aria-label', 'Copy code');
          btn.innerHTML = ICONS.copy + '<span>Copy</span>';
          btn.addEventListener('click', function() {
            const code = pre.querySelector('code');
            const text = code ? code.innerText : pre.innerText;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(function() {
                btn.classList.add('copied');
                btn.innerHTML = ICONS.check + '<span>Copied</span>';
                setTimeout(function() {
                  btn.classList.remove('copied');
                  btn.innerHTML = ICONS.copy + '<span>Copy</span>';
                }, 1800);
              });
            }
          });
          pre.appendChild(btn);
        });
      })();

      // Fade the right edge of tables that scroll horizontally
      (function() {
        document.querySelectorAll('.table-wrap').forEach(function(w) {
          const update = function() {
            const more = w.scrollWidth - w.clientWidth - w.scrollLeft > 4;
            w.classList.toggle('is-scrollable', more);
          };
          update();
          w.addEventListener('scroll', update, { passive: true });
          window.addEventListener('resize', update);
        });
      })();

      // Table of contents ("On this page") built from the rendered H2s
      (function() {
        const container = document.getElementById('article-content');
        const toc = document.getElementById('toc');
        const list = document.getElementById('toc-list');
        if (!container || !toc || !list) return;
        const heads = Array.from(container.querySelectorAll('h2'));
        if (heads.length < 3) return;
        const used = new Set(Array.from(container.querySelectorAll('[id]')).map(function(el) { return el.id; }));
        heads.forEach(function(h, i) {
          if (!h.id) {
            let base = h.textContent.toLowerCase().replace(/[^a-z0-9\\s-]/g, '').trim().replace(/\\s+/g, '-') || 'section-' + (i + 1);
            let id = base, n = 2;
            while (used.has(id)) { id = base + '-' + n++; }
            used.add(id);
            h.id = id;
          }
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#' + h.id;
          a.textContent = h.textContent;
          li.appendChild(a);
          list.appendChild(li);
        });
        toc.hidden = false;

        const links = Array.from(list.querySelectorAll('a'));
        function setCurrent(id) {
          links.forEach(function(l) { l.classList.toggle('current', l.getAttribute('href') === '#' + id); });
        }
        if ('IntersectionObserver' in window) {
          const visible = new Set();
          const io = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
              if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
            });
            const first = heads.find(function(h) { return visible.has(h.id); });
            if (first) setCurrent(first.id);
            else {
              const above = heads.filter(function(h) { return h.getBoundingClientRect().top < 120; });
              if (above.length) setCurrent(above[above.length - 1].id);
            }
          }, { rootMargin: '-80px 0px -65% 0px' });
          heads.forEach(function(h) { io.observe(h); });
        }
      })();

      // Image lightbox functionality
      (function() {
        const lightboxHTML = \`
          <div id="lightbox" class="lightbox" style="display: none;">
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
              <button class="lightbox-close" aria-label="Close">\${ICONS.x}</button>
              <img class="lightbox-image" alt="">
            </div>
          </div>
        \`;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxClose = lightbox.querySelector('.lightbox-close');
        const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');

        const articleContent = document.querySelector('.article-content');
        if (articleContent) {
          articleContent.addEventListener('click', function(e) {
            const target = e.target;
            if (target.tagName === 'IMG') {
              e.preventDefault();
              lightboxImg.src = target.src;
              lightboxImg.alt = target.alt;
              lightbox.style.display = 'flex';
              document.body.style.overflow = 'hidden';
            }
          });
        }

        function closeLightbox() {
          lightbox.style.display = 'none';
          document.body.style.overflow = '';
        }

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxBackdrop.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && lightbox.style.display === 'flex') {
            closeLightbox();
          }
        });
      })();
    </script>
  `;

  const html = layout({
    title: post.title,
    description: post.excerpt,
    url: `/post/${post.slug}`,
    ogType: "article",
    ogImage: post.cover ? `https://blog.sudharsana.dev${post.cover}` : undefined,
    content
  });

  const response = secureHtml(html);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
