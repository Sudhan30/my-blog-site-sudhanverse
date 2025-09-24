import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

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
export class ApiService {
  private http = inject(HttpClient);
  private readonly API_BASE_URL = 'https://blog.sudharsana.dev/api';
  
  // Client ID for tracking likes/comments
  private clientIdSubject = new BehaviorSubject<string>(this.getOrCreateClientId());
  public clientId$ = this.clientIdSubject.asObservable();

  constructor() {
    // Initialize client ID
    this.getOrCreateClientId();
  }

  private getOrCreateClientId(): string {
    let clientId = localStorage.getItem('blog_client_id');
    if (!clientId) {
      clientId = this.generateClientId();
      localStorage.setItem('blog_client_id', clientId);
    }
    this.clientIdSubject.next(clientId);
    return clientId;
  }

  private generateClientId(): string {
    return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private getClientId(): string {
    return this.clientIdSubject.value;
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
      catchError(this.handleError)
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
      catchError(this.handleError)
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
      catchError(this.handleError)
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
      catchError(this.handleError)
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
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
