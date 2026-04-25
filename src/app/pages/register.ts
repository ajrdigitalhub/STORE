import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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
      const err = error as { code?: string; message?: string };
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          this.errorMessage.set('This email is already registered.');
          break;
        case 'auth/invalid-email':
          this.errorMessage.set('The email address is badly formatted.');
          break;
        case 'auth/operation-not-allowed':
          this.errorMessage.set('Email/password accounts are not enabled.');
          break;
        case 'auth/weak-password':
          this.errorMessage.set('The password is too weak (min 6 characters).');
          break;
        default:
          this.errorMessage.set('Registration failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  closeWelcomePopup() {
    this.showWelcomePopup.set(false);
    this.router.navigate(['/']);
  }
}
