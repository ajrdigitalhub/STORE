import { Injectable, signal, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { AuthService } from './auth';
import { firstValueFrom } from 'rxjs';

export interface OrderItem {
  product: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id: number;
  userid: number;
  items: OrderItem[];
  total_amount: number;
  shipping_address: ShippingAddress;
  payment_method: 'razorpay' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_number: string;
  razorpay_orderid?: string;
  razorpay_paymentid?: string;
  razorpay_signature?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
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

    const url = profile.role === 'admin' ? '/orders' : `/orders/customer/${profile.id}`;
    
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

  async createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> {
    // Map frontend fields to backend expected fields if necessary, 
    // but we already updated the Order interface to match backend.
    const payload = {
      items: order.items,
      shippingAddress: order.shipping_address,
      paymentMethod: order.payment_method,
      totalAmount: order.total_amount
    };
    return firstValueFrom(this.api.post<Order>('/orders', payload));
  }

  async updateOrderStatus(id: number, orderStatus: Order['order_status'], paymentStatus?: Order['payment_status']) {
    return firstValueFrom(this.api.put<Order>(`/orders/${id}/status`, { orderStatus, paymentStatus }));
  }
}
