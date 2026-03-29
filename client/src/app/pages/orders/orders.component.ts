import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <h1 class="text-3xl font-bold text-chrome-100 mb-8">My Orders</h1>

      @if (loading) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <div class="metallic-card p-6 animate-pulse">
              <div class="h-4 bg-chrome-800 rounded w-1/3 mb-3"></div>
              <div class="h-3 bg-chrome-800 rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else if (orders.length === 0) {
        <div class="metallic-card p-12 text-center">
          <svg class="w-16 h-16 mx-auto text-chrome-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <p class="text-chrome-500 text-lg">No orders yet</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders; track order._id) {
            <div class="metallic-card p-6 animate-fade-in">
              <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p class="text-chrome-500 text-xs">Order ID</p>
                  <p class="text-chrome-300 text-sm font-mono">{{ order._id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-chrome-500 text-xs">{{ order.createdAt | date:'medium' }}</p>
                  <div class="flex items-center space-x-2 mt-1 justify-end">
                    <span [class]="getStatusClass(order.orderStatus)" class="metallic-badge text-xs">{{ order.orderStatus | titlecase }}</span>
                    <span [class]="getPaymentClass(order.paymentStatus)" class="metallic-badge text-xs">{{ order.paymentStatus | titlecase }}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2 mb-4">
                @for (item of order.items; track $index) {
                  <div class="flex flex-col space-y-1">
                    <div class="flex justify-between text-sm">
                      <span class="text-chrome-400">{{ item.name }} × {{ item.quantity }}</span>
                      <span class="text-chrome-200">₹{{ item.price * item.quantity | number }}</span>
                    </div>
                    @if (item.customName) {
                      <p class="text-xs text-chrome-300 ml-2 italic">Name: {{ item.customName }}</p>
                    }
                    @if (item.customImage) {
                      <div class="ml-2 mt-1">
                        <img [src]="getImageUrl(item.customImage)" class="w-12 h-12 object-cover rounded border border-chrome-600" />
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="border-t border-chrome-700 pt-3 flex justify-between items-center">
                <span class="text-chrome-400 text-sm">Total</span>
                <span class="text-white font-bold text-lg">₹{{ order.totalAmount | number }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: res => {
        this.orders = res.orders;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getStatusClass(status: string): string {
    const cls: any = { pending: 'border-chrome-500', processing: 'border-chrome-400', shipped: 'border-chrome-300', delivered: 'border-chrome-200 bg-chrome-700', cancelled: 'border-chrome-600 opacity-50' };
    return cls[status] || '';
  }

  getPaymentClass(status: string): string {
    const cls: any = { pending: 'border-chrome-600', paid: 'border-chrome-300 bg-chrome-700', failed: 'border-chrome-600 opacity-50', refunded: 'border-chrome-500' };
    return cls[status] || '';
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return environment.serverUrl + img;
  }
}
