import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 pt-16">
      <div class="metallic-card p-8 w-full max-w-md animate-slide-up">
        <div class="text-center mb-8">
          <div class="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-chrome-200 to-chrome-500 flex items-center justify-center mb-4">
            <span class="text-chrome-950 font-bold text-xl">S</span>
          </div>
          <h1 class="text-2xl font-bold text-chrome-100">Welcome Back</h1>
          <p class="text-chrome-500 text-sm mt-1">Sign in to your account</p>
        </div>

        @if (errorMsg) {
          <div class="bg-chrome-800 border border-chrome-600 text-chrome-300 p-3 rounded-lg text-sm mb-4">{{ errorMsg }}</div>
        }

        <form (ngSubmit)="onLogin()" class="space-y-4">
          <div>
            <label class="text-chrome-400 text-sm mb-1 block">Email</label>
            <input type="email" [(ngModel)]="email" name="email" class="metallic-input" placeholder="you&#64;example.com" required />
          </div>
          <div>
            <label class="text-chrome-400 text-sm mb-1 block">Password</label>
            <input type="password" [(ngModel)]="password" name="password" class="metallic-input" placeholder="••••••••" required />
          </div>
          <button type="submit" [disabled]="loading" class="w-full metallic-btn-primary metallic-btn py-3 text-base disabled:opacity-50">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="text-center text-chrome-500 text-sm mt-6">
          Don't have an account? <a routerLink="/register" class="text-chrome-200 hover:text-white transition-colors">Register</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.loading = true;
    this.errorMsg = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}
