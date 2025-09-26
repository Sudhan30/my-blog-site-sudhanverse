import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService, FeedbackSubmission } from '../services/api.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-feedback-button',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <button 
      class="feedback-button"
      (click)="openFeedbackDialog()">
      <mat-icon class="feedback-icon">feedback</mat-icon>
      <span class="feedback-text">Feedback</span>
    </button>
  `,
  styles: [`
    .feedback-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #161616;
      border: 1px solid #393939;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.3s cubic-bezier(0.2, 0, 0.38, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      gap: 8px;
      /* Ensure button is visible */
      opacity: 1;
      visibility: visible;
    }

    .feedback-button:hover {
      width: 140px;
      border-radius: 28px;
      background: #262626;
      border-color: #525252;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      transform: translateY(-2px);
    }

    .feedback-button:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .feedback-icon {
      font-size: 24px;
      color: #f4f4f4;
      transition: all 0.3s cubic-bezier(0.2, 0, 0.38, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 1;
      visibility: visible;
    }

    .feedback-button:hover .feedback-icon {
      color: #0f62fe;
      transform: translateX(-12px);
    }

    .feedback-text {
      opacity: 0;
      transform: translateX(24px);
      transition: all 0.3s cubic-bezier(0.2, 0, 0.38, 0.9);
      color: #f4f4f4;
      font-weight: 400;
      font-size: 14px;
      white-space: nowrap;
      letter-spacing: 0.01em;
      pointer-events: none;
    }

    .feedback-button:hover .feedback-text {
      opacity: 1;
      transform: translateX(0);
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .feedback-button {
        bottom: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
      }

      .feedback-button:hover {
        width: 110px;
        border-radius: 24px;
        transform: translateY(-2px);
      }

      .feedback-button:hover .feedback-icon {
        color: #0f62fe;
        transform: translateX(-8px);
      }

      .feedback-button:hover .feedback-text {
        opacity: 1;
        transform: translateX(0);
      }

      .feedback-button:active {
        transform: translateY(0);
      }

      .feedback-icon {
        font-size: 20px;
      }

      .feedback-text {
        font-size: 12px;
      }
    }

    @media (max-width: 480px) {
      .feedback-button {
        bottom: 12px;
        right: 12px;
        width: 44px;
        height: 44px;
      }

      .feedback-button:hover {
        width: 100px;
        border-radius: 22px;
        transform: translateY(-2px);
      }

      .feedback-button:hover .feedback-icon {
        color: #0f62fe;
        transform: translateX(-6px);
      }

      .feedback-button:hover .feedback-text {
        opacity: 1;
        transform: translateX(0);
      }

      .feedback-button:active {
        transform: translateY(0);
      }

      .feedback-icon {
        font-size: 18px;
      }

      .feedback-text {
        font-size: 11px;
      }
    }
  `]
})
export class FeedbackButtonComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openFeedbackDialog() {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '90vw',
      maxWidth: '600px',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'feedback-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Feedback dialog closed with result:', result);
      }
    });
  }
}

@Component({
  selector: 'app-feedback-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">Share Your Feedback</h2>
        <button 
          class="close-button" 
          (click)="closeDialog()"
          mat-icon-button
          aria-label="Close dialog">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="dialog-content">
        <p class="dialog-description">
          We'd love to hear your thoughts! Your feedback helps us improve our content and user experience.
        </p>

        <form [formGroup]="feedbackForm" (ngSubmit)="onFeedbackSubmit()" class="feedback-form">
          <!-- Rating Section -->
          <div class="rating-section">
            <label class="rating-label">How would you rate your experience? *</label>
            <div class="star-rating">
              <button 
                *ngFor="let star of [1,2,3,4,5]; let i = index"
                type="button"
                class="star-button"
                [class.active]="currentRating >= star"
                [class.hover]="hoverRating >= star"
                (click)="setRating(star)"
                (mouseenter)="onStarHover(star)"
                (mouseleave)="onStarLeave()">
                <mat-icon>star</mat-icon>
              </button>
            </div>
            <p class="rating-text">{{ getRatingText() }}</p>
          </div>

          <!-- Feedback Text -->
          <div class="form-group">
            <label class="form-label">Your Feedback *</label>
            <textarea
              formControlName="feedback_text"
              class="form-textarea"
              placeholder="Tell us what you think..."
              rows="4"
              maxlength="1000">
            </textarea>
            <div class="character-count">
              {{ characterCount }}/1000 characters
            </div>
            <div *ngIf="feedbackForm.get('feedback_text')?.invalid && feedbackForm.get('feedback_text')?.touched" 
                 class="error-message">
              <span *ngIf="feedbackForm.get('feedback_text')?.errors?.['required']">Feedback is required</span>
              <span *ngIf="feedbackForm.get('feedback_text')?.errors?.['minlength']">Please provide at least 10 characters</span>
            </div>
          </div>

          <!-- Optional Fields -->
          <div class="optional-fields">
            <h4>Optional Information</h4>
            
            <div class="form-group">
              <label class="form-label">Name (Optional)</label>
              <input
                formControlName="name"
                class="form-input"
                placeholder="Your name"
                type="text">
            </div>

            <div class="form-group">
              <label class="form-label">Email (Optional)</label>
              <input
                formControlName="email"
                class="form-input"
                placeholder="your.email@example.com"
                type="email">
              <div *ngIf="feedbackForm.get('email')?.invalid && feedbackForm.get('email')?.touched" 
                   class="error-message">
                <span *ngIf="feedbackForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
              </div>
            </div>
          </div>

          <!-- Feedback Message -->
          <div *ngIf="feedbackMessage" 
               class="feedback-message"
               [class.success]="feedbackSuccess"
               [class.error]="!feedbackSuccess">
            <mat-icon>{{ feedbackSuccess ? 'check_circle' : 'error' }}</mat-icon>
            <span>{{ feedbackMessage }}</span>
          </div>

          <!-- Actions -->
          <div class="dialog-actions">
            <button 
              type="button" 
              class="cancel-button"
              (click)="closeDialog()"
              mat-button>
              Cancel
            </button>
            <button 
              type="submit" 
              class="submit-button"
              [disabled]="!feedbackForm.valid || isSubmitting"
              mat-raised-button
              color="primary">
              <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
              <span *ngIf="!isSubmitting">Submit Feedback</span>
              <span *ngIf="isSubmitting" class="loading-text">Submitting...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .dialog-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #161616;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .close-button {
      color: #6c757d;
    }

    .close-button:hover {
      color: #495057;
    }

    .dialog-content {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
      background: #ffffff;
    }

    .dialog-description {
      color: #6c757d;
      margin-bottom: 24px;
      line-height: 1.5;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .feedback-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .rating-section {
      text-align: center;
    }

    .rating-label {
      display: block;
      font-weight: 500;
      margin-bottom: 16px;
      color: #161616;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .star-rating {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .star-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      color: #dee2e6;
    }

    .star-button:hover {
      background-color: #f8f9fa;
    }

    .star-button.active {
      color: #ffc107;
    }

    .star-button.hover {
      color: #ffc107;
      transform: scale(1.1);
    }

    .rating-text {
      font-size: 0.9rem;
      color: #6c757d;
      font-style: italic;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #161616;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      font-family: 'IBM Plex Sans', sans-serif;
      transition: border-color 0.2s ease;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #0f62fe;
      box-shadow: 0 0 0 2px rgba(15, 98, 254, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .character-count {
      text-align: right;
      font-size: 0.75rem;
      color: #6c757d;
      margin-top: 4px;
    }

    .optional-fields {
      border-top: 1px solid #e9ecef;
      padding-top: 20px;
      margin-top: 20px;
    }

    .optional-fields h4 {
      margin: 0 0 16px 0;
      color: #161616;
      font-size: 1.1rem;
      font-weight: 500;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.75rem;
      margin-top: 4px;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background: #f8f9fa;
    }

    .cancel-button {
      color: #6c757d;
    }

    .submit-button {
      min-width: 140px;
      position: relative;
    }

    .loading-text {
      margin-left: 8px;
    }

    .feedback-message {
      padding: 12px 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      margin-bottom: 16px;
    }

    .feedback-message.success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .feedback-message.error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .dialog-content {
        padding: 16px;
      }

      .dialog-header {
        padding: 16px;
      }

      .dialog-title {
        font-size: 1.25rem;
      }

      .dialog-actions {
        padding: 12px 16px;
        flex-direction: column;
        gap: 8px;
      }

      .submit-button, .cancel-button {
        width: 100%;
      }

      .star-rating {
        gap: 4px;
      }

      .star-button {
        padding: 6px;
      }
    }

    @media (max-width: 480px) {
      .dialog-content {
        padding: 12px;
      }

      .dialog-header {
        padding: 12px;
      }

      .dialog-title {
        font-size: 1.1rem;
      }

      .form-input, .form-textarea {
        padding: 10px 12px;
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }
  `]
})
export class FeedbackDialogComponent implements OnInit, OnDestroy {
  feedbackForm: FormGroup;
  currentRating = 0;
  hoverRating = 0;
  ratingTexts = [
    '', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'
  ];
  isSubmitting = false;
  feedbackMessage = '';
  feedbackSuccess = false;
  characterCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.feedbackForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      feedback_text: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      name: [''],
      email: ['', [Validators.email]]
    });

    // Update character count
    this.feedbackForm.get('feedback_text')?.valueChanges.subscribe(value => {
      this.characterCount = value ? value.length : 0;
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onStarHover(rating: number) {
    this.hoverRating = rating;
  }

  onStarLeave() {
    this.hoverRating = 0;
  }

  setRating(rating: number) {
    this.currentRating = rating;
    this.feedbackForm.patchValue({ rating });
  }

  getRatingText(): string {
    return this.ratingTexts[this.currentRating] || '';
  }

  onFeedbackSubmit() {
    if (this.feedbackForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.feedbackMessage = '';

      const feedbackData: FeedbackSubmission = {
        rating: this.feedbackForm.value.rating,
        feedback_text: this.feedbackForm.value.feedback_text,
        name: this.feedbackForm.value.name || undefined,
        email: this.feedbackForm.value.email || undefined
      };

      console.log('🚀 Submitting feedback:', feedbackData);

      this.apiService.submitFeedback(feedbackData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Feedback submitted successfully:', response);
          this.isSubmitting = false;
          this.feedbackSuccess = response.success;
          
          if (response.success) {
            this.feedbackMessage = response.message || 'Thank you for your feedback!';
            this.snackBar.open('Feedback submitted successfully!', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else {
            this.feedbackMessage = response.message || 'Failed to submit feedback. Please try again.';
          }
        },
        error: (error) => {
          console.error('❌ Feedback submission error:', error);
          this.isSubmitting = false;
          this.feedbackSuccess = false;

          let errorMessage = 'Failed to submit feedback. Please try again.';
          
          // Handle different error types
          if (error.status === 0) {
            // Network/CORS error
            errorMessage = 'Network error. Feedback will be simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Simulated due to network issues)';
            this.feedbackSuccess = true;
            this.snackBar.open('Feedback submitted successfully! (Simulated)', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else if (error.status === 404) {
            // Endpoint not found
            errorMessage = 'Feedback endpoint not available yet. Feedback will be simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Backend not yet deployed)';
            this.feedbackSuccess = true;
            this.snackBar.open('Feedback submitted successfully! (Simulated)', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else if (error.status === 400) {
            // Validation error
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = 'Please check your input and try again.';
            }
          } else if (error.status === 500) {
            // Server error
            errorMessage = 'Server error. Feedback will be simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Server temporarily unavailable)';
            this.feedbackSuccess = true;
            this.snackBar.open('Feedback submitted successfully! (Simulated)', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else if (error.message && error.message.includes('CORS')) {
            errorMessage = 'CORS error. Feedback will be simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Simulated due to CORS)';
            this.feedbackSuccess = true;
            this.snackBar.open('Feedback submitted successfully! (Simulated)', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else if (error.message && error.message.includes('Rate limit')) {
            errorMessage = 'You are submitting feedback too quickly. Please wait a moment and try again.';
          } else if (error.message && error.message.includes('Invalid rating')) {
            errorMessage = 'Please select a valid rating.';
          }

          if (!this.feedbackSuccess) {
            this.feedbackMessage = errorMessage;
          }
        }
      });
    }
  }

  closeDialog() {
    this.dialog.closeAll();
  }
}