import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { PostsService } from '../services/posts.service';
import { ApiService } from '../services/api.service';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe, DatePipe, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <header class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Resolving Dependencies, One Idea at a Time.</h1>
          <p class="hero-subtitle">Thoughts on software engineering, system design, and the craft of building things</p>
          <nav class="hero-nav">
            <ul class="nav-list">
              <li>
                <a routerLink="/" class="nav-link">
                  <mat-icon>home</mat-icon>
                  <span>Home</span>
                </a>
              </li>
              <li>
                <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="nav-link">
                  <mat-icon>work</mat-icon>
                  <span>Portfolio</span>
                </a>
              </li>
              <li>
                <a href="https://github.com/sudharsanarajasekaran" target="_blank" rel="noopener" class="nav-link">
                  <mat-icon>code</mat-icon>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/sudharsanarajasekaran/" target="_blank" rel="noopener" class="nav-link">
                  <mat-icon>person</mat-icon>
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="main-content">
        <div class="content-layout">
          <div class="content-main">
            <!-- Welcome Section -->
            <section class="welcome-section fade-in">
              <h2>Welcome to my Log File</h2>
              <p class="welcome-subtitle">Exploring modern technology and the journey of solving real-world problems.</p>
              <p class="welcome-description">This blog is a collection of notes from the field, documenting the real-world tech challenges I encounter. I break down complex problems in software and systems, sharing the practical solutions and lessons learned along the way.</p>
            </section>
            
            <!-- Posts Section -->
            <section class="posts-section slide-up">
              <h3>Latest Posts</h3>
              <div class="posts-grid" *ngIf="(idx$|async) as idx; else loading">
                <div *ngFor="let p of idx.posts; let i = index" 
                     class="post-card hover-lift stagger-animation"
                     [style.animation-delay]="(i * 0.1) + 's'">
                  <h4 class="post-title">
                    <a [routerLink]="['/post', p.slug]">{{ p.title }}</a>
                  </h4>
                  <div class="post-meta">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ p.date | date:'MMM d, y' }}</span>
                  </div>
                  <p class="post-excerpt">{{ p.excerpt }}</p>
                  <div class="post-footer">
                    <div class="post-stats">
                      <span class="stat-item">
                        <mat-icon>thumb_up</mat-icon>
                        <span>{{ p.likeCount || 0 }}</span>
                      </span>
                    </div>
                    <a [routerLink]="['/post', p.slug]" class="read-more">Read more →</a>
                    <div class="social-links">
                      <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                      <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                      <a href="#" class="social-link"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                  </div>
                </div>
              </div>
              
              <ng-template #loading>
                <div class="loading">
                  <mat-spinner diameter="40"></mat-spinner>
                  <p>Loading posts...</p>
                </div>
              </ng-template>
            </section>
          </div>
          
          <!-- Sidebar -->
          <aside class="sidebar">
                        <!-- About Section -->
                        <div class="sidebar-card">
                          <h3>About Me</h3>
                          <div class="about-content">
                            <img src="assets/images/author-potrait-small.png" 
                                 alt="Sudharsana - Data Engineer" 
                                 class="author-image">
                            <p>Passionate about solving real-world problems with data, I'm a data engineer with experience building enterprise-level solutions. This is my digital garden where I share my thoughts and learnings.</p>
                            <a href="https://sudharsana.dev" target="_blank" rel="noopener" class="learn-more">Learn more →</a>
                          </div>
                        </div>
            
            <!-- Newsletter Section -->
            <div class="sidebar-card">
              <h3>Subscribe to Newsletter</h3>
              <p>Get the latest posts and updates delivered to your inbox.</p>
              <form class="newsletter-form">
                <div class="form-group">
                  <input type="email" placeholder="Enter your email" class="email-input">
                </div>
                <button type="submit" class="subscribe-btn">Subscribe</button>
              </form>
            </div>
            
            <!-- Tags Section -->
            <div class="sidebar-card" *ngIf="(idx$|async) as idx2">
              <h3>All Tags</h3>
              <div class="tags-grid">
                <span *ngFor="let t of (idx2.tags | keyvalue)" 
                      [routerLink]="['/tag', t.key]" 
                      class="tag-chip hover-glow">
                  {{t.key}} ({{t.value}})
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background-color: #f4f4f4;
    }
    
    .hero-section {
      background-color: #1a1a1a;
      color: white;
      text-align: center;
      padding: 4rem 2rem;
    }
    
    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      font-family: 'Playfair Display', serif;
      line-height: 1.2;
    }
    
    .hero-subtitle {
      font-size: 1rem;
      color: #b8b8b8;
      max-width: 900px;
      margin: 0 auto 2rem auto;
      line-height: 1.6;
      font-family: 'Roboto', sans-serif;
    }
    
    .hero-nav {
      margin-top: 2rem;
    }
    
    .nav-list {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      color: #b8b8b8;
      text-decoration: none;
      transition: all 0.3s ease;
      font-family: 'Roboto', sans-serif;
    }
    
    .nav-link:hover {
      background-color: #333;
      color: white;
    }
    
    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .main-content {
      padding: 4rem 2rem;
    }
    
    .content-layout {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      gap: 3rem;
    }
    
    .content-main {
      flex: 3;
    }
    
    .sidebar {
      flex: 1;
      min-width: 300px;
    }
    
    .welcome-section {
      text-align: center;
      margin-bottom: 5rem;
      padding: 3rem 0;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .welcome-section h2 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: #161616;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
    }
    
    .welcome-subtitle {
      font-size: 1.3rem;
      color: #525252;
      margin: 0 0 1.5rem 0;
      font-weight: 400;
      max-width: 700px;
      margin: 0 auto 1.5rem auto;
      line-height: 1.5;
      font-family: 'Roboto', sans-serif;
    }
    
    .welcome-description {
      font-size: 1.1rem;
      color: #525252;
      margin: 0;
      font-weight: 400;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
      text-align: left;
      padding: 0 2rem;
      font-family: 'Roboto', sans-serif;
    }
    
    .posts-section {
      margin-bottom: 3rem;
    }
    
    .posts-section h3 {
      font-size: 1.875rem;
      margin-bottom: 3rem;
      color: #161616;
      font-weight: 700;
      text-align: center;
      font-family: 'Playfair Display', serif;
    }
    
    .posts-grid {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
    
    .post-card {
      background-color: #ffffff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    
    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    .post-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #161616;
      margin-bottom: 1rem;
      font-family: 'Playfair Display', serif;
    }
    
    .post-title a {
      text-decoration: none;
      color: inherit;
      transition: color 0.2s ease;
    }
    
    .post-title a:hover {
      color: #0f62fe;
    }
    
    .post-meta {
      display: flex;
      align-items: center;
      color: #525252;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    
    .post-meta mat-icon {
      color: #525252;
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 0.5rem;
    }
    
    .post-excerpt {
      color: #525252;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      font-family: 'Roboto', sans-serif;
      flex-grow: 1;
    }
    
    .post-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
    }

    .post-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .stat-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .read-more {
      color: #0f62fe;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    
    .read-more:hover {
      color: #0f62fe;
    }
    
    .social-links {
      display: flex;
      gap: 0.75rem;
    }
    
    .social-link {
      color: #525252;
      text-decoration: none;
      transition: all 0.3s ease;
    }
    
    .social-link:hover {
      transform: scale(1.2);
    }
    
    .social-link:nth-child(1):hover {
      color: #1877f2;
    }
    
    .social-link:nth-child(2):hover {
      color: #1da1f2;
    }
    
    .social-link:nth-child(3):hover {
      color: #0077b5;
    }
    
    .sidebar-card {
      background-color: #ffffff;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    
    .sidebar-card h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #161616;
      margin-bottom: 1.5rem;
      font-family: 'Playfair Display', serif;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 1rem;
    }
    
    .about-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
                .author-image {
                  width: 8rem;
                  height: 8rem;
                  border-radius: 50%;
                  object-fit: cover;
                  object-position: 5% top;
                  margin-bottom: 1rem;
                  border: 2px solid #e0e0e0;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                  background-color: #f0f0e8;
                }
    
    .about-content p {
      color: #525252;
      line-height: 1.6;
      margin-bottom: 1rem;
      font-family: 'Roboto', sans-serif;
    }
    
    .learn-more {
      color: #0f62fe;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    
    .learn-more:hover {
      color: #0f62fe;
    }
    
    .newsletter-form {
      margin-top: 1rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .email-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 0.875rem;
      font-family: 'Roboto', sans-serif;
      transition: border-color 0.2s ease;
    }
    
    .email-input:focus {
      outline: none;
      border-color: #0f62fe;
    }
    
    .subscribe-btn {
      width: 100%;
      background-color: #0f62fe;
      color: white;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: 'Roboto', sans-serif;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .subscribe-btn:hover {
      background-color: #0043ce;
    }
    
    .tags-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }
    
    .tags-section h3 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #161616;
      font-weight: 600;
      text-align: center;
      font-family: 'Roboto', sans-serif;
    }
    
    .tags-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }
    
    .loading {
      text-align: center;
      padding: 3rem 2rem;
      color: #666;
    }
    
    .loading p {
      margin-top: 1rem;
    }
    
    /* Animation classes */
    .fade-in {
      animation: fadeIn 0.6s ease-in-out;
    }
    
    .slide-up {
      animation: slideUp 0.8s ease-out;
    }
    
    .hover-lift {
      transition: all 0.3s ease;
    }
    
    .hover-lift:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    .stagger-animation {
      opacity: 0;
      animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 1024px) {
      .content-layout {
        flex-direction: column;
        gap: 2rem;
      }
      
      .sidebar {
        min-width: auto;
      }
      
      .posts-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
    }
    
    @media (max-width: 768px) {
      .hero-section {
        padding: 2rem 1rem;
      }
      
      .hero-title {
        font-size: 2rem;
      }
      
      .hero-subtitle {
        font-size: 0.9rem;
        max-width: 100%;
        padding: 0 1rem;
      }
      
      .nav-list {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .nav-link {
        width: 200px;
        justify-content: center;
      }
      
      .main-content {
        padding: 2rem 1rem;
      }
      
      .content-layout {
        gap: 1.5rem;
      }
      
      .posts-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .welcome-section {
        padding: 2rem 1rem;
        margin-bottom: 3rem;
      }
      
      .welcome-section h2 {
        font-size: 2rem;
      }
      
      .welcome-subtitle {
        font-size: 1.1rem;
      }
      
      .welcome-description {
        font-size: 1rem;
        padding: 0 1rem;
        text-align: center;
      }
      
      .post-card {
        padding: 1.5rem;
      }
      
      .post-footer {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      .posts-section h2 {
        font-size: 1.6rem;
        margin-bottom: 1.5rem;
      }
      
      .tags-section h3 {
        font-size: 1.3rem;
        margin-bottom: 1.25rem;
      }
    }
    
    @media (max-width: 480px) {
      .welcome-section {
        padding: 1.5rem 0.75rem;
        margin-bottom: 2rem;
      }
      
      .welcome-section h1 {
        font-size: 1.8rem;
        margin-bottom: 1rem;
      }
      
      .welcome-subtitle {
        font-size: 1rem;
        margin-bottom: 1rem;
      }
      
      .welcome-description {
        font-size: 0.95rem;
        padding: 0 0.5rem;
        line-height: 1.6;
      }
      
      .posts-section {
        margin-bottom: 2rem;
      }
      
      .posts-section h2 {
        font-size: 1.4rem;
        margin-bottom: 1.25rem;
      }
      
      .posts-grid {
        gap: 1rem;
      }
      
      .post-card {
        margin-bottom: 0.5rem;
      }
      
      .tags-section {
        margin-top: 2rem;
        padding-top: 1.5rem;
      }
      
      .tags-section h3 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
      }
      
      .tags-grid {
        gap: 0.25rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  idx$: Observable<any>;
  
  constructor(
    private posts: PostsService,
    private apiService: ApiService
  ){
    this.idx$ = this.loadPostsWithStats();
  }

  ngOnInit() {
    // Component initialization if needed
  }

  private loadPostsWithStats(): Observable<any> {
    return this.posts.getIndex().pipe(
      map(indexData => {
        // Get all post IDs for fetching like counts
        const postIds = indexData.posts.map((post: any) => post.id || post.slug);
        
        // Create observables for each post's like count
        const likeObservables = postIds.map((postId: string) => 
          this.apiService.getLikes(postId).pipe(
            map(response => ({ postId, likes: response.likes })),
            catchError(error => {
              console.warn(`Error fetching likes for ${postId}:`, error);
              return of({ postId, likes: 0 });
            })
          )
        );
        
        // Use forkJoin to fetch all like counts in parallel
        return forkJoin(likeObservables).pipe(
          map(likeData => {
            // Create a map of postId to like count
            const likesMap = likeData.reduce((acc, item) => {
              acc[item.postId] = item.likes;
              return acc;
            }, {} as { [key: string]: number });
            
            // Add like counts to posts
            const postsWithLikes = indexData.posts.map((post: any) => ({
              ...post,
              likeCount: likesMap[post.id || post.slug] || 0
            }));
            
            return {
              ...indexData,
              posts: postsWithLikes
            };
          }),
          catchError(error => {
            console.error('Error fetching like counts:', error);
            // Fallback: return posts with default like counts
            const postsWithLikes = indexData.posts.map((post: any) => ({
              ...post,
              likeCount: 0
            }));
            return of({
              ...indexData,
              posts: postsWithLikes
            });
          })
        );
      }),
      // Flatten the nested observable
      map(observable => observable),
      // Use switchMap to handle the nested observable
      switchMap(observable => observable),
      catchError(error => {
        console.error('Error in loadPostsWithStats:', error);
        return this.posts.getIndex().pipe(
          map(indexData => {
            const postsWithLikes = indexData.posts.map((post: any) => ({
              ...post,
              likeCount: 0
            }));
            return {
              ...indexData,
              posts: postsWithLikes
            };
          })
        );
      })
    );
  }
}
