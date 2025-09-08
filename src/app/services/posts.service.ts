import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface PostIndexItem {
  slug: string; title: string; date: string; tags: string[]; excerpt: string;
}
export interface IndexData { posts: PostIndexItem[]; tags: Record<string, number>; }

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private index$ = this.http.get<IndexData>('/assets/blog/index.json').pipe(shareReplay(1));

  getIndex(): Observable<IndexData> { 
    return this.index$.pipe(
      map(data => ({
        ...data,
        posts: data.posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
    );
  }
  getPostHtml(slug: string): Observable<string> {
    return this.http.get(`/assets/blog/posts/${slug}.html`, { responseType: 'text' });
  }
}
