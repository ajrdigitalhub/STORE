import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './register.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);
  private route = inject(ActivatedRoute);
  
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  
  email = '';
  password = '';
  displayName = '';

  showWelcomePopup = signal(false);

  async registerWithGoogle() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.loginWithGoogle();
      this.showWelcomePopup.set(true);
    } catch (error: unknown) {
      console.error(error);
      const err = error as { code?: string };
      if (err?.code !== 'auth/popup-closed-by-user') {
        this.errorMessage.set('Registration failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSubmit() {
    if (!this.email || !this.password || !this.displayName) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.registerWithEmail(this.email, this.password, this.displayName);
      this.showWelcomePopup.set(true);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      this.errorMessage.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  closeWelcomePopup() {
    this.showWelcomePopup.set(false);
    const redirect = this.route.snapshot.queryParams['redirect'] || '/';
    this.router.navigateByUrl(redirect);
  }
}
