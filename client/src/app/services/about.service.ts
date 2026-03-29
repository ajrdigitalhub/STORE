import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AboutContent {
  _id?: string;
  title: string;
  subtitle: string;
  description: string;
  mission: string;
  vision: string;
  lastUpdated?: string;
}

@Injectable({ providedIn: 'root' })
export class AboutService {
  private apiUrl = `${environment.apiUrl}/about`;

  constructor(private http: HttpClient) {}

  getAboutContent(): Observable<AboutContent> {
    return this.http.get<AboutContent>(this.apiUrl);
  }

  updateAboutContent(content: AboutContent): Observable<AboutContent> {
    return this.http.put<AboutContent>(this.apiUrl, content);
  }
}
