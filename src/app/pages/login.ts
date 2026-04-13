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
    } catch (error: any) {
      console.error(error);
      if (error?.code !== 'auth/popup-closed-by-user') {
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
    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Login failed. Check your credentials.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
