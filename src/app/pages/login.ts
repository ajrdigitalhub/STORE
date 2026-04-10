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
  isRegister = signal(false);
  
  email = '';
  password = '';
  displayName = '';

  async loginWithGoogle() {
    this.isLoading.set(true);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert('Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSubmit() {
    if (!this.email || !this.password) return;
    if (this.isRegister() && !this.displayName) return;

    this.isLoading.set(true);
    try {
      if (this.isRegister()) {
        await this.authService.registerWithEmail(this.email, this.password, this.displayName);
      } else {
        await this.authService.loginWithEmail(this.email, this.password);
      }
      this.router.navigate(['/']);
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert(this.isRegister() ? 'Registration failed.' : 'Login failed. Check your credentials.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleMode() {
    this.isRegister.set(!this.isRegister());
  }
}
