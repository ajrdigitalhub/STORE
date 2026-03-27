import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-chrome-800" style="backdrop-filter: blur(20px); background: rgba(13,13,13,0.9);">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center space-x-2 group">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-chrome-200 to-chrome-500 flex items-center justify-center">
              <span class="text-chrome-950 font-bold text-sm">S</span>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-chrome-100 to-chrome-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-chrome-300 transition-all">
              STORE
            </span>
          </a>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center space-x-6">
            <a routerLink="/" routerLinkActive="text-white" [routerLinkActiveOptions]="{exact:true}" class="text-chrome-400 hover:text-white transition-colors text-sm font-medium">Home</a>
            @if (authService.isLoggedIn && !authService.isAdmin) {
              <a routerLink="/orders" routerLinkActive="text-white" class="text-chrome-400 hover:text-white transition-colors text-sm font-medium">Orders</a>
            }
            @if (authService.isAdmin) {
              <a routerLink="/admin" routerLinkActive="text-white" class="text-chrome-400 hover:text-white transition-colors text-sm font-medium">Admin</a>
            }
          </div>

          <!-- Right side -->
          <div class="flex items-center space-x-4">
            @if (!authService.isAdmin) {
              <a routerLink="/cart" class="relative text-chrome-400 hover:text-white transition-colors p-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
                @if (cartService.totalItems > 0) {
                  <span class="absolute -top-1 -right-1 bg-chrome-200 text-chrome-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {{ cartService.totalItems }}
                  </span>
                }
              </a>
            }

            @if (authService.isLoggedIn) {
              <div class="flex items-center space-x-3">
                <span class="text-chrome-400 text-sm hidden sm:block">{{ authService.currentUser?.name }}</span>
                <button (click)="logout()" class="metallic-btn text-xs px-3 py-1.5">Logout</button>
              </div>
            } @else {
              <a routerLink="/login" class="metallic-btn-primary metallic-btn text-xs px-4 py-1.5">Login</a>
            }

            <!-- Mobile menu button -->
            <button (click)="mobileOpen = !mobileOpen" class="md:hidden text-chrome-400 hover:text-white p-1">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                @if (mobileOpen) {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (mobileOpen) {
          <div class="md:hidden pb-4 animate-fade-in">
            <div class="flex flex-col space-y-2 pt-2 border-t border-chrome-800">
              <a routerLink="/" (click)="mobileOpen=false" class="text-chrome-400 hover:text-white py-2 text-sm">Home</a>
              @if (authService.isLoggedIn && !authService.isAdmin) {
                <a routerLink="/orders" (click)="mobileOpen=false" class="text-chrome-400 hover:text-white py-2 text-sm">Orders</a>
              }
              @if (authService.isAdmin) {
                <a routerLink="/admin" (click)="mobileOpen=false" class="text-chrome-400 hover:text-white py-2 text-sm">Admin Panel</a>
              }
            </div>
          </div>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  mobileOpen = false;

  constructor(public authService: AuthService, public cartService: CartService) {}

  logout(): void {
    this.authService.logout();
    this.mobileOpen = false;
  }
}
