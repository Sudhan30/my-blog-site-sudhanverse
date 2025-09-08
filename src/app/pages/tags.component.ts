import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { map } from 'rxjs/operators';
import { PostsService } from '../services/posts.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  standalone: true,
  imports: [RouterLink, NgFor, NgIf, AsyncPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="tags-container">
      <div class="back-link slide-in-left">
        <button mat-button [routerLink]="['/']" color="primary" class="hover-lift">
          <mat-icon>arrow_back</mat-icon>
          Back to blog
        </button>
      </div>
      
      <div class="tag-header slide-up">
        <h1>Posts tagged with "{{ tag }}"</h1>
        <mat-chip-set>
          <mat-chip color="primary" selected>{{ tag }}</mat-chip>
        </mat-chip-set>
      </div>
      
      <div class="posts-list fade-in" *ngIf="(posts$|async) as posts; else noPosts">
        <mat-card class="post-card hover-lift stagger-animation" 
                  *ngFor="let p of posts; let i = index"
                  [style.animation-delay]="(i * 0.1) + 's'">
          <mat-card-header>
            <mat-card-title>
              <a [routerLink]="['/post', p.slug]" class="post-title">{{ p.title }}</a>
            </mat-card-title>
            <mat-card-subtitle>
              <mat-icon>schedule</mat-icon>
              {{ p.date | date:'MMM d, y' }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="post-excerpt">{{ p.excerpt }}</p>
            <div class="post-tags" *ngIf="p.tags?.length">
              <mat-chip-set>
                <mat-chip *ngFor="let t of p.tags" [routerLink]="['/tag', t]" class="hover-scale">
                  {{t}}
                </mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button [routerLink]="['/post', p.slug]" color="primary" class="hover-glow">
              Read more
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <ng-template #noPosts>
        <div class="no-posts scale-in">
          <mat-icon>tag</mat-icon>
          <h3>No posts found for this tag</h3>
          <p>Try browsing other tags or go back to the main page.</p>
          <button mat-button [routerLink]="['/']" color="primary" class="hover-glow">
            <mat-icon>home</mat-icon>
            Back to Home
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .tags-container {
      max-width: 100%;
      margin: 0;
      padding: 2rem 1rem;
      width: 100%;
    }
    
    .back-link {
      margin-bottom: 2rem;
    }
    
    .tag-header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem 0;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .tag-header h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #161616;
      font-weight: 600;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    
    .posts-list {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
    
    .post-card {
      margin-bottom: 1rem;
    }
    
    .post-title {
      color: #161616;
      text-decoration: none;
      font-weight: 600;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    
    .post-title:hover {
      color: #0f62fe;
      text-decoration: none;
    }
    
    .post-excerpt {
      color: #525252;
      line-height: 1.5;
      margin-bottom: 1rem;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    
    .post-tags {
      margin-bottom: 1rem;
    }
    
    .no-posts {
      text-align: center;
      padding: 4rem 2rem;
      color: #525252;
    }
    
    .no-posts mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #8d8d8d;
      margin-bottom: 1rem;
    }
    
    .no-posts h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #161616;
      font-family: 'IBM Plex Sans', sans-serif;
      font-weight: 600;
    }
    
    .no-posts p {
      margin-bottom: 2rem;
      font-size: 1.1rem;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    
    
    @media (max-width: 768px) {
      .tags-container {
        max-width: 100%;
        padding: 1rem 0.75rem;
      }
      
      .tag-header {
        padding: 1.5rem 1rem;
        margin-bottom: 2rem;
      }
      
      .tag-header h1 {
        font-size: 2rem;
      }
      
      .posts-list {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      
      .back-link {
        margin-bottom: 1.5rem;
      }
    }
    
    @media (max-width: 480px) {
      .tags-container {
        padding: 0.75rem 0.5rem;
      }
      
      .tag-header {
        padding: 1rem 0.75rem;
        margin-bottom: 1.5rem;
      }
      
      .tag-header h1 {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
      }
      
      .posts-list {
        gap: 1rem;
      }
      
      .post-card {
        margin-bottom: 0.5rem;
      }
      
      .no-posts {
        padding: 2rem 1rem;
      }
      
      .no-posts mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }
      
      .no-posts h3 {
        font-size: 1.3rem;
      }
      
      .no-posts p {
        font-size: 1rem;
      }
    }
  `]
})
export class TagsComponent {
  tag = this.route.snapshot.paramMap.get('tag') || '';
  posts$ = this.posts.getIndex().pipe(map(idx => idx.posts.filter(p => p.tags?.includes(this.tag))));
  constructor(private route: ActivatedRoute, private posts: PostsService) {}
}
