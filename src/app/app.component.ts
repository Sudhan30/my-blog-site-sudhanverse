import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FeedbackComponent } from './components/feedback.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatCardModule, MatIconModule, FeedbackComponent],
  template: `
    <div class="app-container">
      <main class="main-content page-transition">
        <router-outlet></router-outlet>
      </main>
      
      <footer class="app-footer fade-in">
        <div class="footer-content">
          <p>&copy; {{year}} Sudharsana. Built with Angular + Traefik + K3s • CI/CD by GitHub Actions + Flux</p>
        </div>
      </footer>
      
      <app-feedback></app-feedback>
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
    }
    
    .footer-content {
      max-width: 100%;
      margin: 0;
      padding: 2rem 2rem;
      text-align: center;
    }
    
    .footer-content p {
      margin: 0;
      font-size: 0.875rem;
      font-family: 'IBM Plex Sans', sans-serif;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    
  `]
})
export class AppComponent {
  year = new Date().getFullYear();
}
