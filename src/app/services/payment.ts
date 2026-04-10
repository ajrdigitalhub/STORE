import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  async getRazorpayKey(): Promise<string> {
    const res = await firstValueFrom(this.http.get<{ key: string }>('/api/payment/get-key'));
    return res.key;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createRazorpayOrder(amount: number): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return firstValueFrom(this.http.post<any>('/api/payment/create-order', { amount }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async verifyPayment(paymentData: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return firstValueFrom(this.http.post<any>('/api/payment/verify', paymentData));
  }

  loadRazorpayScript(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
