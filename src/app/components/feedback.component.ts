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
      (click)="openFeedbackDialog()"
      mat-fab
      color="primary">
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
      background: linear-gradient(135deg, #0f62fe 0%, #0043ce 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(15, 98, 254, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      font-family: 'Roboto', sans-serif;
    }

    .feedback-button:hover {
      width: 140px;
      border-radius: 28px;
      box-shadow: 0 8px 24px rgba(15, 98, 254, 0.4);
      transform: translateY(-2px);
    }

    .feedback-button:hover .feedback-text {
      opacity: 1;
      transform: translateX(0);
    }

    .feedback-button:hover .feedback-icon {
      transform: translateX(-8px);
    }

    .feedback-icon {
      font-size: 24px;
      color: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: absolute;
    }

    .feedback-text {
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: white;
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      margin-left: 8px;
    }

    @media (max-width: 768px) {
      .feedback-button {
        bottom: 15px;
        right: 15px;
        width: 48px;
        height: 48px;
      }

      .feedback-button:hover {
        width: 120px;
        border-radius: 24px;
      }

      .feedback-icon {
        font-size: 20px;
      }

      .feedback-text {
        font-size: 13px;
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
        width: 110px;
        border-radius: 22px;
      }

      .feedback-icon {
        font-size: 18px;
      }

      .feedback-text {
        font-size: 12px;
      }
    }
  `]
})
export class FeedbackButtonComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private apiService: ApiService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openFeedbackDialog() {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      panelClass: 'feedback-dialog'
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
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
    <div class="feedback-dialog-content">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>feedback</mat-icon>
          Share Your Feedback
        </h2>
        <button mat-icon-button (click)="closeDialog()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        <p class="dialog-description">
          Help us improve by sharing your thoughts and suggestions.
        </p>

        <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()" class="feedback-form">
          <!-- Rating Section -->
          <div class="rating-section">
            <label class="rating-label">How would you rate your experience? *</label>
            <div class="star-rating">
              <button 
                *ngFor="let star of stars" 
                type="button"
                class="star-button"
                [class.active]="star <= selectedRating"
                [class.hover]="star <= hoverRating"
                (click)="selectRating(star)"
                (mouseenter)="hoverRating = star"
                (mouseleave)="hoverRating = 0">
                <mat-icon>{{ star <= selectedRating ? 'star' : 'star_border' }}</mat-icon>
              </button>
            </div>
            <div class="rating-text">
              {{ getRatingText(selectedRating) }}
            </div>
          </div>

          <!-- Feedback Text -->
          <div class="form-group">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your feedback *</mat-label>
              <textarea 
                matInput 
                formControlName="feedback_text"
                placeholder="Tell us what you think..."
                rows="4"
                maxlength="1000">
              </textarea>
              <mat-hint align="end">{{ feedbackForm.get('feedback_text')?.value?.length || 0 }}/1000</mat-hint>
            </mat-form-field>
            <div *ngIf="feedbackForm.get('feedback_text')?.invalid && feedbackForm.get('feedback_text')?.touched" class="error-message">
              <span *ngIf="feedbackForm.get('feedback_text')?.errors?.['required']">Feedback is required</span>
              <span *ngIf="feedbackForm.get('feedback_text')?.errors?.['minlength']">Please provide more detailed feedback</span>
            </div>
          </div>

          <!-- Optional Fields -->
          <div class="optional-fields">
            <h4>Optional Information</h4>
            
            <div class="form-group">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your name (optional)</mat-label>
                <input 
                  matInput 
                  formControlName="name"
                  placeholder="Enter your name"
                  maxlength="100">
                <mat-hint>We'll generate a fun name if you don't provide one</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-group">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your email (optional)</mat-label>
                <input 
                  matInput 
                  type="email"
                  formControlName="email"
                  placeholder="Enter your email"
                  maxlength="255">
                <mat-hint>Only if you'd like a response</mat-hint>
              </mat-form-field>
              <div *ngIf="feedbackForm.get('email')?.invalid && feedbackForm.get('email')?.touched" class="error-message">
                <span *ngIf="feedbackForm.get('email')?.errors?.['email']">Please enter a valid email address</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          (click)="closeDialog()"
          [disabled]="isSubmitting">
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="onSubmit()"
          [disabled]="feedbackForm.invalid || isSubmitting"
          class="submit-button">
          <span *ngIf="!isSubmitting">Submit Feedback</span>
          <span *ngIf="isSubmitting" class="loading-content">
            <mat-spinner diameter="20"></mat-spinner>
            Submitting...
          </span>
        </button>
      </div>

      <!-- Success/Error Message -->
      <div *ngIf="feedbackMessage" class="feedback-message" [class.success]="feedbackSuccess" [class.error]="!feedbackSuccess">
        <mat-icon>{{ feedbackSuccess ? 'check_circle' : 'error' }}</mat-icon>
        <span>{{ feedbackMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .feedback-dialog-content {
      padding: 0;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .close-button {
      color: #666;
    }

    .dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-description {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .feedback-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .rating-section {
      text-align: center;
    }

    .rating-label {
      display: block;
      font-weight: 500;
      margin-bottom: 16px;
      color: #1a1a1a;
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
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      color: #ddd;
    }

    .star-button:hover {
      background-color: #f5f5f5;
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
      color: #666;
      font-style: italic;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .optional-fields {
      border-top: 1px solid #e0e0e0;
      padding-top: 20px;
      margin-top: 20px;
    }

    .optional-fields h4 {
      margin: 0 0 16px 0;
      color: #1a1a1a;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .error-message {
      color: #d32f2f;
      font-size: 0.75rem;
      margin-top: 4px;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .submit-button {
      min-width: 140px;
    }

    .loading-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .feedback-message {
      margin: 16px 24px;
      padding: 12px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .feedback-message.success {
      background-color: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }

    .feedback-message.error {
      background-color: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }

    @media (max-width: 768px) {
      .dialog-content {
        padding: 16px;
      }

      .dialog-actions {
        padding: 12px 16px;
        flex-direction: column;
      }

      .submit-button {
        width: 100%;
      }
    }
  `]
})
export class FeedbackDialogComponent implements OnInit, OnDestroy {
  feedbackForm: FormGroup;
  isSubmitting = false;
  feedbackMessage = '';
  feedbackSuccess = false;
  selectedRating = 0;
  hoverRating = 0;
  stars = [1, 2, 3, 4, 5];
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.feedbackForm = this.fb.group({
      feedback_text: ['', [Validators.required, Validators.minLength(10)]],
      name: [''],
      email: ['', [Validators.email]]
    });
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
    this.feedbackForm.patchValue({ rating });
  }

  getRatingText(rating: number): string {
    const texts = {
      0: 'Select a rating',
      1: 'Poor - Needs significant improvement',
      2: 'Fair - Some issues to address',
      3: 'Good - Meets expectations',
      4: 'Very Good - Exceeds expectations',
      5: 'Excellent - Outstanding experience'
    };
    return texts[rating as keyof typeof texts] || 'Select a rating';
  }

  onSubmit() {
    if (this.feedbackForm.valid && this.selectedRating > 0 && !this.isSubmitting) {
      this.isSubmitting = true;
      this.feedbackMessage = '';

      const feedbackData: FeedbackSubmission = {
        rating: this.selectedRating,
        feedback_text: this.feedbackForm.get('feedback_text')?.value,
        name: this.feedbackForm.get('name')?.value || undefined,
        email: this.feedbackForm.get('email')?.value || undefined
      };

      console.log('🔍 Submitting feedback:', feedbackData);
      
      this.apiService.submitFeedback(feedbackData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Feedback response:', response);
          this.isSubmitting = false;
          this.feedbackSuccess = response.success;

          if (response.success) {
            this.feedbackMessage = response.message || 'Thank you for your feedback!';
            this.snackBar.open('Feedback submitted successfully!', 'Close', { duration: 3000 });
            
            // Reset form and close dialog after a delay
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
            errorMessage = 'API not accessible in development mode. Feedback is simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Simulated in development)';
            this.feedbackSuccess = true;
            this.snackBar.open('Feedback submitted successfully! (Simulated)', 'Close', { duration: 3000 });
            
            setTimeout(() => {
              this.closeDialog();
            }, 2000);
          } else if (error.status === 429) {
            // Rate limiting
            errorMessage = 'You are submitting feedback too quickly. Please wait a moment and try again.';
          } else if (error.status === 400) {
            // Validation error
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = 'Please check your input and try again.';
            }
          } else if (error.status === 500) {
            // Server error
            errorMessage = 'Server error. Please try again later.';
          } else if (error.message && error.message.includes('CORS')) {
            errorMessage = 'API not accessible in development mode. Feedback is simulated.';
            this.feedbackMessage = 'Thank you for your feedback! (Simulated in development)';
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