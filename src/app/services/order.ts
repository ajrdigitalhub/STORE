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
  customization?: {
    text?: string;
    image?: string;
  };
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
  gst_amount?: number;
  shipping_charge?: number;
  shipping_address: ShippingAddress;
  payment_method: 'razorpay' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_number: string;
  razorpay_orderid?: string;
  razorpay_paymentid?: string;
  razorpay_signature?: string;
  is_guest?: boolean;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  firebase_uid?: string;
  courier_name?: string;
  tracking_number?: string;
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

    this.isLoading.set(true);
    this.api.get<{ orders: Order[], total: number }>('/orders').subscribe({
      next: (response) => {
        this.ordersSignal.set(response.orders || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load orders', error);
        this.isLoading.set(false);
      }
    });
  }

  loadAdminOrders(filterType?: 'all' | 'guest' | 'registered') {
    const profile = this.authService.profile();
    if (!profile || profile.role !== 'admin') return;

    this.isLoading.set(true);
    let url = '/orders';
    if (filterType && filterType !== 'all') {
      url += `?isGuest=${filterType === 'guest' ? 'true' : 'false'}`;
    }

    this.api.get<{ orders: Order[], total: number }>(url).subscribe({
      next: (response) => {
        this.ordersSignal.set(response.orders || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load admin orders', error);
        this.isLoading.set(false);
      }
    });
  }

  async createOrder(order: any): Promise<Order> {
    return firstValueFrom(this.api.post<Order>('/orders', order));
  }

  async updateOrderStatus(id: number, orderStatus: Order['order_status'], paymentStatus?: Order['payment_status'], courierName?: string, trackingNumber?: string) {
    await firstValueFrom(this.api.put<Order>(`/orders/${id}/status`, { orderStatus, paymentStatus, courierName, trackingNumber }));
    this.loadUserOrders(); // Refresh the list
  }

  async getOrder(id: number): Promise<Order> {
    return firstValueFrom(this.api.get<Order>(`/orders/${id}`));
  }

  async trackOrder(orderNumber: string, phone: string): Promise<Order> {
    return firstValueFrom(this.api.get<Order>(`/orders/track?orderNumber=${orderNumber}&phone=${phone}`));
  }
}
