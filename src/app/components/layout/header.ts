import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  cartService = inject(CartService);
  router = inject(Router);
  isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
