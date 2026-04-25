import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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
      this.router.navigate(['/']);
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
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(error);
      const err = error as { code?: string; message?: string };
      
      switch (err.code) {
        case 'auth/invalid-email':
          this.errorMessage.set('The email address is badly formatted.');
          break;
        case 'auth/user-not-found':
          this.errorMessage.set('No account found with this email.');
          break;
        case 'auth/wrong-password':
          this.errorMessage.set('Incorrect password. Please try again.');
          break;
        case 'auth/user-disabled':
          this.errorMessage.set('This account has been disabled.');
          break;
        case 'auth/too-many-requests':
          this.errorMessage.set('Too many failed attempts. Please try again later.');
          break;
        case 'auth/invalid-credential':
          this.errorMessage.set('Invalid email or password. Please try again.');
          break;
        default:
          this.errorMessage.set('Authentication failed. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
