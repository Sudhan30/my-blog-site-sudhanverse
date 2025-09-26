import { Injectable, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Subject, of } from 'rxjs';
import { catchError, map, tap, takeUntil, retry, retryWhen, delay, take } from 'rxjs/operators';

export interface Comment {
  id: number;
  display_name: string;
  content: string;
  created_at: string;
  status?: string; // 'approved', 'pending', 'rejected', etc.
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

export interface UnlikeResponse {
  success: boolean;
  likes: number;
  clientId: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  status?: string;
  alreadySubscribed?: boolean;
  reactivated?: boolean;
}

export interface NewsletterStatusResponse {
  success: boolean;
  subscribed: boolean;
  status?: string;
  subscribedAt?: string;
  unsubscribedAt?: string;
}

export interface FeedbackSubmission {
  rating: number;
  feedback_text: string;
  name?: string;
  email?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback_id?: string;
  anonymous_name?: string;
}

export interface FeedbackStatsResponse {
  success: boolean;
  total_feedback: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
  recent_feedback: any[];
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
    
    // Ensure destroy$ is always initialized
    if (!this.destroy$) {
      this.destroy$ = new Subject<void>();
    }
  }

  private getOrCreateClientId(): string {
    if (isPlatformBrowser(this.platformId)) {
      let clientId = localStorage.getItem('blog_client_id');
      
      // Validate UUID format and regenerate if invalid
      if (!clientId || !this.isValidUUID(clientId)) {
        console.log('🔄 Invalid or missing clientId, generating new UUID');
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

  private isValidUUID(uuid: string): boolean {
    // Check if the string is a valid UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  getClientId(): string {
    try {
      return this.clientIdSubject?.value || '';
    } catch (error) {
      console.warn('Error getting client ID:', error);
      return '';
    }
  }

  // Generate a catchy anonymous name based on UUID
  generateAnonymousName(): string {
    const clientId = this.getClientId();
    
    // Check if we already have a name for this UUID
    if (isPlatformBrowser(this.platformId)) {
      const storedName = localStorage.getItem(`anonymous_name_${clientId}`);
      if (storedName) {
        return storedName;
      }
    }

    // Generate new name if not found
    const newName = this.createCatchyAnonymousName(clientId);
    
    // Store it for future use
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`anonymous_name_${clientId}`, newName);
    }
    
    return newName;
  }

  private createCatchyAnonymousName(clientId: string): string {
    // Animal names - catchy and memorable
    const animals = [
      'Tiger', 'Lion', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Panda', 'Dolphin',
      'Shark', 'Octopus', 'Penguin', 'Owl', 'Falcon', 'Lynx', 'Cheetah', 'Panther',
      'Phoenix', 'Dragon', 'Unicorn', 'Griffin', 'Phoenix', 'Sphinx', 'Pegasus',
      'Raven', 'Crow', 'Hawk', 'Falcon', 'Osprey', 'Kestrel', 'Merlin',
      'Lynx', 'Bobcat', 'Cougar', 'Jaguar', 'Leopard', 'Snow Leopard',
      'Orca', 'Narwhal', 'Beluga', 'Seal', 'Walrus', 'Manatee',
      'Koala', 'Kangaroo', 'Wombat', 'Platypus', 'Echidna', 'Quokka',
      'Sloth', 'Capybara', 'Tapir', 'Anteater', 'Armadillo', 'Pangolin'
    ];

    // Get a consistent animal based on UUID
    const uuidHash = this.hashString(clientId);
    const animalIndex = uuidHash % animals.length;
    const selectedAnimal = animals[animalIndex];

    // Generate a 5-character hash from UUID
    const hash = clientId.replace(/[^a-f0-9]/g, '').substring(0, 5);
    
    return `anonymous_${hash}_${selectedAnimal}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
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

  // Retry configuration for API calls
  private retryConfig = {
    retries: 3,
    delay: 2000, // 2 seconds
    backoff: 1000 // 1 second additional delay per retry
  };

  // Custom retry logic for server errors
  private retryWithBackoff() {
    return retryWhen(errors =>
      errors.pipe(
        delay(this.retryConfig.delay),
        take(this.retryConfig.retries)
      )
    );
  }

  // Get likes for a post
  getLikes(postId: string): Observable<LikesResponse> {
    return this.http.get<LikesResponse>(`${this.API_BASE_URL}/posts/${postId}/likes`, {
      headers: this.getHeaders()
    }).pipe(
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          // Only retry on server errors (5xx) and specific client errors
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying getLikes (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          // Don't retry for other errors
          throw error;
        }
      }),
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
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          // Only retry on server errors (5xx) and specific client errors
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying likePost (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          // Don't retry for other errors (like 400 "Already liked")
          throw error;
        }
      }),
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

  // Unlike a post
  unlikePost(postId: string): Observable<UnlikeResponse> {
    const clientId = this.getClientId();
    const userIP = this.getUserIP();
    
    return this.http.delete<UnlikeResponse>(`${this.API_BASE_URL}/posts/${postId}/unlike`, {
      headers: this.getHeaders(),
      body: {
        clientId,
        userIP
      }
    }).pipe(
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          // Only retry on server errors (5xx) and specific client errors
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying unlikePost (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          // Don't retry for other errors (like 400 "Already unliked" or 404)
          throw error;
        }
      }),
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
            likes: Math.max(0, 0), // Simulate a successful unlike
            clientId: clientId
          });
        }
        // For actual server errors (500, etc.), still throw the error
        return this.handleError(error);
      })
    );
  }

  // Get comments for a post
  getComments(postId: string, page: number = 1, limit: number = 10, status: string = 'approved'): Observable<CommentsResponse> {
    return this.http.get<CommentsResponse>(`${this.API_BASE_URL}/posts/${postId}/comments`, {
      headers: this.getHeaders(),
      params: {
        page: page.toString(),
        limit: limit.toString(),
        status: status
      }
    }).pipe(
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          // Only retry on server errors (5xx) and specific client errors
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying getComments (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          // Don't retry for other errors
          throw error;
        }
      }),
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

  // Get all comments for a post (no pagination)
  getAllComments(postId: string, status: string = 'approved'): Observable<CommentsResponse> {
    return this.http.get<CommentsResponse>(`${this.API_BASE_URL}/posts/${postId}/comments`, {
      headers: this.getHeaders(),
      params: {
        page: '1',
        limit: '1000', // Large number to get all comments
        status: status
      }
    }).pipe(
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying getAllComments (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          throw error;
        }
      }),
      catchError(error => {
        if (error.status === 0 || (error.name === 'HttpErrorResponse' && error.status === 0)) {
          console.warn('API not accessible (likely CORS issue in development). Using fallback data.');
          return of({
            postId: postId,
            comments: [],
            pagination: {
              page: 1,
              limit: 1000,
              total: 0,
              pages: 1
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
      retry({
        count: this.retryConfig.retries,
        delay: (error, retryCount) => {
          // Only retry on server errors (5xx) and specific client errors
          if (error.status >= 500 || error.status === 429 || error.status === 408) {
            console.log(`Retrying addComment (attempt ${retryCount}/${this.retryConfig.retries}) in ${this.retryConfig.delay}ms...`);
            return of(null).pipe(delay(this.retryConfig.delay + (retryCount * this.retryConfig.backoff)));
          }
          // Don't retry for other errors (like 400 validation errors)
          throw error;
        }
      }),
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
      // Clean up destroy$ subject
      if (this.destroy$ && !this.destroy$.closed) {
        this.destroy$.next();
        this.destroy$.complete();
      }
      
      // Clean up clientIdSubject
      if (this.clientIdSubject && !this.clientIdSubject.closed) {
        this.clientIdSubject.complete();
      }
    } catch (error) {
      console.warn('Error during service cleanup:', error);
    }
  }

  // Safety check for onDestroy
  private isDestroyed(): boolean {
    return !this.destroy$ || this.destroy$.closed;
  }

  // Safe observable creation
  private createSafeObservable<T>(observableFactory: () => Observable<T>): Observable<T> {
    if (this.isDestroyed()) {
      return of(null as any);
    }
    return observableFactory();
  }

  // Newsletter subscription methods
  subscribeToNewsletter(email: string): Observable<NewsletterResponse> {
    return this.createSafeObservable(() => 
      this.http.post<NewsletterResponse>(`${this.API_BASE_URL}/newsletter/subscribe`, { email }).pipe(
        retry(3),
        catchError(this.handleError)
      )
    );
  }

  unsubscribeFromNewsletter(email: string): Observable<NewsletterResponse> {
    return this.createSafeObservable(() => 
      this.http.post<NewsletterResponse>(`${this.API_BASE_URL}/newsletter/unsubscribe`, { email }).pipe(
        retry(3),
        catchError(this.handleError)
      )
    );
  }

  checkNewsletterStatus(email: string): Observable<NewsletterStatusResponse> {
    return this.createSafeObservable(() => 
      this.http.get<NewsletterStatusResponse>(`${this.API_BASE_URL}/newsletter/status?email=${encodeURIComponent(email)}`).pipe(
        retry(3),
        catchError(this.handleError)
      )
    );
  }

  // Feedback collection methods
  submitFeedback(feedback: FeedbackSubmission): Observable<FeedbackResponse> {
    console.log('🚀 Submitting feedback to:', `${this.API_BASE_URL}/feedback`);
    console.log('📝 Feedback data:', feedback);
    
    // Ensure client ID is generated
    this.getOrCreateClientId();
    
    // Get client ID for the request
    const clientId = this.getClientId();
    console.log('🔑 Generated clientId:', clientId);
    
    if (!clientId || clientId === '') {
      console.error('❌ No clientId available, generating new one');
      const newClientId = this.generateClientId();
      this.clientIdSubject.next(newClientId);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('blog_client_id', newClientId);
      }
    }
    
    const finalClientId = this.getClientId();
    const requestBody = {
      ...feedback,
      clientId: finalClientId
    };
    
    console.log('📝 Request body with clientId:', requestBody);
    
    return this.createSafeObservable(() => 
      this.http.post<FeedbackResponse>(`${this.API_BASE_URL}/feedback`, requestBody).pipe(
        retry(3),
        catchError(error => {
          console.error('❌ Feedback API error:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error URL:', error.url);
          console.error('❌ Error body:', error.error);
          console.error('❌ Full error object:', JSON.stringify(error, null, 2));
          
          // If it's a network/CORS error, return a simulated success response
          if (error.status === 0 || error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
            console.log('🔄 Using fallback for feedback submission (Network/CORS error)');
            return of({
              success: true,
              message: 'Thank you for your feedback! (Simulated in development)',
              feedback_id: 'simulated-' + Date.now(),
              anonymous_name: 'Happy Reader'
            });
          }
          
          // If it's a 404, the endpoint doesn't exist yet
          if (error.status === 404) {
            console.log('🔄 Using fallback for feedback submission (Endpoint not found)');
            return of({
              success: true,
              message: 'Thank you for your feedback! (Backend endpoint not yet deployed)',
              feedback_id: 'simulated-' + Date.now(),
              anonymous_name: 'Happy Reader'
            });
          }
          
          // If it's a 400 with UUID error, try to regenerate clientId
          const errorText = error.error?.error || error.error?.message || error.message || JSON.stringify(error.error) || '';
          console.log('🔍 Error text for UUID detection:', errorText);
          const isUuidError = errorText.includes('UUID') || 
                              errorText.includes('UUID is required') || 
                              errorText.includes('Invalid UUID') ||
                              errorText.includes('clientId') ||
                              (error.status === 400 && errorText.includes('required'));
          console.log('🔍 Is UUID error detected:', isUuidError);
          
          if (error.status === 400 && isUuidError) {
            console.log('🔄 UUID error detected, regenerating clientId and retrying');
            const newClientId = this.generateClientId();
            this.clientIdSubject.next(newClientId);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('blog_client_id', newClientId);
            }
            
            // Retry with new clientId
            const retryRequestBody = {
              ...feedback,
              clientId: newClientId
            };
            
            return this.http.post<FeedbackResponse>(`${this.API_BASE_URL}/feedback`, retryRequestBody).pipe(
              catchError(retryError => {
                console.log('🔄 Retry failed, using fallback for feedback submission (UUID error)');
                return of({
                  success: true,
                  message: 'Thank you for your feedback! (UUID validation issue)',
                  feedback_id: 'simulated-' + Date.now(),
                  anonymous_name: 'Happy Reader'
                });
              })
            );
          }
          
          // If it's a 500, server error
          if (error.status === 500) {
            console.log('🔄 Using fallback for feedback submission (Server error)');
            return of({
              success: true,
              message: 'Thank you for your feedback! (Server temporarily unavailable)',
              feedback_id: 'simulated-' + Date.now(),
              anonymous_name: 'Happy Reader'
            });
          }
          
          return this.handleError(error);
        })
      )
    );
  }

  getFeedbackStats(): Observable<FeedbackStatsResponse> {
    return this.createSafeObservable(() => 
      this.http.get<FeedbackStatsResponse>(`${this.API_BASE_URL}/feedback/stats`).pipe(
        retry(3),
        catchError(this.handleError)
      )
    );
  }

  getRecentFeedback(limit: number = 10): Observable<any[]> {
    return this.createSafeObservable(() => 
      this.http.get<any[]>(`${this.API_BASE_URL}/feedback/recent?limit=${limit}`).pipe(
        retry(3),
        catchError(this.handleError)
      )
    );
  }
}
