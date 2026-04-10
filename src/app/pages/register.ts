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
  
  email = '';
  password = '';
  displayName = '';

  async registerWithGoogle() {
    this.isLoading.set(true);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert('Registration failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSubmit() {
    if (!this.email || !this.password || !this.displayName) return;

    this.isLoading.set(true);
    try {
      await this.authService.registerWithEmail(this.email, this.password, this.displayName);
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert('Registration failed. Please check your details.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
