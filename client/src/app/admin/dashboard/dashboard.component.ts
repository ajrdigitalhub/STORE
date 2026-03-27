import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, DashboardStats } from '../../services/order.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-fade-in">
      <h1 class="text-2xl font-bold text-chrome-100 mb-6">Dashboard</h1>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div class="metallic-card p-6 shimmer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-chrome-500 text-xs uppercase tracking-wider">Total Revenue</p>
              <p class="text-2xl font-bold text-chrome-100 mt-1">₹{{ stats.totalRevenue | number }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-chrome-700 to-chrome-800 flex items-center justify-center">
              <svg class="w-6 h-6 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>

        <div class="metallic-card p-6 shimmer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-chrome-500 text-xs uppercase tracking-wider">Total Orders</p>
              <p class="text-2xl font-bold text-chrome-100 mt-1">{{ stats.totalOrders }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-chrome-700 to-chrome-800 flex items-center justify-center">
              <svg class="w-6 h-6 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
          </div>
        </div>

        <div class="metallic-card p-6 shimmer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-chrome-500 text-xs uppercase tracking-wider">Pending Orders</p>
              <p class="text-2xl font-bold text-chrome-100 mt-1">{{ stats.pendingOrders }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-chrome-700 to-chrome-800 flex items-center justify-center">
              <svg class="w-6 h-6 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>
        </div>

        <div class="metallic-card p-6 shimmer">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-chrome-500 text-xs uppercase tracking-wider">Total Customers</p>
              <p class="text-2xl font-bold text-chrome-100 mt-1">{{ customerCount }}</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-chrome-700 to-chrome-800 flex items-center justify-center">
              <svg class="w-6 h-6 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="metallic-card overflow-hidden">
        <div class="p-4 border-b border-chrome-700 flex justify-between items-center">
          <h2 class="text-chrome-200 font-semibold">Recent Orders</h2>
          <a routerLink="/admin/orders" class="text-chrome-400 hover:text-white text-sm transition-colors">View All →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-chrome-800">
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Order ID</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Customer</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Amount</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Status</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              @for (order of stats.recentOrders; track order._id) {
                <tr class="border-b border-chrome-800/50 hover:bg-chrome-800/30 transition-colors">
                  <td class="px-4 py-3 text-chrome-300 text-sm font-mono">{{ order._id.slice(-8) }}</td>
                  <td class="px-4 py-3 text-chrome-300 text-sm">{{ order.user?.name || order.shippingAddress?.fullName || 'N/A' }}</td>
                  <td class="px-4 py-3 text-chrome-200 text-sm font-medium">₹{{ order.totalAmount | number }}</td>
                  <td class="px-4 py-3"><span class="metallic-badge text-xs">{{ order.orderStatus | titlecase }}</span></td>
                  <td class="px-4 py-3 text-chrome-500 text-sm">{{ order.createdAt | date:'short' }}</td>
                </tr>
              }
              @if (!stats.recentOrders || stats.recentOrders.length === 0) {
                <tr><td colspan="5" class="text-center py-8 text-chrome-600">No orders yet</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = { totalOrders: 0, pendingOrders: 0, totalRevenue: 0, recentOrders: [] };
  customerCount = 0;

  constructor(private orderService: OrderService, private adminService: AdminService) {}

  ngOnInit(): void {
    this.orderService.getDashboardStats().subscribe(data => this.stats = data);
    this.adminService.getCustomerCount().subscribe(data => this.customerCount = data.count);
  }
}
