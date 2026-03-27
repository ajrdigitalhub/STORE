import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <h1 class="text-3xl font-bold text-chrome-100 mb-8">Shopping Cart</h1>

      @if (cartService.items.length === 0) {
        <div class="metallic-card p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-chrome-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
          <p class="text-chrome-500 text-lg mb-4">Your cart is empty</p>
          <a routerLink="/" class="metallic-btn-primary metallic-btn inline-block">Browse Products</a>
        </div>
      } @else {
        <div class="space-y-4 mb-8">
          @for (item of cartService.items; track item.product) {
            <div class="metallic-card p-4 flex items-center space-x-4 animate-fade-in">
              <div class="w-20 h-20 rounded-lg overflow-hidden bg-chrome-800 flex-shrink-0">
                @if (item.image) {
                  <img [src]="getImageUrl(item.image)" [alt]="item.name" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-chrome-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                }
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-chrome-200 font-medium text-sm truncate">{{ item.name }}</h3>
                <p class="text-chrome-100 font-bold mt-1">₹{{ item.price | number }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <button (click)="updateQty(item, -1)" class="w-8 h-8 rounded-full bg-chrome-800 text-chrome-400 hover:text-white flex items-center justify-center transition-colors">−</button>
                <span class="text-chrome-200 w-8 text-center font-medium">{{ item.quantity }}</span>
                <button (click)="updateQty(item, 1)" class="w-8 h-8 rounded-full bg-chrome-800 text-chrome-400 hover:text-white flex items-center justify-center transition-colors">+</button>
              </div>
              <p class="text-chrome-100 font-bold w-24 text-right">₹{{ item.price * item.quantity | number }}</p>
              <button (click)="cartService.removeFromCart(item.product)" class="text-chrome-600 hover:text-chrome-300 transition-colors p-1">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          }
        </div>

        <!-- Summary -->
        <div class="metallic-card p-6 space-y-4">
          <div class="flex justify-between text-chrome-400">
            <span>Subtotal ({{ cartService.totalItems }} items)</span>
            <span class="text-chrome-200 font-bold">₹{{ cartService.totalAmount | number }}</span>
          </div>
          <div class="flex justify-between text-chrome-400">
            <span>Shipping</span>
            <span class="text-chrome-300">Free</span>
          </div>
          <div class="border-t border-chrome-700 pt-4 flex justify-between">
            <span class="text-chrome-200 font-bold text-lg">Total</span>
            <span class="text-white font-bold text-xl">₹{{ cartService.totalAmount | number }}</span>
          </div>
          <div class="flex space-x-4 pt-2">
            <a routerLink="/" class="metallic-btn flex-1 text-center py-3">Continue Shopping</a>
            <a routerLink="/checkout" class="metallic-btn-primary metallic-btn flex-1 text-center py-3">Proceed to Checkout</a>
          </div>
        </div>
      }
    </div>
  `
})
export class CartComponent {
  constructor(public cartService: CartService) {}

  updateQty(item: CartItem, delta: number): void {
    this.cartService.updateQuantity(item.product, item.quantity + delta);
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return environment.serverUrl + img;
  }
}
