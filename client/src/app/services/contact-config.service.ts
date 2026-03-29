import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactConfig {
  _id?: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactConfigService {
  private apiUrl = `${environment.apiUrl}/contact-config`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<ContactConfig> {
    return this.http.get<ContactConfig>(this.apiUrl);
  }

  updateConfig(config: ContactConfig): Observable<ContactConfig> {
    return this.http.put<ContactConfig>(this.apiUrl, config);
  }
}
