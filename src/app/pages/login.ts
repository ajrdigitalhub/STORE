import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  private route = inject(ActivatedRoute);
  
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  
  email = '';
  password = '';

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithGoogle();
      const redirect = this.route.snapshot.queryParams['redirect'] || '/';
      this.router.navigateByUrl(redirect);
    } catch (error: unknown) {
      console.error(error);
      const err = error as { code?: string };
      if (err?.code !== 'auth/popup-closed-by-user') {
        this.errorMessage.set('Login failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSubmit() {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithEmail(this.email, this.password);
      const redirect = this.route.snapshot.queryParams['redirect'] || '/';
      this.router.navigateByUrl(redirect);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Authentication failed. Please try again.';
      if (error && typeof error === 'object') {
        if (error.error && typeof error.error === 'object' && 'message' in error.error) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      this.errorMessage.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }
}
