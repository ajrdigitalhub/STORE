import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from './product';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private itemsSignal = signal<CartItem[]>([]);
  items = this.itemsSignal.asReadonly();

  totalItems = computed(() => this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0));
  totalPrice = computed(() => this.itemsSignal().reduce((acc, item) => acc + (item.price * item.quantity), 0));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.itemsSignal.set(JSON.parse(savedCart));
      }
    }
  }

  addToCart(product: Product) {
    this.itemsSignal.update(items => {
      const existingItem = items.find(i => i.id === product.id);
      if (existingItem) {
        return items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...items, { ...product, quantity: 1 }];
    });
    this.saveCart();
  }

  removeFromCart(productId: number) {
    this.itemsSignal.update(items => items.filter(i => i.id !== productId));
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.itemsSignal.update(items => items.map(i => i.id === productId ? { ...i, quantity } : i));
    this.saveCart();
  }

  clearCart() {
    this.itemsSignal.set([]);
    this.saveCart();
  }

  private saveCart() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cart', JSON.stringify(this.itemsSignal()));
    }
  }
}
