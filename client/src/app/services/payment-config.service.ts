import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentConfig {
  _id?: string;
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  merchantName: string;
  merchantLogo: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentConfigService {
  private apiUrl = `${environment.apiUrl}/payment-config`;

  constructor(private http: HttpClient) {}

  getPublicConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/public`);
  }

  getAdminConfig(): Observable<PaymentConfig> {
    return this.http.get<PaymentConfig>(`${this.apiUrl}/admin`);
  }

  updateConfig(data: PaymentConfig): Observable<PaymentConfig> {
    return this.http.post<PaymentConfig>(this.apiUrl, data);
  }
}
