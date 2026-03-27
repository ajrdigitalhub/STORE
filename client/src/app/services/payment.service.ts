import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  createRazorpayOrder(amount: number, orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-order`, { amount, orderId });
  }

  verifyPayment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify`, data);
  }

  openRazorpay(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const rzp = new Razorpay({
        ...options,
        handler: (response: any) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled'))
        }
      });
      rzp.open();
    });
  }
}
