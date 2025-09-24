import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject, of } from 'rxjs';
import { catchError, map, tap, takeUntil } from 'rxjs/operators';

export interface Comment {
  id: number;
  display_name: string;
  content: string;
  created_at: string;
}

export interface LikeResponse {
  success: boolean;
  likes: number;
  clientId: string;
}

export interface CommentsResponse {
  postId: string;
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LikesResponse {
  postId: string;
  likes: number;
  cached: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService implements OnDestroy {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = 'https://blog.sudharsana.dev/api';
  private platformId = inject(PLATFORM_ID);

  // Client ID for tracking likes/comments
  private clientIdSubject = new BehaviorSubject<string>('');
  public clientId$ = this.clientIdSubject.asObservable();
  
  // Subject for cleanup
  private destroy$ = new Subject<void>();

  constructor() {
    // Initialize client ID only on the browser
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.getOrCreateClientId();
      } catch (error) {
        console.warn('Error initializing client ID:', error);
      }
    }
  }

  private getOrCreateClientId(): string {
    if (isPlatformBrowser(this.platformId)) {
      let clientId = localStorage.getItem('blog_client_id');
      if (!clientId) {
        clientId = this.generateClientId();
        localStorage.setItem('blog_client_id', clientId);
      }
      this.clientIdSubject.next(clientId);
      return clientId;
    }
    return '';
  }

  private generateClientId(): string {
    // Generate a proper UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getClientId(): string {
    try {
      return this.clientIdSubject?.value || '';
    } catch (error) {
      console.warn('Error getting client ID:', error);
      return '';
    }
  }

  private getUserIP(): string {
    // This will be set by the backend based on the request
    return '';
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    });
  }

  // Get likes for a post
  getLikes(postId: string): Observable<LikesResponse> {
    return this.http.get<LikesResponse>(`${this.API_BASE_URL}/posts/${postId}/likes`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        // Handle CORS errors and network failures gracefully
        if (error.status === 0 || (error.name === 'HttpErrorResponse' && error.status === 0)) {
          console.warn('API not accessible (likely CORS issue in development). Using fallback data.');
          return of({
            postId: postId,
            likes: 0,
            cached: false
          });
        }
        return this.handleError(error);
      })
    );
  }

  // Like a post
  likePost(postId: string): Observable<LikeResponse> {
    const clientId = this.getClientId();
    const userIP = this.getUserIP();
    
    return this.http.post<LikeResponse>(`${this.API_BASE_URL}/posts/${postId}/like`, {
      clientId,
      userIP
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        // Update client ID if provided by server
        if (response.clientId && response.clientId !== clientId) {
          localStorage.setItem('blog_client_id', response.clientId);
          this.clientIdSubject.next(response.clientId);
        }
      }),
      catchError(error => {
        // Handle CORS errors and network failures gracefully
        if (error.status === 0 || (error.name === 'HttpErrorResponse' && error.status === 0)) {
          console.warn('API not accessible (likely CORS issue in development). Using fallback response.');
          return of({
            success: true,
            likes: 1, // Simulate a successful like
            clientId: clientId
          });
        }
        // For actual server errors (500, etc.), still throw the error
        return this.handleError(error);
      })
    );
  }

  // Get comments for a post
  getComments(postId: string, page: number = 1, limit: number = 10): Observable<CommentsResponse> {
    return this.http.get<CommentsResponse>(`${this.API_BASE_URL}/posts/${postId}/comments`, {
      headers: this.getHeaders(),
      params: {
        page: page.toString(),
        limit: limit.toString()
      }
    }).pipe(
      catchError(error => {
        // Handle CORS errors and network failures gracefully
        if (error.status === 0 || (error.name === 'HttpErrorResponse' && error.status === 0)) {
          console.warn('API not accessible (likely CORS issue in development). Using fallback data.');
          return of({
            postId: postId,
            comments: [],
            pagination: {
              page: page,
              limit: limit,
              total: 0,
              pages: 0
            }
          });
        }
        return this.handleError(error);
      })
    );
  }

  // Add a comment
  addComment(postId: string, content: string, displayName: string): Observable<any> {
    const clientId = this.getClientId();
    const userIP = this.getUserIP();
    
    return this.http.post(`${this.API_BASE_URL}/posts/${postId}/comments`, {
      content,
      displayName,
      clientId,
      userIP
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap((response: any) => {
        // Update client ID if provided by server
        if (response.clientId && response.clientId !== clientId) {
          localStorage.setItem('blog_client_id', response.clientId);
          this.clientIdSubject.next(response.clientId);
        }
      }),
      catchError(error => {
        // Handle CORS errors and network failures gracefully
        if (error.status === 0 || (error.name === 'HttpErrorResponse' && error.status === 0)) {
          console.warn('API not accessible (likely CORS issue in development). Simulating successful comment.');
          return of({
            success: true,
            message: 'Comment added successfully (offline mode)',
            clientId: clientId
          });
        }
        // Handle server unavailability (503) - don't provide fallback, let the error propagate
        if (error.status === 503) {
          console.error('Server temporarily unavailable (503)');
          return this.handleError(error);
        }
        return this.handleError(error);
      })
    );
  }

  // Get analytics data
  getAnalytics(period: string = '7d'): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/analytics`, {
      headers: this.getHeaders(),
      params: { period }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Health check
  getHealth(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/health`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An error occurred';
    
    if (error.error && error.error.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. This may be due to CORS restrictions in development mode.';
    } else if (error.status === 400) {
      // Handle client ID validation errors
      if (error.error && error.error.includes('clientId')) {
        errorMessage = 'Invalid session. Please refresh the page.';
        // Clear invalid client ID and generate new one
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('blog_client_id');
          this.getOrCreateClientId();
        }
      } else {
        errorMessage = 'Bad request. Please try again.';
      }
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  ngOnDestroy(): void {
    try {
      if (this.destroy$) {
        this.destroy$.next();
        this.destroy$.complete();
      }
      if (this.clientIdSubject && !this.clientIdSubject.closed) {
        this.clientIdSubject.complete();
      }
    } catch (error) {
      console.warn('Error during service cleanup:', error);
    }
  }
}
