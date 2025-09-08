import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PostsService } from '../services/posts.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    RouterLink, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSnackBarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    CommonModule
  ],
  template: `
    <div class="blog-container">
      <!-- Header -->
      <header class="blog-header">
        <div class="header-content">
          <h1 class="site-title">SudharVerse</h1>
                  <nav class="header-nav">
                    <a [routerLink]="['/']" class="nav-link">Home</a>
                    <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" class="nav-link">Contact</a>
                  </nav>
        </div>
      </header>

      <!-- Main Content -->
      <main class="blog-main">
        <article class="blog-article">
          <!-- Article Content -->
          <div class="article-content">
            <div [innerHTML]="html"></div>
          </div>

          <!-- Article Footer -->
          <footer class="article-footer">
            <div class="interaction-buttons">
              <button 
                class="interaction-btn"
                [class.clapped]="hasClapped"
                (click)="clap()"
                [disabled]="hasClapped">
                <mat-icon>{{ hasClapped ? 'thumb_up' : 'thumb_up_off_alt' }}</mat-icon>
                <span>{{ clapCount }}</span>
              </button>
              
              <button class="interaction-btn">
                <mat-icon>chat_bubble_outline</mat-icon>
                <span>{{ comments.length }}</span>
              </button>
              
              <div class="share-buttons">
                <button class="share-btn" (click)="shareOnTwitter()">
                  <mat-icon>link</mat-icon>
                </button>
                <a class="share-btn" (click)="shareOnReddit()">
                  <i class="fab fa-reddit-alien"></i>
                </a>
                <a class="share-btn" (click)="shareOnLinkedIn()">
                  <i class="fab fa-linkedin-in"></i>
                </a>
                <a class="share-btn" (click)="shareOnTwitter()">
                  <i class="fa-brands fa-x-twitter"></i>
                </a>
              </div>
            </div>
          </footer>
        </article>

        <!-- Author Section -->
        <section class="author-section">
          <div class="author-content">
                    <img
                      alt="Author's avatar"
                      class="author-avatar"
                      src="assets/images/author-potrait-small.png"
                      onerror="this.src='https://via.placeholder.com/80x80/6b7280/ffffff?text=S'">
            <div class="author-info">
              <div class="author-header">
                <div>
                  <h3 class="author-name">About the Author</h3>
                  <p class="author-bio">Passionate about solving real-world problems with data, I'm a data engineer with experience building enterprise-level solutions. This is my digital garden where I share my thoughts and learnings.</p>
                </div>
                <div class="author-social">
                  <a href="https://twitter.com/sudharsana" target="_blank" rel="noopener" class="social-link">
                    <i class="fa-brands fa-x-twitter"></i>
                  </a>
                  <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" class="social-link">
                    <i class="fab fa-linkedin-in"></i>
                  </a>
                  <a href="https://github.com/sudharsanarajasekaran" target="_blank" rel="noopener" class="social-link">
                    <i class="fab fa-github"></i>
                  </a>
                </div>
              </div>
              <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="author-more">More from this author →</a>
            </div>
          </div>
        </section>

        <!-- Responses Section -->
        <section class="responses-section">
          <h3 class="responses-title">Responses ({{ comments.length }})</h3>
          
          <!-- Response Form -->
          <div class="response-form">
            <form [formGroup]="commentForm" (ngSubmit)="submitComment()">
              <div class="form-group">
                <input 
                  type="text" 
                  formControlName="name" 
                  placeholder="Your name (optional)"
                  class="form-input">
              </div>
              <div class="form-group">
                <textarea 
                  formControlName="comment" 
                  rows="4" 
                  placeholder="Share your thoughts..."
                  required
                  class="form-textarea">
                </textarea>
              </div>
              <button 
                type="submit"
                [disabled]="commentForm.get('comment')?.invalid || isSubmitting"
                class="submit-btn">
                {{ isSubmitting ? 'Posting...' : 'Post Response' }}
              </button>
            </form>
          </div>

          <!-- Responses List -->
          <div class="responses-list">
            <div 
              *ngFor="let comment of comments; let i = index" 
              class="response-item">
                      <img
                        alt="Avatar"
                        class="response-avatar"
                        src="https://ui-avatars.com/api/?name={{ comment.name }}&size=32&background=6b7280&color=ffffff&bold=true">
              <div class="response-content">
                <div class="response-card">
                  <p class="response-author">{{ comment.name }}</p>
                  <p class="response-text">{{ comment.comment }}</p>
                </div>
                <div class="response-actions">
                  <button 
                    class="like-btn"
                    [class.liked]="comment.liked"
                    (click)="toggleLike(comment)">
                    <mat-icon>{{ comment.liked ? 'thumb_up' : 'thumb_up_off_alt' }}</mat-icon>
                    <span>Like</span>
                  </button>
                          <span class="response-date">{{ getTimeAgo(comment.date) }}</span>
                </div>
              </div>
            </div>
            
            <div *ngIf="comments.length === 0" class="no-responses">
              <p>No responses yet. Be the first to share your thoughts!</p>
            </div>
          </div>
        </section>
      </main>

    </div>
  `,
  styles: [`
    /* Global Styles */
    body {
      font-family: 'Open Sans', sans-serif;
      background-color: #f8fafc;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Lora', serif;
    }

    .fa-x-twitter {
      font-family: "Font Awesome 6 Brands";
      font-weight: 400;
    }

    /* Main Container */
    .blog-container {
      background-color: #f8fafc;
      min-height: 100vh;
    }

    /* Header */
    .blog-header {
      background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
      color: #b8b8b8;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid #404040;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .site-title {
      font-size: 1.25rem;
      font-weight: bold;
      font-family: 'Lora', serif;
      margin: 0;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .header-nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      color: #b8b8b8;
      text-decoration: none;
      transition: color 0.2s ease;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.9rem;
    }

    .nav-link:hover {
      color: #ffffff;
    }

    /* Main Content */
    .blog-main {
      max-width: 64rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    /* Article */
    .blog-article {
      margin-bottom: 4rem;
    }

    .article-header {
      margin-bottom: 3rem;
      text-align: center;
      padding-top: 2rem;
    }

    .article-title {
      font-size: 2.5rem;
      font-weight: bold;
      color: #111827;
      margin-bottom: 1rem;
      line-height: 1.2;
      font-family: 'Lora', serif;
    }

    .article-meta {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .meta-separator {
      margin: 0 0.5rem;
    }

    /* Article Content */
    .article-content {
      font-size: 1.125rem;
      color: #374151;
      line-height: 1.7;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #111827;
      font-weight: 600;
    }

    /* Main heading - match HTML template exactly */
    .article-content h1 {
      font-size: 2.25rem;
      font-weight: 700;
      line-height: 1.1;
      text-align: center;
      margin: 0 0 1rem 0;
      color: #111827;
    }

    @media (min-width: 768px) {
      .article-content h1 {
        font-size: 3rem;
      }
    }

    /* Publication date styling */
    .article-content p:first-of-type {
      text-align: center;
      color: #6b7280;
      font-style: normal;
      margin-bottom: 2rem;
      font-size: 0.875rem;
      font-weight: 400;
    }

    .article-content h2 {
      font-size: 1.875rem;
      font-weight: bold;
      margin: 3rem 0 1.5rem 0;
      color: #111827;
    }

    .article-content p {
      margin-bottom: 1.5rem;
      font-weight: 400;
      letter-spacing: -0.01em;
    }

    .article-content ul {
      list-style-type: disc;
      padding-left: 2rem;
      margin-bottom: 1.5rem;
    }

    .article-content li {
      margin-bottom: 0.5rem;
    }

    /* Article Footer */
    .article-footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .interaction-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }

    .interaction-btn {
      display: flex;
      align-items: center;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .interaction-btn:hover {
      color: #111827;
    }

    .interaction-btn.clapped {
      color: #3b82f6;
    }

    .interaction-btn mat-icon {
      font-size: 1.25rem;
      margin-right: 0.25rem;
    }

    .share-buttons {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .share-btn {
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
    }

    .share-btn:hover {
      color: #111827;
    }

    .share-btn i {
      font-size: 1.25rem;
    }

    /* Author Section */
    .author-section {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .author-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .author-avatar {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      object-fit: cover;
      object-position: center 80%;
      background-color: #f0f0e8;
    }

    .author-info {
      flex: 1;
    }

    .author-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .author-name {
      font-size: 1.25rem;
      font-weight: bold;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .author-bio {
      color: #374151;
      max-width: 36rem;
      margin: 0;
    }

    .author-social {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .social-link {
      color: #6b7280;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .social-link:hover {
      color: #111827;
    }

    .social-link i {
      font-size: 1.125rem;
    }

    .author-more {
      display: inline-block;
      margin-top: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #4f46e5;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .author-more:hover {
      color: #3730a3;
    }

    /* Responses Section */
    .responses-section {
      margin-top: 4rem;
    }

    .responses-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 2rem;
      color: #111827;
    }

    /* Response Form */
    .response-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-family: 'Open Sans', sans-serif;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .submit-btn {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .submit-btn:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    /* Responses List */
    .responses-list {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .response-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .response-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      object-fit: cover;
    }

    .response-content {
      flex: 1;
    }

    .response-card {
      background: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .response-author {
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #111827;
    }

    .response-text {
      color: #6b7280;
      margin: 0;
    }

    .response-actions {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .like-btn {
      display: flex;
      align-items: center;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .like-btn:hover {
      color: #111827;
    }

    .like-btn.liked {
      color: #3b82f6;
    }

    .like-btn mat-icon {
      font-size: 1rem;
      margin-right: 0.25rem;
    }

    .response-date {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .no-responses {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-style: italic;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .blog-main {
        padding: 2rem 1rem;
      }

      .article-title {
        font-size: 2rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .header-nav {
        gap: 0.5rem;
      }

      .author-content {
        flex-direction: column;
        text-align: center;
      }

      .author-header {
        flex-direction: column;
        align-items: center;
      }

      .interaction-buttons {
        flex-direction: column;
        gap: 1rem;
      }

      .share-buttons {
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .blog-header {
        padding: 0.5rem 1rem;
      }

      .blog-main {
        padding: 1.5rem 0.75rem;
      }

      .article-title {
        font-size: 1.75rem;
      }

      .article-content {
        font-size: 1rem;
      }

      .article-content h1 {
        font-size: 2rem;
      }

      .author-avatar {
        width: 4rem;
        height: 4rem;
        object-fit: cover;
        object-position: center 80%;
        background-color: #f0f0e8;
      }

      .response-avatar {
        width: 1.75rem;
        height: 1.75rem;
      }
    }
  `]
})
export class PostComponent implements OnInit {
  html: SafeHtml = '';
  clapCount = 0;
  hasClapped = false;
  commentForm: FormGroup;
  comments: any[] = [];
  isSubmitting = false;
  currentSlug = '';

  constructor(
    private route: ActivatedRoute, 
    private posts: PostsService, 
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.commentForm = this.fb.group({
      name: [''],
      comment: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.currentSlug = params['slug'];
      this.loadPost();
      this.loadClapCount();
      this.loadComments();
    });
  }

  loadPost() {
    this.posts.getPostHtml(this.currentSlug).subscribe({
      next: (html: string) => {
        this.html = this.sanitizer.bypassSecurityTrustHtml(html);
      },
      error: (err: any) => {
        console.error('Error loading post:', err);
        this.html = this.sanitizer.bypassSecurityTrustHtml('<p>Post not found.</p>');
      }
    });
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  clap() {
    if (!this.hasClapped) {
      this.clapCount++;
      this.hasClapped = true;
      this.saveClapCount();
    }
  }

  shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this blog post');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  shareOnReddit() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('Check out this blog post');
    window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank');
  }

  generateAnonymousName(): string {
    const stars = ['★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '⭐', '🌟', '💫', '✨'];
    const randomStar = stars[Math.floor(Math.random() * stars.length)];
    const timestamp = Date.now().toString(16).slice(-6);
    return `anonymous_${randomStar}_${timestamp}`;
  }

  submitComment() {
    if (this.commentForm.get('comment')?.valid) {
      this.isSubmitting = true;
      
      const name = this.commentForm.value.name?.trim() || this.generateAnonymousName();
      
      const newComment = {
        name: name,
        comment: this.commentForm.value.comment,
        date: new Date(),
        likes: 0,
        liked: false
      };

      setTimeout(() => {
        this.comments.unshift(newComment);
        this.saveComments();
        this.commentForm.reset();
        this.isSubmitting = false;
        this.snackBar.open('Response posted successfully!', 'Close', { duration: 3000 });
      }, 1000);
    }
  }

  toggleLike(comment: any) {
    if (comment.liked) {
      comment.likes = (comment.likes || 1) - 1;
      comment.liked = false;
    } else {
      comment.likes = (comment.likes || 0) + 1;
      comment.liked = true;
    }
    this.saveComments();
  }

  private loadClapCount() {
    const saved = localStorage.getItem(`claps_${this.currentSlug}`);
    if (saved) {
      const data = JSON.parse(saved);
      this.clapCount = data.count || 0;
      this.hasClapped = data.hasClapped || false;
    }
  }

  private saveClapCount() {
    const data = {
      count: this.clapCount,
      hasClapped: this.hasClapped
    };
    localStorage.setItem(`claps_${this.currentSlug}`, JSON.stringify(data));
  }

  private loadComments() {
    const saved = localStorage.getItem(`comments_${this.currentSlug}`);
    if (saved) {
      this.comments = JSON.parse(saved).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }
  }

  private saveComments() {
    // Sort comments by date (latest first) before saving
    const sortedComments = this.comments.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    localStorage.setItem(`comments_${this.currentSlug}`, JSON.stringify(sortedComments));
  }
}