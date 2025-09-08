import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="feedback-container" [class.expanded]="isExpanded">
      <div class="feedback-trigger" (click)="toggleFeedback()">
        <mat-icon>feedback</mat-icon>
        <span class="feedback-text">Feedback</span>
      </div>
      
      <div class="feedback-popup" *ngIf="isExpanded">
        <mat-card class="feedback-card">
          <mat-card-header>
            <mat-card-title>Share Your Feedback</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Name (Optional)</mat-label>
                  <input matInput formControlName="name" placeholder="Your name">
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Email (Optional)</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="your@email.com">
                </mat-form-field>
              </div>
              
              <div class="rating-section">
                <label class="rating-label">Rating</label>
                <div class="star-rating">
                  <mat-icon 
                    *ngFor="let star of stars; let i = index"
                    [class.filled]="i < selectedRating"
                    (click)="setRating(i + 1)"
                    class="star">
                    {{ i < selectedRating ? 'star' : 'star_border' }}
                  </mat-icon>
                </div>
              </div>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Describe your feedback (required)</mat-label>
                <textarea 
                  matInput 
                  formControlName="feedback" 
                  placeholder="Tell us what you think..."
                  rows="4"
                  required>
                </textarea>
                <mat-error *ngIf="feedbackForm.get('feedback')?.hasError('required')">
                  Feedback is required
                </mat-error>
              </mat-form-field>
            </form>
          </mat-card-content>
          
          <mat-card-actions class="feedback-actions">
            <button mat-button (click)="closeFeedback()">Cancel</button>
            <button 
              mat-raised-button 
              color="primary" 
              (click)="onSubmit()"
              [disabled]="feedbackForm.invalid">
              Submit Feedback
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .feedback-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .feedback-trigger {
      background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
      color: #e0e0e0;
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
      animation: float 3s ease-in-out infinite;
      width: 48px;
      height: 48px;
      overflow: hidden;
      border: 1px solid #404040;
    }
    
    .feedback-trigger:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
      animation-play-state: paused;
      border-radius: 25px;
      width: auto;
      padding: 12px 20px;
      gap: 8px;
      background: linear-gradient(135deg, #404040 0%, #2c2c2c 100%);
      color: #ffffff;
    }
    
    .feedback-text {
      opacity: 0;
      width: 0;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }
    
    .feedback-trigger:hover .feedback-text {
      opacity: 1;
      width: auto;
    }
    
    .feedback-popup {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 400px;
      animation: slideUp 0.3s ease-out;
    }
    
    .feedback-card {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border-radius: 0;
      background: #ffffff;
      border: 1px solid #e0e0e0;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .half-width {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
    }
    
    .rating-section {
      margin-bottom: 20px;
    }
    
    .rating-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #161616;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    
    .star-rating {
      display: flex;
      gap: 4px;
    }
    
    .star {
      cursor: pointer;
      color: #8d8d8d;
      transition: color 0.2s ease;
      font-size: 24px;
    }
    
    .star.filled {
      color: #a8a8a8;
    }
    
    .star:hover {
      color: #a8a8a8;
    }
    
    .feedback-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-5px);
      }
    }
    
    @media (max-width: 480px) {
      .feedback-popup {
        width: 320px;
        right: -10px;
      }
      
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .half-width {
        width: 100%;
      }
    }
  `]
})
export class FeedbackComponent {
  isExpanded = false;
  selectedRating = 0;
  stars = [1, 2, 3, 4, 5];
  feedbackForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.feedbackForm = this.fb.group({
      name: [''],
      email: ['', [Validators.email]],
      feedback: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  toggleFeedback() {
    this.isExpanded = !this.isExpanded;
  }

  closeFeedback() {
    this.isExpanded = false;
    this.resetForm();
  }

  setRating(rating: number) {
    this.selectedRating = rating;
  }

  onSubmit() {
    if (this.feedbackForm.valid) {
      const feedbackData = {
        ...this.feedbackForm.value,
        rating: this.selectedRating,
        timestamp: new Date().toISOString()
      };
      
      // Here you would typically send the data to your backend
      console.log('Feedback submitted:', feedbackData);
      
      // Show success message
      this.snackBar.open('Thank you for your feedback!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      
      this.closeFeedback();
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  private resetForm() {
    this.feedbackForm.reset();
    this.selectedRating = 0;
  }
}
