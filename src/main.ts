import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimations as provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';

const routes: Routes = [
  { path: '', loadComponent: () => import('./app/pages/home.component').then(m => m.HomeComponent) },
  { path: 'post/:slug', loadComponent: () => import('./app/pages/post.component').then(m => m.PostComponent) },
  { path: 'tag/:tag', loadComponent: () => import('./app/pages/tags.component').then(m => m.TagsComponent) },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }))
  ]
}).catch(err => console.error(err));
