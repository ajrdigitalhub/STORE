import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from './product';

export interface CartItem extends Product {
  quantity: number;
  customization?: {
    text?: string;
    image?: string;
  };
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

  addToCart(product: Product, customization?: CartItem['customization']) {
    if (!product || !product.id) {
      console.error('CartService - Attempted to add product without ID:', product);
      return;
    }
    this.itemsSignal.update(items => {
      // Find item with same ID AND same customization
      const existingItem = items.find(i => 
        i.id === product.id && 
        JSON.stringify(i.customization) === JSON.stringify(customization)
      );
      
      if (existingItem) {
        return items.map(i => 
          (i.id === product.id && JSON.stringify(i.customization) === JSON.stringify(customization)) 
          ? { ...i, quantity: i.quantity + 1 } 
          : i
        );
      }
      return [...items, { ...product, quantity: 1, customization }];
    });
    this.saveCart();
  }

  removeFromCart(productId: number, customization?: CartItem['customization']) {
    this.itemsSignal.update(items => items.filter(i => 
      !(i.id === productId && JSON.stringify(i.customization) === JSON.stringify(customization))
    ));
    this.saveCart();
  }

  updateQuantity(productId: number, quantity: number, customization?: CartItem['customization']) {
    if (quantity <= 0) {
      this.removeFromCart(productId, customization);
      return;
    }
    this.itemsSignal.update(items => items.map(i => 
      (i.id === productId && JSON.stringify(i.customization) === JSON.stringify(customization)) 
      ? { ...i, quantity } 
      : i
    ));
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
