import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCustomers(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key]) httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get(`${this.apiUrl}/users`, { params: httpParams });
  }

  getCustomer(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  getCustomerCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/count`);
  }
}
