import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentConfigService, PaymentConfig } from '../services/payment-config.service';

@Component({
  selector: 'app-admin-payment-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold text-chrome-100">Payment Settings</h1>
      </div>

      <div class="max-w-2xl">
        <div class="metallic-card p-6 space-y-6">
          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-chrome-400 mb-1">Razorpay Key ID</label>
              <input [(ngModel)]="config.razorpayKeyId" class="metallic-input w-full" placeholder="rzp_live_..." />
            </div>

            <div>
              <label class="block text-sm font-medium text-chrome-400 mb-1">Razorpay Key Secret</label>
              <input [(ngModel)]="config.razorpayKeySecret" type="password" class="metallic-input w-full" placeholder="Enter secret key" />
              <p class="text-xs text-chrome-600 mt-1">This key is hidden for security but can be overwritten.</p>
            </div>

            <div class="border-t border-chrome-800 pt-6">
              <label class="block text-sm font-medium text-chrome-400 mb-1">Merchant Name</label>
              <input [(ngModel)]="config.merchantName" class="metallic-input w-full" placeholder="e.g. IDEAZONE3D" />
            </div>

            <div>
              <label class="block text-sm font-medium text-chrome-400 mb-1">Merchant Logo URL</label>
              <input [(ngModel)]="config.merchantLogo" class="metallic-input w-full" placeholder="https://..." />
              @if (config.merchantLogo) {
                <div class="mt-2 flex items-center space-x-4">
                  <span class="text-xs text-chrome-500">Preview:</span>
                  <img [src]="config.merchantLogo" alt="Logo" class="h-8 object-contain rounded border border-chrome-700 p-1 bg-chrome-900" />
                </div>
              }
            </div>
          </div>

          <div class="flex justify-end pt-4">
            <button (click)="save()" [disabled]="loading" class="metallic-btn-primary metallic-btn px-8 py-2">
              {{ loading ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>

          @if (message) {
            <div [class]="isError ? 'text-red-400' : 'text-green-400'" class="text-sm text-center mt-4">
              {{ message }}
            </div>
          }
        </div>

        <div class="mt-8 metallic-card p-6 border-chrome-800/50 bg-chrome-900/20">
          <h3 class="text-chrome-200 font-semibold mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2 text-chrome-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Help Information
          </h3>
          <ul class="text-sm text-chrome-500 space-y-2 list-disc list-inside">
            <li>Obtain your keys from the <a href="https://dashboard.razorpay.com/" target="_blank" class="text-chrome-300 hover:underline">Razorpay Dashboard</a>.</li>
            <li>Use <b>Test Mode</b> for development and <b>Live Mode</b> for production.</li>
            <li>The merchant name and logo will appear on the payment checkout popup.</li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class AdminPaymentConfigComponent implements OnInit {
  config: PaymentConfig = {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    merchantName: 'IDEAZONE3D',
    merchantLogo: ''
  };
  loading = false;
  message = '';
  isError = false;

  constructor(private configService: PaymentConfigService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.configService.getAdminConfig().subscribe({
      next: (config) => {
        if (config) this.config = config;
        this.loading = false;
      },
      error: () => {
        this.message = 'Failed to load configuration';
        this.isError = true;
        this.loading = false;
      }
    });
  }

  save(): void {
    if (!this.config.razorpayKeyId || !this.config.razorpayKeySecret) {
      this.message = 'Key ID and Secret are required';
      this.isError = true;
      return;
    }

    this.loading = true;
    this.message = '';
    this.configService.updateConfig(this.config).subscribe({
      next: () => {
        this.message = 'Configuration saved successfully';
        this.isError = false;
        this.loading = false;
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to save configuration';
        this.isError = true;
        this.loading = false;
      }
    });
  }
}
