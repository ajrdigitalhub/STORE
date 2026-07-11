import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService, Order } from '../services/order';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { SkeletonComponent } from '../components/shared/skeleton';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, SkeletonComponent, FormsModule],
  templateUrl: './order-detail.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  authService = inject(AuthService);
  toastService = inject(ToastService);

  order = signal<Order | null>(null);
  isLoading = signal(true);
  isUpdating = signal(false);

  orderStatuses: Order['order_status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  paymentStatuses: Order['payment_status'][] = ['pending', 'paid', 'failed', 'refunded'];

  selectedOrderStatus: Order['order_status'] = 'pending';
  selectedPaymentStatus: Order['payment_status'] = 'pending';
  courierName = '';
  trackingNumber = '';

  constructor() {
    this.loadOrder();
  }

  async loadOrder() {
    this.route.params.subscribe(async params => {
      const id = Number(params['id']);
      if (id) {
        try {
          const order = await this.orderService.getOrder(id);
          this.order.set(order);
          this.selectedOrderStatus = order.order_status;
          this.selectedPaymentStatus = order.payment_status;
          this.courierName = order.courier_name || '';
          this.trackingNumber = order.tracking_number || '';
        } catch (error) {
          console.error('Failed to load order', error);
        } finally {
          this.isLoading.set(false);
        }
      }
    });
  }

  async updateStatus() {
    const order = this.order();
    if (!order) return;

    this.isUpdating.set(true);
    try {
      await this.orderService.updateOrderStatus(order.id, this.selectedOrderStatus, this.selectedPaymentStatus, this.courierName, this.trackingNumber);
      this.toastService.show('Order status updated successfully', 'success');
      // Refresh local data
      const updatedOrder = await this.orderService.getOrder(order.id);
      this.order.set(updatedOrder);
      this.courierName = updatedOrder.courier_name || '';
      this.trackingNumber = updatedOrder.tracking_number || '';
    } catch (error) {
      console.error('Failed to update status', error);
      this.toastService.show('Failed to update order status', 'error');
    } finally {
      this.isUpdating.set(false);
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10';
      case 'shipped': return 'text-blue-500 bg-blue-500/10';
      case 'processing': return 'text-yellow-500 bg-yellow-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      default: return 'text-accent-muted bg-accent/10';
    }
  }
}
