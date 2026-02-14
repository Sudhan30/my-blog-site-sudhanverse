import { layout } from "../templates/layout";
import { getPostBySlug } from "../lib/posts";
import { renderMarkdown } from "../lib/markdown";

export async function postRoute(slug: string): Promise<Response> {
  const post = await getPostBySlug(slug);

  if (!post) {
    return new Response("Post not found", { status: 404 });
  }

  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Use markdown rendering for all posts
  const isCustomTemplate = false;
  const htmlContent = renderMarkdown(post.content);

  const tags = post.tags.map(t =>
    `<a href="/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
  ).join("");

  // Only show article header for non-custom template posts
  const articleHeader = isCustomTemplate ? '' : `
        <header class="article-header">
          <div class="article-meta">
            <time datetime="${post.date}">${date}</time>
          </div>
          <h1 class="article-title">${post.title}</h1>
          <div class="article-tags">${tags}</div>
        </header>
  `;

  const content = `
    <article class="article-page${isCustomTemplate ? ' custom-template' : ''}">
      <div class="container article-container">
        ${articleHeader}
        
        <!-- Article Content -->
        <div class="article-content">
          ${htmlContent}
        </div>
        
        <!-- Author Section with Like Button -->
        <section class="author-section">
          <img src="/assets/images/author-potrait-small.png" alt="Sudharsana" class="author-avatar">
          <div class="author-info">
            <h3>About the Author</h3>
            <p>Passionate about solving real-world problems with data, I'm a data engineer with experience building enterprise-level solutions.</p>
            <div class="author-links">
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" title="Portfolio"><i class="fas fa-globe"></i></a>
              <a href="https://github.com/sudharsanarajasekaran" target="_blank" rel="noopener" title="GitHub"><i class="fab fa-github"></i></a>
              <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>
          <button class="like-btn" id="like-btn" data-slug="${post.slug}" aria-label="Like this post">
            <i class="far fa-thumbs-up"></i>
            <span id="like-count">0</span>
          </button>
        </section>
        
        <!-- Comments Section -->
        <section class="comments-section" id="comments-section">
          <div class="comments-header">
            <h3>Comments <span id="comment-count">(0)</span></h3>
            <select id="comment-sort" class="comment-sort">
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="most_liked">Most Liked</option>
            </select>
          </div>

          <!-- AI-Generated Comment Summary (hidden if no summary) -->
          <div id="comment-summary" class="comment-summary" style="display: none;">
            <div class="summary-header">
              <i class="fas fa-robot"></i>
              <span>What readers are saying</span>
            </div>
            <p id="summary-text"></p>
            <div class="summary-meta">
              <span id="summary-comment-count"></span>
              <span id="summary-date"></span>
            </div>
          </div>

          <form class="comment-form" id="comment-form">
            <input type="hidden" name="postSlug" value="${post.slug}">
            <input type="text" name="name" placeholder="Your name" class="comment-input" id="comment-name">
            <textarea name="comment" placeholder="Share your thoughts..." required class="comment-textarea" maxlength="2000"></textarea>
            <button type="submit" class="comment-submit">Post Comment</button>
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
      
      // Client ID management
      function getClientId() {
        let id = localStorage.getItem('blog-client-id');
        if (!id) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            id = crypto.randomUUID();
          } else {
             // Fallback for older browsers / non-secure contexts
            id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }
          localStorage.setItem('blog-client-id', id);
        }
        return id;
      }

      // Relative time formatting
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

      // Auto-generated display name with AI + fallback
      async function generateDisplayName() {
        let name = localStorage.getItem('blog-display-name');
        if (name) {
          return name;
        }

        // Try Ollama-generated name first
        try {
          const response = await fetch('/api/generate-name', {
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2s timeout
          });

          if (response.ok) {
            const data = await response.json();
            if (data.name) {
              name = data.name;
              localStorage.setItem('blog-display-name', name);

              // Track this auto-generated name for future replacement
              trackAutoGeneratedName(name);

              console.log('✨ AI-generated name:', name);
              return name;
            }
          }
        } catch (error) {
          console.log('⚠️  AI generation unavailable, using fallback');
        }

        // Fallback: Enhanced random generation
        const adjectives = ['Swift','Clever','Brave','Silent','Noble','Wild','Cosmic',
          'Ancient','Mystic','Golden','Silver','Crystal','Thunder','Shadow','Lunar',
          'Solar','Arctic','Tropical','Desert','Ocean','Forest','Mountain','Storm',
          'Blazing','Frozen','Radiant','Nimble','Fierce','Gentle','Majestic'];

        const animals = ['Fox','Owl','Bear','Wolf','Hawk','Lynx','Deer','Seal','Puma','Crow',
          'Orca','Ibis','Wren','Dove','Hare','Newt','Frog','Moth','Pike','Swan',
          'Koala','Panda','Otter','Eagle','Raven','Bison','Cobra','Finch','Crane','Viper',
          'Tiger','Lion','Leopard','Cheetah','Jaguar','Panther','Falcon','Sparrow','Robin',
          'Dolphin','Whale','Shark','Penguin','Albatross','Pelican','Heron','Stork',
          'Beaver','Badger','Marten','Weasel','Ferret','Mink','Mongoose','Raccoon',
          'Phoenix','Dragon','Griffin','Pegasus','Unicorn','Sphinx','Hydra','Kraken'];

        // Use crypto for better randomness
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

        // Track this auto-generated name for future replacement
        trackAutoGeneratedName(name);

        console.log('🎲 Fallback name:', name);
        return name;
      }

      // Track auto-generated names so we can replace them later with custom names
      function trackAutoGeneratedName(name) {
        const previousNames = JSON.parse(localStorage.getItem('blog-previous-names') || '[]');
        if (!previousNames.includes(name)) {
          previousNames.push(name);
          localStorage.setItem('blog-previous-names', JSON.stringify(previousNames));
        }
      }

      const clientId = getClientId();
      let displayName = localStorage.getItem('blog-display-name') || 'Anonymous';

      // Aggressively generate display name on page load and update UI
      (async () => {
        displayName = await generateDisplayName();

        // Update comment form name input field with generated name
        const nameInput = document.getElementById('comment-name');
        if (nameInput && displayName !== 'Anonymous') {
          nameInput.placeholder = displayName;
          nameInput.value = displayName;

          // Add visual indicator showing the AI-generated name
          const existingBadge = document.querySelector('.name-badge');
          if (!existingBadge) {
            const badge = document.createElement('div');
            badge.className = 'name-badge';
            badge.innerHTML = '<i class="fas fa-robot"></i> Your username: <strong>' + displayName + '</strong>';
            badge.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 0.875rem; display: inline-flex; align-items: center; gap: 0.5rem;';
            nameInput.parentElement.appendChild(badge);
          }
        }
      })();
      let hasLiked = localStorage.getItem('liked-' + slug) === 'true';
      
      // Like functionality
      const likeBtn = document.getElementById('like-btn');
      const likeCount = document.getElementById('like-count');
      
      async function loadLikes() {
        const res = await fetch('/api/posts/' + slug + '/likes');
        const data = await res.json();
        likeCount.textContent = data.count || 0;
        updateLikeBtn();
      }
      
      function updateLikeBtn() {
        if (hasLiked) {
          likeBtn.classList.add('liked');
          likeBtn.querySelector('i').className = 'fas fa-thumbs-up';
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.querySelector('i').className = 'far fa-thumbs-up';
        }
      }
      
      likeBtn.addEventListener('click', async () => {
        const method = hasLiked ? 'DELETE' : 'POST';
        const res = await fetch('/api/posts/' + slug + '/likes', { 
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
        const data = await res.json();
        likeCount.textContent = data.count;
        
        // Update local state based on success
        if (!data.error) {
            hasLiked = !hasLiked;
            localStorage.setItem('liked-' + slug, hasLiked);
            updateLikeBtn();
        } else {
            console.error('Like failed:', data.error);
        }
      });
      
      loadLikes();
      
      // Comments functionality
      const commentForm = document.getElementById('comment-form');
      const commentsList = document.getElementById('comments-list');
      const commentCount = document.getElementById('comment-count');
      const commentSort = document.getElementById('comment-sort');
      let currentPage = 1;
      let currentSort = 'recent';
      const commentsPerPage = 10;

      async function loadComments(page = 1, sort = currentSort) {
        const res = await fetch(\`/api/posts/\${slug}/comments?page=\${page}&limit=\${commentsPerPage}&sort=\${sort}&clientId=\${clientId}\`);
        const data = await res.json();
        const { comments, pagination } = data;
        const total = pagination?.total || 0;
        currentPage = page;
        currentSort = sort;

        commentCount.textContent = '(' + total + ')';

        if (!comments || comments.length === 0) {
          commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
          renderPagination(pagination);
          return;
        }

        // Get list of previous auto-generated names used by this user
        const previousNames = JSON.parse(localStorage.getItem('blog-previous-names') || '[]');
        const currentName = localStorage.getItem('blog-display-name');

        commentsList.innerHTML = comments.map(c => {
          // Replace previous auto-generated names with current custom name
          let authorName = c.display_name;
          if (currentName && previousNames.includes(c.display_name)) {
            authorName = currentName;
          }

          const likeCount = c.like_count || 0;
          const userLiked = c.user_liked || false;
          const likeIcon = userLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
          const likedClass = userLiked ? 'liked' : '';

          return \`
            <div class="comment">
              <div class="comment-header">
                <span class="comment-author">\${authorName}</span>
                <span class="comment-date">\${timeAgo(c.created_at)}</span>
              </div>
              <p class="comment-text">\${c.content}</p>
              <div class="comment-actions">
                <button class="comment-like-btn \${likedClass}" data-comment-id="\${c.id}" data-liked="\${userLiked}">
                  <i class="\${likeIcon}"></i>
                  <span class="like-count">\${likeCount}</span>
                </button>
              </div>
            </div>
          \`;
        }).join('');

        // Add event listeners to like buttons
        document.querySelectorAll('.comment-like-btn').forEach(btn => {
          btn.addEventListener('click', handleCommentLike);
        });

        renderPagination(pagination);
      }

      // Handle comment like/unlike
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
            const icon = btn.querySelector('i');

            likeCountSpan.textContent = data.count;
            btn.dataset.liked = data.liked;

            if (data.liked) {
              btn.classList.add('liked');
              icon.className = 'fas fa-thumbs-up';
            } else {
              btn.classList.remove('liked');
              icon.className = 'far fa-thumbs-up';
            }
          }
        } catch (error) {
          console.error('Failed to toggle comment like:', error);
        }
      }

      // Sort dropdown change listener
      commentSort.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1; // Reset to first page
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

        // Previous button
        if (page > 1) {
          html += \`<button class="page-btn" data-page="\${page - 1}">← Previous</button>\`;
        }

        // Page numbers
        html += '<span class="page-info">Page ' + page + ' of ' + totalPages + '</span>';

        // Next button
        if (page < totalPages) {
          html += \`<button class="page-btn" data-page="\${page + 1}">Next →</button>\`;
        }

        html += '</div>';
        paginationContainer.innerHTML = html;

        // Attach event listeners to pagination buttons
        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const newPage = parseInt(btn.dataset.page, 10);
            loadComments(newPage, currentSort);
            // Scroll to comments section
            document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      }
      
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(commentForm);
        const customName = formData.get('name')?.trim();
        const finalName = customName || displayName;

        const res = await fetch('/api/posts/' + slug + '/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalName,
            comment: formData.get('comment'),
            clientId: clientId
          })
        });

        if (res.ok) {
          // If user provided a custom name, save it and update all their comments in DB
          if (customName && customName !== displayName) {
            // Track the old name before replacing it
            trackAutoGeneratedName(displayName);

            localStorage.setItem('blog-display-name', customName);
            displayName = customName;

            // Update all user's comments in the database
            try {
              const updateRes = await fetch('/api/update-display-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: clientId,
                  newDisplayName: customName
                })
              });

              if (updateRes.ok) {
                const data = await updateRes.json();
                console.log('✅ Updated', data.updatedCount, 'comments in database');
              }
            } catch (error) {
              console.error('Failed to update comments in database:', error);
            }

            // Update the name input field
            const nameInput = document.getElementById('comment-name');
            if (nameInput) {
              nameInput.placeholder = customName;
              nameInput.value = customName;
            }

            // Update the name badge
            const badge = document.querySelector('.name-badge');
            if (badge) {
              badge.innerHTML = '<i class="fas fa-user"></i> Your username: <strong>' + customName + '</strong>';
            }

            console.log('✅ Custom name saved:', customName);
          }

          commentForm.reset();
          // Restore the name field with the saved name
          const nameInput = document.getElementById('comment-name');
          if (nameInput) {
            nameInput.value = displayName;
          }
          loadComments(); // Reload comments to show updated names
        }
      });

      // Comment summary functionality
      const summarySection = document.getElementById('comment-summary');
      const summaryText = document.getElementById('summary-text');
      const summaryCommentCount = document.getElementById('summary-comment-count');
      const summaryDate = document.getElementById('summary-date');

      async function loadSummary() {
        try {
          const res = await fetch('/api/posts/' + slug + '/summary');
          const data = await res.json();

          if (data.summary) {
            summaryText.textContent = data.summary;
            summaryCommentCount.textContent = 'Based on ' + data.commentCount + ' comments';
            summaryDate.textContent = 'Updated ' + new Date(data.updatedAt).toLocaleDateString();
            summarySection.style.display = 'block';
          } else {
            summarySection.style.display = 'none';
          }
        } catch (err) {
          console.error('Failed to load summary:', err);
          summarySection.style.display = 'none';
        }
      }

      loadComments();
      loadSummary();

      // Image lightbox functionality
      (function() {
        // Create lightbox modal HTML
        const lightboxHTML = \`
          <div id="lightbox" class="lightbox" style="display: none;">
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
              <button class="lightbox-close" aria-label="Close">&times;</button>
              <img class="lightbox-image" src="" alt="">
            </div>
          </div>
        \`;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-image');
        const lightboxClose = lightbox.querySelector('.lightbox-close');
        const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');

        // Use event delegation for images (works even for images that load later)
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

        // Close lightbox functions
        function closeLightbox() {
          lightbox.style.display = 'none';
          document.body.style.overflow = '';
        }

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxBackdrop.addEventListener('click', closeLightbox);

        // Close on ESC key
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
    content
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
