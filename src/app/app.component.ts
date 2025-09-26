import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { FeedbackButtonComponent } from './components/feedback.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatCardModule, MatIconModule, MatDialogModule, FeedbackButtonComponent],
  template: `
    <div class="app-container">
      <main class="main-content page-transition">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="app-footer fade-in">
        <div class="footer-content">
          <p>&copy; {{year}} Sudharsana Rajasekaran. All rights reserved.</p>
        </div>
      </footer>
      
      <app-feedback-button></app-feedback-button>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f4f4f4;
    }
    
    .main-content {
      flex: 1;
      max-width: 100%;
      margin: 0;
      width: 100%;
    }
    
    .app-footer {
      background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
      color: #b8b8b8;
      margin-top: 2rem;
      border-top: 1px solid #404040;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
      width: 100%;
      margin-left: 0;
      margin-right: 0;
    }
    
    .footer-content {
      width: 100%;
      margin: 0 auto;
      padding: 2rem 2rem;
      text-align: center;
      box-sizing: border-box;
      max-width: 1200px;
    }
    
    .footer-content p {
      margin: 0;
      font-size: 1rem;
      font-family: 'IBM Plex Sans', sans-serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      line-height: 1.4;
    }
    
    /* Mobile responsive styles */
    @media (max-width: 768px) {
      .app-footer {
        width: 100vw;
        margin-left: calc(-50vw + 50%);
        margin-right: calc(-50vw + 50%);
      }
      
      .footer-content {
        padding: 3rem 3rem;
        width: 100%;
        max-width: none;
        margin: 0;
      }
      
      .footer-content p {
        font-size: 0.9rem;
        text-align: center;
        word-wrap: break-word;
        hyphens: auto;
      }
    }
    
    @media (max-width: 480px) {
      .app-footer {
        width: 100vw;
        margin-left: calc(-50vw + 50%);
        margin-right: calc(-50vw + 50%);
      }
      
      .footer-content {
        padding: 2rem 2rem;
        width: 100%;
        max-width: none;
        margin: 0;
      }
      
      .footer-content p {
        font-size: 0.85rem;
        line-height: 1.3;
      }
    }
    
  `]
})
export class AppComponent {
  year = new Date().getFullYear();
}
