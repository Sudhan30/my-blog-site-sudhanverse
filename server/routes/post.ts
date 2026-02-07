import { layout } from "../templates/layout";
import { getPostBySlug } from "../lib/posts";
import { renderMarkdown } from "../lib/markdown";
import { getMyFirstSiteContent } from "../templates/posts/my-first-site";

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

  // Use custom HTML templates for specific posts
  const isCustomTemplate = slug === "my-first-site";
  const htmlContent = isCustomTemplate
    ? getMyFirstSiteContent()
    : renderMarkdown(post.content);

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
        <section class="comments-section">
          <h3>Comments <span id="comment-count">(0)</span></h3>

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
            <input type="text" name="name" placeholder="Your name (optional)" class="comment-input">
            <textarea name="comment" placeholder="Share your thoughts..." required class="comment-textarea" maxlength="2000"></textarea>
            <button type="submit" class="comment-submit">Post Comment</button>
          </form>
          
          <div id="comments-list" class="comments-list">
            <!-- Comments loaded dynamically -->
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

      const clientId = getClientId();
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
      
      async function loadComments() {
        const res = await fetch('/api/posts/' + slug + '/comments');
        const data = await res.json();
        const total = data.total || data.comments?.length || 0;
        commentCount.textContent = '(' + total + ')';
        
        if (!data.comments || data.comments.length === 0) {
          commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
          return;
        }
        
        commentsList.innerHTML = data.comments.map(c => \`
          <div class="comment">
            <div class="comment-header">
              <span class="comment-author">\${c.display_name}</span>
              <span class="comment-date">\${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <p class="comment-text">\${c.content}</p>
          </div>
        \`).join('');
      }
      
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(commentForm);

        const res = await fetch('/api/posts/' + slug + '/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('name'),
            comment: formData.get('comment')
          })
        });

        if (res.ok) {
          commentForm.reset();
          alert('Comment posted!');
          loadComments();
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
