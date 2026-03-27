import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedVariants?: { [key: string]: string };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private loadCart(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        this.cartItems = JSON.parse(saved);
        this.cartSubject.next([...this.cartItems]);
      } catch {
        this.cartItems = [];
      }
    }
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.cartSubject.next([...this.cartItems]);
  }

  addToCart(item: CartItem): void {
    const idx = this.cartItems.findIndex(i => i.product === item.product);
    if (idx > -1) {
      this.cartItems[idx].quantity += item.quantity;
    } else {
      this.cartItems.push({ ...item });
    }
    this.saveCart();
  }

  removeFromCart(productId: string): void {
    this.cartItems = this.cartItems.filter(i => i.product !== productId);
    this.saveCart();
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.cartItems.find(i => i.product === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart();
    }
  }

  clearCart(): void {
    this.cartItems = [];
    localStorage.removeItem('cart');
    this.cartSubject.next([]);
  }

  get items(): CartItem[] {
    return [...this.cartItems];
  }

  get totalAmount(): number {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }
}
