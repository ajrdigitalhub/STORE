import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in">
      <h1 class="text-2xl font-bold text-chrome-100 mb-6">Customers</h1>

      <div class="metallic-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-chrome-800">
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Name</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Email</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Phone</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Joined</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (customer of customers; track customer._id) {
                <tr class="border-b border-chrome-800/50 hover:bg-chrome-800/30 transition-colors">
                  <td class="px-4 py-3 text-chrome-200 text-sm">{{ customer.name }}</td>
                  <td class="px-4 py-3 text-chrome-400 text-sm">{{ customer.email }}</td>
                  <td class="px-4 py-3 text-chrome-400 text-sm">{{ customer.phone || '—' }}</td>
                  <td class="px-4 py-3 text-chrome-500 text-sm">{{ customer.createdAt | date:'mediumDate' }}</td>
                  <td class="px-4 py-3">
                    <button (click)="viewCustomer(customer)" class="text-chrome-400 hover:text-white text-sm transition-colors">View Orders</button>
                  </td>
                </tr>
              }
              @if (customers.length === 0) {
                <tr><td colspan="5" class="text-center py-8 text-chrome-600">No customers found</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Customer Orders Modal -->
      @if (selectedCustomer) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" (click)="selectedCustomer = null">
          <div class="metallic-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-slide-up" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h2 class="text-chrome-200 font-semibold text-lg">{{ selectedCustomer.user?.name }}</h2>
                <p class="text-chrome-500 text-sm">{{ selectedCustomer.user?.email }}</p>
              </div>
              <button (click)="selectedCustomer = null" class="text-chrome-500 hover:text-white">✕</button>
            </div>
            <h3 class="text-chrome-400 text-sm font-medium mb-3">Order History</h3>
            @if (selectedCustomer.orders?.length) {
              @for (order of selectedCustomer.orders; track order._id) {
                <div class="metallic-card p-3 mb-2 border-chrome-700">
                  <div class="flex justify-between text-sm">
                    <span class="text-chrome-400 font-mono">{{ order._id.slice(-8) }}</span>
                    <span class="metallic-badge text-xs">{{ order.orderStatus | titlecase }}</span>
                  </div>
                  <div class="flex justify-between mt-1 text-sm">
                    <span class="text-chrome-500">{{ order.createdAt | date:'short' }}</span>
                    <span class="text-chrome-200 font-medium">₹{{ order.totalAmount | number }}</span>
                  </div>
                </div>
              }
            } @else {
              <p class="text-chrome-600 text-sm">No orders yet</p>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class AdminCustomersComponent implements OnInit {
  customers: any[] = [];
  selectedCustomer: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getCustomers({ limit: 100 }).subscribe(res => this.customers = res.users);
  }

  viewCustomer(customer: any): void {
    this.adminService.getCustomer(customer._id).subscribe(data => this.selectedCustomer = data);
  }
}
