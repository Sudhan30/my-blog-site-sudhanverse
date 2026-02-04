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

  const htmlContent = renderMarkdown(post.content);

  const tags = post.tags.map(t =>
    `<a href="/tag/${encodeURIComponent(t)}" class="tag">${t}</a>`
  ).join("");

  const content = `
    <article class="article-page">
      <div class="container article-container">
        <!-- Article Header -->
        <header class="article-header">
          <div class="article-meta">
            <time datetime="${post.date}">${date}</time>
          </div>
          <h1 class="article-title">${post.title}</h1>
          <div class="article-tags">${tags}</div>
        </header>
        
        <!-- Article Content -->
        <div class="article-content">
          ${htmlContent}
        </div>
        
        <!-- Article Footer -->
        <footer class="article-footer">
          <div class="interaction-buttons">
            <button class="like-btn" id="like-btn" data-slug="${post.slug}">
              <i class="far fa-thumbs-up"></i>
              <span id="like-count">0</span>
            </button>
          </div>
        </footer>
        
        <!-- Author Section -->
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
        </section>
        
        <!-- Comments Section -->
        <section class="comments-section">
          <h3>Comments <span id="comment-count">(0)</span></h3>
          
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
      
      // Like functionality
      const likeBtn = document.getElementById('like-btn');
      const likeCount = document.getElementById('like-count');
      let hasLiked = localStorage.getItem('liked-' + slug) === 'true';
      
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
        const res = await fetch('/api/posts/' + slug + '/likes', { method });
        const data = await res.json();
        likeCount.textContent = data.count;
        hasLiked = !hasLiked;
        localStorage.setItem('liked-' + slug, hasLiked);
        updateLikeBtn();
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
          alert('Comment submitted! It will appear after approval.');
          loadComments();
        }
      });
      
      loadComments();
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
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
