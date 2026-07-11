import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { TutorialService } from '../../services/tutorial.service';

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
  tutorialService = inject(TutorialService);
  router = inject(Router);
  isMenuOpen = signal(false);

  hasTutorialsAccess = computed(() => {
    const profile = this.authService.profile();
    if (!profile) return false;
    if (this.authService.isAdmin()) return true;
    if (profile.tutorial_access) return true;
    return this.tutorialService.tutorials().length > 0;
  });

  constructor() {
    effect(() => {
      const profile = this.authService.profile();
      if (profile) {
        this.tutorialService.loadCustomerTutorials();
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
