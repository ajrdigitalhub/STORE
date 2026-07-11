import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService, Order } from '../services/order';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './track-order.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
    
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-invoice, #printable-invoice * {
        visibility: visible;
      }
      #printable-invoice {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `]
})
export class TrackOrderComponent {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orderNumber = '';
  phone = '';
  order = signal<Order | null>(null);
  isLoading = signal(false);
  hasSearched = signal(false);

  constructor() {
    // Prefill from query params if coming straight from checkout redirect
    this.route.queryParams.subscribe(params => {
      if (params['orderNumber'] && params['phone']) {
        this.orderNumber = params['orderNumber'];
        this.phone = params['phone'];
        this.track();
      }
    });
  }

  async track() {
    if (!this.orderNumber.trim() || !this.phone.trim()) {
      this.toastService.show('Please fill in both fields', 'error');
      return;
    }

    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.order.set(null);

    try {
      const result = await this.orderService.trackOrder(this.orderNumber.trim(), this.phone.trim());
      this.order.set(result);
      this.toastService.show('Order tracking loaded', 'success');
    } catch (error: any) {
      console.error('Failed to track order', error);
      if (error?.status === 403) {
        this.toastService.show('Information mismatch. Check your phone number.', 'error');
      } else if (error?.status === 404) {
        this.toastService.show('Order not found. Check order number.', 'error');
      } else {
        this.toastService.show('Unable to retrieve order details. Please try again.', 'error');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  printInvoice() {
    window.print();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'shipped': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'processing': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-accent-muted bg-accent/10 border-accent/20';
    }
  }
}
