import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <h1 class="text-2xl font-bold text-chrome-100 mb-6">Orders Management</h1>

      <div class="metallic-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-chrome-800">
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Order ID</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Customer</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Items</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Total</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Payment</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Status</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Date</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders; track order._id) {
                <tr class="border-b border-chrome-800/50 hover:bg-chrome-800/30 transition-colors">
                  <td class="px-4 py-3 text-chrome-300 text-sm font-mono">{{ order._id.slice(-8) }}</td>
                  <td class="px-4 py-3 text-chrome-300 text-sm">{{ order.user?.name || 'N/A' }}</td>
                  <td class="px-4 py-3 text-chrome-400 text-sm">{{ order.items.length }} items</td>
                  <td class="px-4 py-3 text-chrome-200 text-sm font-medium">₹{{ order.totalAmount | number }}</td>
                  <td class="px-4 py-3"><span class="metallic-badge text-xs">{{ order.paymentMethod | uppercase }} - {{ order.paymentStatus | titlecase }}</span></td>
                  <td class="px-4 py-3">
                    <select [(ngModel)]="order.orderStatus" (change)="updateStatus(order)" class="metallic-input text-xs py-1 px-2 w-32">
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-chrome-500 text-sm">{{ order.createdAt | date:'short' }}</td>
                  <td class="px-4 py-3">
                    <button (click)="viewOrder(order)" class="text-chrome-400 hover:text-white text-sm transition-colors">Details</button>
                  </td>
                </tr>
              }
              @if (orders.length === 0) {
                <tr><td colspan="8" class="text-center py-8 text-chrome-600">No orders found</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal -->
      @if (selectedOrder) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" (click)="selectedOrder = null">
          <div class="metallic-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-slide-up" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-chrome-200 font-semibold text-lg">Order Details</h2>
              <button (click)="selectedOrder = null" class="text-chrome-500 hover:text-white">✕</button>
            </div>
            <div class="space-y-3 text-sm">
              <div><span class="text-chrome-500">Order ID:</span> <span class="text-chrome-300 font-mono ml-2">{{ selectedOrder._id }}</span></div>
              <div><span class="text-chrome-500">Customer:</span> <span class="text-chrome-300 ml-2">{{ selectedOrder.user?.name }}</span></div>
              <div><span class="text-chrome-500">Email:</span> <span class="text-chrome-300 ml-2">{{ selectedOrder.user?.email }}</span></div>
              <div class="border-t border-chrome-700 pt-3">
                <p class="text-chrome-500 mb-2">Items:</p>
                @for (item of selectedOrder.items; track item.name) {
                  <div class="flex justify-between py-1">
                    <span class="text-chrome-400">{{ item.name }} × {{ item.quantity }}</span>
                    <span class="text-chrome-200">₹{{ item.price * item.quantity | number }}</span>
                  </div>
                }
              </div>
              <div class="border-t border-chrome-700 pt-3">
                <p class="text-chrome-500 mb-1">Shipping Address:</p>
                <p class="text-chrome-300">{{ selectedOrder.shippingAddress?.fullName }}, {{ selectedOrder.shippingAddress?.street }}, {{ selectedOrder.shippingAddress?.city }}, {{ selectedOrder.shippingAddress?.state }} - {{ selectedOrder.shippingAddress?.zipCode }}</p>
              </div>
              <div class="border-t border-chrome-700 pt-3 flex justify-between font-bold">
                <span class="text-chrome-200">Total:</span>
                <span class="text-white">₹{{ selectedOrder.totalAmount | number }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  selectedOrder: Order | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getOrders({ limit: 50 }).subscribe(res => this.orders = res.orders);
  }

  updateStatus(order: Order): void {
    this.orderService.updateOrderStatus(order._id, order.orderStatus).subscribe();
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
  }
}
