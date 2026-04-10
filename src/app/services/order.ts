import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { AuthService } from './auth';
import { firstValueFrom } from 'rxjs';

export interface Order {
  id?: string;
  orderId: string;
  customerUid: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentMethod: 'COD' | 'Razorpay';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shippingAddress: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);
  private ordersSignal = signal<Order[]>([]);
  orders = this.ordersSignal.asReadonly();
  isLoading = signal(false);
  private authService = inject(AuthService);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const profile = this.authService.profile();
        if (profile) {
          this.loadUserOrders();
        } else {
          this.ordersSignal.set([]);
        }
      });
    }
  }

  private loadUserOrders() {
    const profile = this.authService.profile();
    if (!profile) return;

    const url = profile.role === 'admin' ? '/orders' : `/orders/customer/${profile.uid}`;
    
    this.isLoading.set(true);
    this.api.get<Order[]>(url).subscribe({
      next: (orders) => {
        this.ordersSignal.set(orders);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load orders', error);
        this.isLoading.set(false);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOrder(order: Omit<Order, 'id'>): Promise<any> {
    return firstValueFrom(this.api.post<Order>('/orders', order));
  }

  async updateOrderStatus(id: string, status: Order['status']) {
    return firstValueFrom(this.api.patch<Order>(`/orders/${id}/status`, { status }));
  }
}
