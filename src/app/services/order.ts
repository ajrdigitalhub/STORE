import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';

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
  private http = inject(HttpClient);
  private ordersSignal = signal<Order[]>([]);
  orders = this.ordersSignal.asReadonly();
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

    const url = profile.role === 'admin' ? '/api/orders' : `/api/orders/customer/${profile.uid}`;
    
    this.http.get<Order[]>(url).subscribe({
      next: (orders) => {
        this.ordersSignal.set(orders);
      },
      error: (error) => {
        console.error('Failed to load orders', error);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createOrder(order: Omit<Order, 'id'>): Promise<any> {
    return this.http.post<Order>('/api/orders', order).toPromise();
  }

  async updateOrderStatus(id: string, status: Order['status']) {
    return this.http.patch<Order>(`/api/orders/${id}/status`, { status }).toPromise();
  }
}
